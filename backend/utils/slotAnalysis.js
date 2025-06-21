const moment = require('moment-timezone');

/**
 * Generate available time slots within working hours
 * @param {Array} busyTimes - Array of busy time objects with start/end
 * @param {Object} dateRange - Object with start/end date strings
 * @param {string} contactTimezone - Contact's timezone
 * @param {Object} workingHours - Object with start/end hours (e.g., {start: 9, end: 17})
 * @param {number} duration - Meeting duration in minutes
 * @param {number} daysToGenerate - Number of days to look ahead
 * @returns {Array} Array of available slot objects
 */
function generateAvailableSlots(busyTimes, dateRange, contactTimezone, workingHours, duration, daysToGenerate) {
  const slots = [];
  const startDate = new Date(dateRange.start);
  const slotDurationMs = duration * 60 * 1000;
  const bufferMs = 15 * 60 * 1000; // 15-minute buffer
  
  // Add buffer to busy times
  const bufferedBusyTimes = busyTimes.map(busy => ({
    start: new Date(new Date(busy.start).getTime() - bufferMs).toISOString(),
    end: new Date(new Date(busy.end).getTime() + bufferMs).toISOString()
  }));

  // Generate slots for each day
  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    
    // Skip weekends
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      continue;
    }

    // Working hours in contact's timezone
    const dayStart = new Date(currentDate);
    dayStart.setHours(workingHours.start || 9, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(Math.floor(workingHours.end || 17), (workingHours.end % 1) * 60, 0, 0);

    // Convert to UTC for comparison
    const dayStartUTC = moment.tz(dayStart, contactTimezone).utc().toDate();
    const dayEndUTC = moment.tz(dayEnd, contactTimezone).utc().toDate();

    // Generate slots at 30-minute intervals
    let currentSlotStart = new Date(dayStartUTC);
    
    while (currentSlotStart < dayEndUTC) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
      
      // Check if this slot (with buffer) conflicts with any busy time
      // Pre-convert busy times to Date objects for efficiency
      const busyTimesConverted = bufferedBusyTimes.map(busy => ({
        start: new Date(busy.start),
        end: new Date(busy.end)
      }));

      const hasConflict = busyTimesConverted.some(busy => {
        return currentSlotStart < busy.end && currentSlotEnd > busy.start;
      });

      if (!hasConflict && currentSlotEnd <= dayEndUTC) {
        slots.push({
          start: currentSlotStart.toISOString(),
          end: currentSlotEnd.toISOString(),
          duration: duration,
          day: currentDate.toISOString().split('T')[0],
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          timeOfDay: getTimeOfDay(currentSlotStart)
        });
      }

      // Move to next potential slot
      currentSlotStart.setMinutes(currentSlotStart.getMinutes() + 30);
    }
  }

  return slots;
}

/**
 * Calculate quality score for a time slot
 * @param {Object} slot - Slot object with start/end times
 * @param {Array} preferences - Array of preferred times (e.g., ['morning', 'afternoon'])
 * @param {Object} options - Additional options like consultantMode
 * @returns {Object} Quality score object with score, reasons, and metadata
 */
function calculateSlotQuality(slot, preferences = ['morning', 'afternoon'], options = {}) {
  let score = 60; // Start at a good baseline
  const reasons = [];
  
  const slotStart = new Date(slot.start);
  const hour = slotStart.getUTCHours();
  const dayOfWeek = slotStart.getUTCDay();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

  // Apply contact's time preferences
  const timeOfDay = slot.timeOfDay;
  if (preferences.includes(timeOfDay)) {
    score += 15;
    reasons.push(`Matches preferred ${timeOfDay} time`);
  } else if (preferences.includes('any')) {
    score += 5;
    reasons.push('Flexible time preference');
  } else {
    score -= 10;
    reasons.push(`Outside preferred time (${preferences.join(', ')})`);
  }

  // Friday preference for consultants (toggleable)
  const consultantMode = options.consultantMode !== false;
  
  // Day of week scoring - moderate Friday boost
  const dayScores = {
    1: 0,   // Monday - neutral
    2: 5,   // Tuesday - slight positive
    3: 5,   // Wednesday - slight positive  
    4: 5,   // Thursday - slight positive
    5: consultantMode ? 15 : 5,  // Friday - moderate boost for consultants
    6: -30, // Saturday - strongly avoid
    0: -30  // Sunday - strongly avoid
  };
  
  score += dayScores[dayOfWeek] || 0;
  if (dayOfWeek === 5 && consultantMode) {
    reasons.push('Friday - consultants often at home office');
  }

  // Time of day scoring - simpler, focused on normal hours
  if (hour >= 9 && hour < 17) {
    // Within normal hours
    if (hour >= 10 && hour <= 11) {
      score += 10;
      reasons.push('Mid-morning - high energy');
    } else if (hour >= 14 && hour <= 16) {
      score += 10;
      reasons.push('Mid-afternoon - good for casual meetings');
    } else if (hour === 12 || hour === 13) {
      score -= 20;
      reasons.push('Lunch hour');
    }
  } else {
    // Outside normal hours - strongly penalize
    score -= 40;
    reasons.push('Outside normal working hours');
  }

  // Ensure score stays in range
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    reasons,
    timeOfDay: slot.timeOfDay,
    dayName,
    hourOfDay: hour
  };
}

