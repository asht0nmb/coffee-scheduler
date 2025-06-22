const moment = require('moment-timezone');

// ADVANCED SCHEDULING ALGORITHM - PHASE 1 IMPLEMENTATION
// Following specification in scheduling-algorithm-spec.md

/**
 * Scheduling configuration constants from technical specification
 */
const SCHEDULING_CONFIG = {
  // Hard constraints
  WORKING_HOURS_START: 8,          // 8 AM
  WORKING_HOURS_END: 18,           // 6 PM
  MINIMUM_BUFFER_MINUTES: 15,      // Between meetings
  SLOT_DURATION_MINUTES: 60,       // 1 hour slots
  
  // Soft preferences
  LUNCH_START: 12,
  LUNCH_END: 13,
  
  // Scoring weights
  BASE_SCORE_WEIGHT: 0.6,
  DAY_SCORE_WEIGHT: 0.2,
  DENSITY_SCORE_WEIGHT: 0.2,
  
  // Optimization parameters
  LOOKAHEAD_DEPTH: 2,
  LOOKAHEAD_WEIGHT: 0.3,
  MINIMUM_ACCEPTABLE_SCORE: 60,
  
  // Batch constraints
  MAX_CONTACTS_PER_BATCH: 10,
  DEFAULT_SLOTS_PER_CONTACT: 3,
};

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
 * Calculate base time score for a slot in contact's timezone
 * Following specification Section 4.1
 * @param {number} hour - Hour in 24-hour format in contact's timezone
 * @returns {number} Base score 0-100
 */
function calculateBaseTimeScore(hour) {
  // hour is in 24-hour format in contact's timezone
  
  if (hour < 8 || hour >= 18) return 0;  // Outside working hours
  
  const scores = {
    8: 65,   // 8 AM - Early but acceptable
    9: 75,   // 9 AM - Good morning start
    10: 85,  // 10 AM - Prime morning
    11: 80,  // 11 AM - Late morning
    12: 30,  // 12 PM - Lunch hour (avoid)
    13: 50,  // 1 PM - Post-lunch recovery
    14: 80,  // 2 PM - Prime afternoon
    15: 85,  // 3 PM - Peak afternoon
    16: 75,  // 4 PM - Late afternoon
    17: 60   // 5 PM - End of day
  };
  
  return scores[hour] || 50;
}

/**
 * Calculate day of week scoring
 * Following specification Section 4.2
 * @param {number} dayOfWeek - 0 = Sunday, 5 = Friday
 * @param {number} hour - Hour in contact's timezone
 * @param {Object} options - Options including consultantMode
 * @returns {number} Day score bonus/penalty
 */
function calculateDayScore(dayOfWeek, hour, options) {
  // dayOfWeek: 0 = Sunday, 5 = Friday
  
  let dayScore = 0;
  
  switch(dayOfWeek) {
    case 0: // Sunday
    case 6: // Saturday
      return -100;  // Hard no on weekends
      
    case 1: // Monday
      dayScore = -5;
      if (hour >= 14) dayScore += 5;  // Monday afternoon better
      break;
      
    case 2: // Tuesday
    case 3: // Wednesday  
    case 4: // Thursday
      dayScore = 10;  // Midweek bonus
      break;
      
    case 5: // Friday
      dayScore = 10;
      if (options.consultantMode) {
        dayScore += 15;  // Consultant Friday bonus
        if (hour >= 14) dayScore += 10;  // Friday afternoon golden
      }
      break;
  }
  
  return dayScore;
}

/**
 * Calculate meeting density scoring
 * Following specification Section 4.3
 * @param {Object} slot - Slot with start/end times
 * @param {Array} existingMeetings - Array of existing meetings
 * @returns {number} Density score bonus/penalty
 */
function calculateDensityScore(slot, existingMeetings) {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  let densityScore = 0;
  
  // Check meetings on same day
  const sameDayMeetings = existingMeetings.filter(meeting => {
    return isSameDay(meeting.start, new Date(slot.start));
  });
  
  // Penalty for too many meetings
  if (sameDayMeetings.length >= 4) densityScore -= 20;
  else if (sameDayMeetings.length >= 3) densityScore -= 10;
  
  // Check for back-to-back meetings
  const backToBack = existingMeetings.some(meeting => {
    const meetingEnd = new Date(meeting.end).getTime();
    const meetingStart = new Date(meeting.start).getTime();
    
    return Math.abs(meetingEnd - slotStart) < 30 * 60 * 1000 || 
           Math.abs(slotEnd - meetingStart) < 30 * 60 * 1000;
  });
  
  if (backToBack) densityScore -= 15;
  
  // Bonus for isolated meetings (2+ hours gap)
  const isolated = !existingMeetings.some(meeting => {
    const gap = Math.min(
      Math.abs(new Date(meeting.end).getTime() - slotStart),
      Math.abs(slotEnd - new Date(meeting.start).getTime())
    );
    return gap < 2 * 60 * 60 * 1000;
  });
  
  if (isolated) densityScore += 10;
  
  return densityScore;
}