/**
 * Helper to select optimal slots balancing quality and diversity
 * @param {Array} scoredSlots - Array of slots with quality scores
 * @param {number} count - Number of slots to select
 * @param {number} targetScore - Target quality score for fairness
 * @param {Array} existingBusy - Existing busy times to avoid conflicts
 * @returns {Array} Selected optimal slots
 */
function selectOptimalSlots(scoredSlots, count, targetScore, _existingBusy) {
  const selected = [];
  const usedDays = {};
  const timeDistribution = { morning: 0, afternoon: 0, evening: 0 };
  
  // Filter to slots near target score (within 20 points)
  const candidateSlots = scoredSlots.filter(s => 
    Math.abs(s.quality.score - targetScore) <= 20
  );
  
  // If not enough candidates, use all slots
  const slotsToConsider = candidateSlots.length >= count ? candidateSlots : scoredSlots;

  for (const slot of slotsToConsider) {
    if (selected.length >= count) break;
    
    const dayKey = slot.day;
    const timeKey = slot.timeOfDay;
    
    // Scoring for selection - prefer diverse days and times
    let selectionScore = slot.quality.score;
    
    // Penalize if we already have slots on this day
    if (usedDays[dayKey]) {
      selectionScore -= 15 * usedDays[dayKey];
    }
    
    // Bonus for time diversity
    const currentTimeCount = timeDistribution[timeKey] || 0;
    if (currentTimeCount === 0) {
      selectionScore += 10;
    } else {
      selectionScore -= 5 * currentTimeCount;
    }
    
    // Only select if score is still reasonable
    if (selectionScore >= 50) {
      selected.push(slot);
      usedDays[dayKey] = (usedDays[dayKey] || 0) + 1;
      timeDistribution[timeKey] = currentTimeCount + 1;
    }
  }
  
  // If we couldn't get enough with constraints, fill with best remaining
  if (selected.length < count) {
    for (const slot of slotsToConsider) {
      if (selected.length >= count) break;
      if (!selected.find(s => s.start === slot.start)) {
        selected.push(slot);
      }
    }
  }
  
  return selected.slice(0, count);
}

/**
 * Helper function to select diverse slots
 * @param {Array} scoredSlots - Array of slots with quality scores
 * @param {number} count - Number of slots to select
 * @returns {Array} Selected diverse slots
 */
function selectDiverseSlots(scoredSlots, count) {
  const selected = [];
  const usedDays = new Set();
  const usedHours = new Set();

  // First pass: pick best slots from different days
  for (const slot of scoredSlots) {
    if (selected.length >= count) break;
    
    const slotDate = new Date(slot.start);
    const dayKey = slot.day;
    const hourKey = slotDate.getUTCHours();
    
    // Prefer different days
    if (!usedDays.has(dayKey)) {
      selected.push(slot);
      usedDays.add(dayKey);
      usedHours.add(hourKey);
    }
  }

  // Second pass: fill remaining with best scores, trying to vary times
  for (const slot of scoredSlots) {
    if (selected.length >= count) break;
    
    const slotDate = new Date(slot.start);
    const hourKey = slotDate.getUTCHours();
    
    // Skip if already selected
    if (selected.find(s => s.start === slot.start)) continue;
    
    // Prefer different hours if possible
    if (!usedHours.has(hourKey) || selected.length < count - 1) {
      selected.push(slot);
      usedHours.add(hourKey);
    }
  }

  // Final pass: just fill with best remaining if still need more
  for (const slot of scoredSlots) {
    if (selected.length >= count) break;
    if (!selected.find(s => s.start === slot.start)) {
      selected.push(slot);
    }
  }

  return selected.slice(0, count);
}

/**
 * Helper to calculate standard deviation
 * @param {Array} values - Array of numeric values
 * @returns {number} Standard deviation
 */
function calculateStandardDeviation(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Helper function to determine time of day
 * @param {Date} date - Date object
 * @returns {string} Time of day ('morning', 'afternoon', 'evening')
 */
function getTimeOfDay(date) {
  const hour = date.getUTCHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

module.exports = {
  generateAvailableSlots,
  calculateSlotQuality,
  selectOptimalSlots,
  selectDiverseSlots,
  calculateStandardDeviation,
  getTimeOfDay
};