/**
 * Helper function to check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Advanced quality calculation following specification Section 4.4
 * @param {Object} slot - Slot object with start/end times
 * @param {Object} contact - Contact object with timezone
 * @param {Array} userCalendar - User's calendar with busy slots
 * @param {Object} options - Additional options like consultantMode
 * @returns {Object} Comprehensive quality score object
 */
function calculateFinalScore(slot, contact, userCalendar, options = {}) {
  // Convert slot to contact timezone
  const contactTime = moment.utc(slot.start).tz(contact.timezone);
  const hour = contactTime.hour();
  const dayOfWeek = contactTime.day();
  
  // Component scores
  const baseScore = calculateBaseTimeScore(hour);
  if (baseScore === 0) return { 
    score: 0, 
    reasoning: ["Outside working hours"],
    breakdown: { baseScore: 0, dayScore: 0, densityScore: 0 }
  };
  
  const dayScore = calculateDayScore(dayOfWeek, hour, options);
  const densityScore = calculateDensityScore(slot, userCalendar.busySlots || []);
  
  // Weighted combination
  const finalScore = Math.max(0, Math.min(100,
    baseScore + dayScore + densityScore
  ));
  
  // Build reasoning
  const reasoning = [];
  if (hour === 10 || hour === 15) reasoning.push("Prime meeting time");
  if (dayOfWeek === 5 && hour >= 14) reasoning.push("Friday afternoon - relaxed atmosphere");
  if (densityScore > 0) reasoning.push("Good spacing from other meetings");
  if (densityScore < -10) reasoning.push("Warning: High meeting density");
  
  return {
    score: finalScore,
    contactTime: contactTime.format('h:mm A z'),
    reasoning,
    breakdown: { baseScore, dayScore, densityScore }
  };
}

/**
 * Legacy wrapper for backward compatibility
 * @param {Object} slot - Slot object with start/end times
 * @param {Array} preferences - Array of preferred times (e.g., ['morning', 'afternoon'])
 * @param {Object} options - Additional options like consultantMode
 * @returns {Object} Quality score object with score, reasons, and metadata
 */
function calculateSlotQuality(slot, preferences = ['morning', 'afternoon'], options = {}) {
  // Create mock contact and calendar for legacy compatibility
  const mockContact = { timezone: 'UTC' };
  const mockCalendar = { busySlots: [] };
  
  const result = calculateFinalScore(slot, mockContact, mockCalendar, options);
  
  // Convert to legacy format
  const slotStart = new Date(slot.start);
  const hour = slotStart.getUTCHours();
  const dayOfWeek = slotStart.getUTCDay();
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

  return {
    score: result.score,
    reasons: result.reasoning,
    timeOfDay: slot.timeOfDay || getTimeOfDay(slotStart),
    dayName,
    hourOfDay: hour,
    breakdown: result.breakdown
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

// PHASE 1: ADVANCED SCHEDULING ALGORITHM COMPONENTS

/**
 * Build Quality Matrix for all slot/contact combinations
 * Following specification Section 2.2 step 2
 * @param {Array} userSlots - Available slots in user's timezone
 * @param {Array} contacts - Array of contact objects with timezones
 * @param {Object} userCalendar - User's calendar with busy slots
 * @param {Object} options - Scheduling options
 * @returns {Object} Quality matrix [slotId][contactId] = QualityScore
 */
function buildQualityMatrix(userSlots, contacts, userCalendar, options = {}) {
  const qualityMatrix = {};
  
  for (const slot of userSlots) {
    const slotId = slot.start; // Use ISO string as ID
    qualityMatrix[slotId] = {};
    
    for (const contact of contacts) {
      // Convert slot to contact's timezone and check validity
      const contactTime = moment.utc(slot.start).tz(contact.timezone);
      const hour = contactTime.hour();
      
      // Check if within contact's working hours (8am-6pm)
      if (hour < SCHEDULING_CONFIG.WORKING_HOURS_START || 
          hour >= SCHEDULING_CONFIG.WORKING_HOURS_END) {
        qualityMatrix[slotId][contact.id] = {
          score: 0,
          contactTime: contactTime.format('h:mm A z'),
          reasoning: ["Outside working hours in contact timezone"],
          breakdown: { baseScore: 0, dayScore: 0, densityScore: 0 }
        };
      } else {
        // Calculate quality score using advanced algorithm
        qualityMatrix[slotId][contact.id] = calculateFinalScore(
          slot, 
          contact, 
          userCalendar, 
          options
        );
      }
    }
  }
  
  return qualityMatrix;
}

/**
 * Order contacts by scheduling difficulty
 * Following specification Section 5.1
 * @param {Object} qualityMatrix - Quality matrix from buildQualityMatrix
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Contacts ordered by difficulty (most constrained first)
 */
function orderContactsByDifficulty(qualityMatrix, contacts) {
  return contacts
    .map(contact => {
      // Count slots with acceptable scores
      const goodSlots = Object.keys(qualityMatrix)
        .filter(slotId => qualityMatrix[slotId][contact.id].score >= SCHEDULING_CONFIG.MINIMUM_ACCEPTABLE_SCORE);
      
      // Calculate average score for top 10 slots
      const topSlots = Object.keys(qualityMatrix)
        .map(slotId => qualityMatrix[slotId][contact.id])
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      const avgTopScore = topSlots.length > 0 ? 
        topSlots.reduce((sum, s) => sum + s.score, 0) / topSlots.length : 0;
      
      return {
        contact,
        goodSlotCount: goodSlots.length,
        avgTopScore,
        difficulty: 1 / (goodSlots.length + 1)  // Avoid division by zero
      };
    })
    .sort((a, b) => {
      // Primary sort: fewer good slots = higher priority
      if (a.goodSlotCount !== b.goodSlotCount) {
        return a.goodSlotCount - b.goodSlotCount;
      }
      // Secondary sort: lower average score = higher priority
      return a.avgTopScore - b.avgTopScore;
    })
    .map(item => item.contact);
}

/**
 * Calculate lookahead impact for greedy assignment
 * Following specification Section 2.3
 * @param {string} slotId - Slot being considered
 * @param {Array} remainingContacts - Contacts not yet assigned
 * @param {Object} qualityMatrix - Quality matrix
 * @param {Set} usedSlots - Already used slot IDs
 * @param {number} depth - Lookahead depth (default 2)
 * @returns {number} Impact score (negative = bad impact on future choices)
 */
function calculateLookaheadImpact(slotId, remainingContacts, qualityMatrix, usedSlots, depth = 2) {
  if (remainingContacts.length === 0 || depth === 0) return 0;
  
  const simulatedUsedSlots = new Set([...usedSlots, slotId]);
  let impactScore = 0;
  
  // Check impact on next 'depth' contacts
  const contactsToCheck = remainingContacts.slice(0, depth);
  
  for (const contact of contactsToCheck) {
    // Find best available score with current used slots
    const currentBest = Object.keys(qualityMatrix)
      .filter(sid => !usedSlots.has(sid))
      .map(sid => qualityMatrix[sid][contact.id].score)
      .reduce((max, score) => Math.max(max, score), 0);
    
    // Find best available score with simulated used slots
    const futureBest = Object.keys(qualityMatrix)
      .filter(sid => !simulatedUsedSlots.has(sid))
      .map(sid => qualityMatrix[sid][contact.id].score)
      .reduce((max, score) => Math.max(max, score), 0);
    
    impactScore += (currentBest - futureBest);
  }
  
  return -impactScore * SCHEDULING_CONFIG.LOOKAHEAD_WEIGHT;  // 30% weight for future impact
}

/**
 * Assign slots using constrained greedy with lookahead
 * Following specification Section 5.2
 * @param {Array} orderedContacts - Contacts ordered by difficulty
 * @param {Object} qualityMatrix - Quality matrix
 * @param {number} slotsPerContact - Number of slots to assign per contact
 * @returns {Object} Assignments {contactId: [slotIds]}
 */
function assignSlotsWithLookahead(orderedContacts, qualityMatrix, slotsPerContact) {
  const assignments = {};
  const usedSlots = new Set();
  
  for (let i = 0; i < orderedContacts.length; i++) {
    const contact = orderedContacts[i];
    const remainingContacts = orderedContacts.slice(i + 1);
    
    // Get all available slots
    const availableSlots = Object.keys(qualityMatrix)
      .filter(slotId => !usedSlots.has(slotId))
      .map(slotId => ({
        slotId,
        immediateScore: qualityMatrix[slotId][contact.id].score,
        lookaheadImpact: calculateLookaheadImpact(
          slotId,
          remainingContacts,
          qualityMatrix,
          usedSlots,
          SCHEDULING_CONFIG.LOOKAHEAD_DEPTH
        )
      }));
    
    // Calculate effective scores
    availableSlots.forEach(slot => {
      slot.effectiveScore = slot.immediateScore + slot.lookaheadImpact;
    });
    
    // Sort by effective score
    availableSlots.sort((a, b) => b.effectiveScore - a.effectiveScore);
    
    // Select top slots
    const selectedSlots = [];
    for (const slot of availableSlots) {
      if (selectedSlots.length >= slotsPerContact) break;
      if (slot.immediateScore >= SCHEDULING_CONFIG.MINIMUM_ACCEPTABLE_SCORE) {
        selectedSlots.push(slot.slotId);
        usedSlots.add(slot.slotId);
      }
    }
    
    // Handle case where not enough good slots
    if (selectedSlots.length < slotsPerContact) {
      // Take best available even if below threshold
      for (const slot of availableSlots) {
        if (selectedSlots.length >= slotsPerContact) break;
        if (!selectedSlots.includes(slot.slotId)) {
          selectedSlots.push(slot.slotId);
          usedSlots.add(slot.slotId);
        }
      }
    }
    
    assignments[contact.id] = selectedSlots;
  }
  
  return assignments;
}

/**
 * Local Search Optimization - Phase 2
 * Following specification Section 5.3
 * @param {Object} assignments - Current assignments {contactId: [slotIds]}
 * @param {Object} qualityMatrix - Quality matrix
 * @param {number} maxIterations - Maximum optimization iterations
 * @returns {Object} Optimized assignments
 */
function optimizeAssignmentLocally(assignments, qualityMatrix, maxIterations = 100) {
  let improved = true;
  let iterations = 0;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Try all pairwise swaps
    const contactIds = Object.keys(assignments);
    
    for (let i = 0; i < contactIds.length; i++) {
      for (let j = i + 1; j < contactIds.length; j++) {
        const contact1 = contactIds[i];
        const contact2 = contactIds[j];
        
        // Try swapping each pair of slots
        for (const slot1 of assignments[contact1]) {
          for (const slot2 of assignments[contact2]) {
            const currentScore = 
              qualityMatrix[slot1][contact1].score +
              qualityMatrix[slot2][contact2].score;
            
            const swappedScore = 
              qualityMatrix[slot2][contact1].score +
              qualityMatrix[slot1][contact2].score;
            
            // Only swap if both contacts still get acceptable slots
            const swap1Acceptable = qualityMatrix[slot2][contact1].score >= SCHEDULING_CONFIG.MINIMUM_ACCEPTABLE_SCORE;
            const swap2Acceptable = qualityMatrix[slot1][contact2].score >= SCHEDULING_CONFIG.MINIMUM_ACCEPTABLE_SCORE;
            
            if (swappedScore > currentScore && swap1Acceptable && swap2Acceptable) {
              // Perform swap
              assignments[contact1] = assignments[contact1]
                .filter(s => s !== slot1)
                .concat([slot2]);
              assignments[contact2] = assignments[contact2]
                .filter(s => s !== slot2)
                .concat([slot1]);
              
              improved = true;
              console.log(`🔄 Local optimization: Swapped slots for ${contact1} and ${contact2}, score improvement: ${swappedScore - currentScore}`);
            }
          }
        }
      }
    }
  }
  
  console.log(`🎯 Local optimization completed after ${iterations} iterations`);
  return assignments;
}

/**
 * Enhanced insufficient slots handling
 * Following specification Section 6.1
 * @param {Array} availableSlots - Available slots
 * @param {Array} contacts - Array of contacts
 * @param {number} slotsPerContact - Requested slots per contact
 * @returns {Object|null} Error/warning object or null if no issues
 */
function handleInsufficientSlots(availableSlots, contacts, slotsPerContact) {
  const totalNeeded = contacts.length * slotsPerContact;
  const totalAvailable = availableSlots.length;
  
  if (totalAvailable === 0) {
    return {
      error: "NO_AVAILABILITY",
      message: "No available time slots found in the specified date range",
      suggestion: "Try extending the date range or reducing meeting constraints"
    };
  }
  
  if (totalAvailable < contacts.length) {
    return {
      error: "SEVERE_SHORTAGE", 
      message: `Only ${totalAvailable} slots for ${contacts.length} contacts`,
      suggestion: "Cannot schedule all contacts. Consider scheduling in multiple batches."
    };
  }
  
  if (totalAvailable < totalNeeded) {
    const adjustedSlots = Math.floor(totalAvailable / contacts.length);
    return {
      warning: "REDUCED_SLOTS",
      message: `Reduced to ${adjustedSlots} slots per contact`,
      adjustedSlotsPerContact: adjustedSlots
    };
  }
  
  return null;  // No issues
}

/**
 * Extreme timezone handling
 * Following specification Section 6.2
 * @param {Object} contact - Contact object
 * @param {Object} qualityMatrix - Quality matrix  
 * @param {string} userTimezone - User's timezone
 * @returns {Object|null} Special handling strategy or null
 */
function handleExtremeTimezones(contact, qualityMatrix, userTimezone) {
  // Calculate timezone difference
  const now = new Date();
  const userOffset = moment.tz(now, userTimezone).utcOffset();
  const contactOffset = moment.tz(now, contact.timezone).utcOffset();
  const timeDiff = Math.abs(userOffset - contactOffset) / 60; // Convert to hours
  
  // If time difference > 12 hours, we have an extreme case
  if (timeDiff > 12) {
    const scores = Object.values(qualityMatrix)
      .map(slots => slots[contact.id]?.score || 0)
      .filter(score => score > 0);
    
    if (scores.length === 0) {
      // No valid slots within normal hours
      return {
        strategy: "RELAX_CONSTRAINTS",
        message: `No standard working hours overlap with ${contact.name} (${contact.timezone})`,
        action: "Relaxing working hours to 7 AM - 7 PM for this contact",
        relaxedConstraints: {
          workingHoursStart: 7,
          workingHoursEnd: 19
        }
      };
    }
    
    const avgScore = scores.reduce((a, b) => a + b) / scores.length;
    if (avgScore < 50) {
      return {
        strategy: "COMPROMISE",
        message: `Limited good times due to ${Math.abs(timeDiff)}-hour time difference`,
        action: "Showing best available options despite suboptimal timing"
      };
    }
  }
  
  return null;  // No special handling needed
}

/**
 * Meeting density detection and warnings
 * Following specification Section 6.3
 * @param {Object} userCalendar - User's calendar
 * @param {Array} proposedSlots - Proposed meeting slots
 * @param {number} threshold - Meeting threshold per day
 * @returns {Object|null} Warning object or null
 */
function detectMeetingOverload(userCalendar, proposedSlots, threshold = 4) {
  const slotsByDay = {};
  
  // Group existing meetings by day
  (userCalendar.busySlots || []).forEach(meeting => {
    const day = new Date(meeting.start).toDateString();
    slotsByDay[day] = (slotsByDay[day] || 0) + 1;
  });
  
  // Add proposed slots
  proposedSlots.forEach(slot => {
    const day = new Date(slot.start).toDateString();
    slotsByDay[day] = (slotsByDay[day] || 0) + 1;
  });
  
  // Check for overload
  const overloadDays = Object.entries(slotsByDay)
    .filter(([day, count]) => count > threshold)
    .map(([day, count]) => ({ day, count }));
  
  if (overloadDays.length > 0) {
    return {
      warning: "MEETING_OVERLOAD",
      message: "High meeting density detected",
      overloadDays,
      suggestion: "Consider spreading meetings across more days"
    };
  }
  
  return null;
}

/**
 * Enhanced explanation generator
 * Following specification Appendix A
 * @param {Object} slot - Slot object
 * @param {Object} contact - Contact object
 * @param {number} score - Quality score
 * @param {Object} factors - Scoring factors
 * @returns {Object} Explanation object
 */
function generateExplanation(slot, contact, score, factors) {
  const templates = {
    goldenSlot: {
      primary: "Premium Friday afternoon slot",
      factors: [
        "Relaxed end-of-week atmosphere",
        "No meetings scheduled after",
        `Optimal time in ${contact.timezone}`
      ]
    },
    
    morningSlot: {
      primary: "Prime morning meeting time",
      factors: [
        "High-energy morning hours",
        "Before the lunch break",
        "Clear calendar surrounding"
      ]
    },
    
    compromiseSlot: {
      primary: "Best available given constraints",
      factors: [
        "Limited overlap due to timezone difference",
        "Acceptable time for both parties",
        "Minimal disruption to existing schedule"
      ]
    },
    
    suboptimalSlot: {
      primary: "Workable but not ideal timing",
      factors: [
        "Some scheduling constraints present"
      ],
      warnings: [
        "Consider confirming this time works"
      ]
    }
  };
  
  // Select appropriate template based on score and factors
  let template;
  const contactTime = moment.utc(slot.start).tz(contact.timezone);
  const hour = contactTime.hour();
  const dayOfWeek = contactTime.day();
  
  if (score >= 85 && dayOfWeek === 5 && hour >= 14) {
    template = templates.goldenSlot;
  } else if (score >= 80 && hour >= 9 && hour <= 11) {
    template = templates.morningSlot;
  } else if (score >= 60) {
    template = templates.compromiseSlot;
  } else {
    template = templates.suboptimalSlot;
  }
  
  return {
    primary: template.primary,
    factors: template.factors,
    warnings: template.warnings
  };
}

/**
 * Main scheduling algorithm implementation - Enhanced Version
 * Following specification Section 2.2 with Phase 2 & 3 improvements
 * @param {Object} userCalendar - User's calendar with busy slots
 * @param {Array} contacts - Array of contact objects
 * @param {Object} dateRange - Date range {start, end}
 * @param {Object} options - Scheduling options
 * @returns {Object} Scheduling results with assignments and metadata
 */
function optimizeCoffeeChats(userCalendar, contacts, dateRange, options = {}) {
  const startTime = Date.now();
  const slotsPerContact = options.slotsPerContact || SCHEDULING_CONFIG.DEFAULT_SLOTS_PER_CONTACT;
  const warnings = [];
  const specialHandling = [];
  
  // STEP 1: Extract user availability
  const userSlots = generateAvailableSlots(
    userCalendar.busySlots || [],
    dateRange,
    'UTC', // Generate in UTC first
    options.workingHours || { start: SCHEDULING_CONFIG.WORKING_HOURS_START, end: SCHEDULING_CONFIG.WORKING_HOURS_END },
    SCHEDULING_CONFIG.SLOT_DURATION_MINUTES,
    14 // 2 weeks
  );
  
  // PHASE 3: Check for insufficient slots early
  const slotCheck = handleInsufficientSlots(userSlots, contacts, slotsPerContact);
  if (slotCheck?.error) {
    return {
      success: false,
      error: slotCheck.error,
      message: slotCheck.message,
      suggestion: slotCheck.suggestion
    };
  }
  if (slotCheck?.warning) {
    warnings.push(slotCheck);
    // Adjust slotsPerContact if needed
    if (slotCheck.adjustedSlotsPerContact) {
      slotsPerContact = slotCheck.adjustedSlotsPerContact;
    }
  }
  
  // STEP 2: Build quality matrix
  const qualityMatrix = buildQualityMatrix(userSlots, contacts, userCalendar, options);
  
  // PHASE 3: Handle extreme timezones for each contact
  const userTimezone = options.userTimezone || 'UTC';
  for (const contact of contacts) {
    const tzHandling = handleExtremeTimezones(contact, qualityMatrix, userTimezone);
    if (tzHandling) {
      specialHandling.push({
        contactId: contact.id,
        contactName: contact.name,
        ...tzHandling
      });
      
      // If we need to relax constraints, rebuild quality matrix for this contact with relaxed hours
      if (tzHandling.strategy === 'RELAX_CONSTRAINTS') {
        console.log(`🌏 Relaxing constraints for ${contact.name} due to extreme timezone`);
        
        // Rebuild slots with relaxed working hours for this specific contact
        const relaxedSlots = generateAvailableSlots(
          userCalendar.busySlots || [],
          dateRange,
          'UTC',
          tzHandling.relaxedConstraints,
          SCHEDULING_CONFIG.SLOT_DURATION_MINUTES,
          14
        );
        
        // Update quality matrix for this contact with relaxed slots
        for (const slot of relaxedSlots) {
          const slotId = slot.start;
          if (!qualityMatrix[slotId]) {
            qualityMatrix[slotId] = {};
          }
          
          const contactTime = moment.utc(slot.start).tz(contact.timezone);
          const hour = contactTime.hour();
          
          // Check if within relaxed working hours (7am-7pm)
          if (hour >= 7 && hour < 19) {
            qualityMatrix[slotId][contact.id] = calculateFinalScore(
              slot, 
              contact, 
              userCalendar, 
              options
            );
          }
        }
      }
    }
  }
  
  // STEP 3: Analyze constraints and order contacts by difficulty
  const orderedContacts = orderContactsByDifficulty(qualityMatrix, contacts);
  
  // STEP 4: Assign slots using constrained greedy with lookahead
  let assignments = assignSlotsWithLookahead(orderedContacts, qualityMatrix, slotsPerContact);
  
  // PHASE 2: Apply local search optimization
  console.log('🔍 Starting local search optimization...');
  assignments = optimizeAssignmentLocally(assignments, qualityMatrix, 50);
  
  // PHASE 3: Check for meeting density issues
  const allProposedSlots = Object.values(assignments)
    .flat()
    .map(slotId => userSlots.find(s => s.start === slotId))
    .filter(Boolean);
  
  const densityWarning = detectMeetingOverload(userCalendar, allProposedSlots, 4);
  if (densityWarning) {
    warnings.push(densityWarning);
  }
  
  // STEP 5: Format results with enhanced explanations
  const results = contacts.map(contact => {
    const contactSlots = assignments[contact.id] || [];
    
    const contactSpecialHandling = specialHandling.find(h => h.contactId === contact.id);
    
    return {
      contactId: contact.id,
      contactName: contact.name,
      contactTimezone: contact.timezone,
      suggestedSlots: contactSlots.map(slotId => {
        const slot = userSlots.find(s => s.start === slotId);
        const quality = qualityMatrix[slotId][contact.id];
        
        // Generate enhanced explanation
        const explanation = generateExplanation(slot, contact, quality.score, quality.breakdown);
        
        return {
          start: slot.start,
          end: slot.end,
          score: quality.score,
          userDisplayTime: moment.utc(slot.start).format('ddd, MMM D [at] h:mm A z'),
          contactDisplayTime: quality.contactTime,
          explanation: {
            primary: explanation.primary,
            factors: explanation.factors || quality.reasoning,
            warnings: explanation.warnings || (quality.score < 70 ? ["Suboptimal timing - consider confirming"] : undefined)
          }
        };
      }),
      alternativeAction: contactSpecialHandling ? {
        reason: contactSpecialHandling.message,
        suggestion: contactSpecialHandling.action
      } : undefined
    };
  });
  
  // Calculate enhanced metadata
  const allScores = results.flatMap(r => r.suggestedSlots.map(s => s.score));
  const avgQuality = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  
  // Calculate fairness metrics
  const contactAverages = results.map(r => {
    const scores = r.suggestedSlots.map(s => s.score);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });
  const fairnessScore = contactAverages.length > 1 ? 
    100 - calculateStandardDeviation(contactAverages) : 100;
  
  return {
    success: true,
    results,
    metadata: {
      totalSlotsAnalyzed: userSlots.length,
      averageQuality: Math.round(avgQuality),
      fairnessScore: Math.round(fairnessScore),
      processingTime: Date.now() - startTime,
      algorithm: 'constrained-greedy-v2.0-enhanced',
      optimizationApplied: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      specialHandling: specialHandling.length > 0 ? specialHandling : undefined
    }
  };
}

module.exports = {
  // Legacy exports for backward compatibility
  generateAvailableSlots,
  calculateSlotQuality,
  selectOptimalSlots,
  selectDiverseSlots,
  calculateStandardDeviation,
  getTimeOfDay,
  
  // Phase 1: Core Algorithm
  SCHEDULING_CONFIG,
  calculateBaseTimeScore,
  calculateDayScore,
  calculateDensityScore,
  calculateFinalScore,
  buildQualityMatrix,
  orderContactsByDifficulty,
  calculateLookaheadImpact,
  assignSlotsWithLookahead,
  
  // Phase 2: Optimization Layer
  optimizeAssignmentLocally,
  
  // Phase 3: Edge Case Handling
  handleInsufficientSlots,
  handleExtremeTimezones,
  detectMeetingOverload,
  generateExplanation,
  
  // Main Algorithm (All Phases)
  optimizeCoffeeChats
};