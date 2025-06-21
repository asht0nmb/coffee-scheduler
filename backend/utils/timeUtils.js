const moment = require('moment-timezone');

/**
 * Format time for specific timezone
 * @param {string} isoString - ISO date string
 * @param {string} timezone - Target timezone
 * @returns {string} Formatted time string
 */
function formatTimeForTimezone(isoString, timezone) {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short'
    });
  } catch (error) {
    return isoString; // Fallback
  }
}

/**
 * Convert timezone to UTC
 * @param {Date|string} date - Date object or string
 * @param {string} timezone - Source timezone
 * @returns {Date} UTC Date object
 */
function convertTimezoneToUTC(date, timezone) {
  return moment.tz(date, timezone).utc().toDate();
}

/**
 * Convert UTC to timezone
 * @param {Date|string} date - UTC date object or string
 * @param {string} timezone - Target timezone
 * @returns {Date} Date object in target timezone
 */
function convertUTCToTimezone(date, timezone) {
  return moment.utc(date).tz(timezone).toDate();
}

/**
 * Group slots by day
 * @param {Array} slots - Array of slot objects
 * @returns {Object} Object with day keys and slot arrays
 */
function groupSlotsByDay(slots) {
  const grouped = {};
  slots.forEach(slot => {
    const day = slot.day;
    if (!grouped[day]) {
      grouped[day] = [];
    }
    grouped[day].push(slot);
  });
  return grouped;
}

/**
 * Select optimal distribution of slots
 * @param {Array} rankedSlots - Array of ranked slots
 * @param {number} targetCount - Target number of slots
 * @returns {Array} Optimally distributed slots
 */
function selectOptimalDistribution(rankedSlots, targetCount) {
  const selected = [];
  const usedDays = new Set();
  const usedTimeSlots = new Set();

  // First pass: pick best slots from different days and times
  for (const slot of rankedSlots) {
    if (selected.length >= targetCount) break;
    
    const dayTimeKey = `${slot.day}-${slot.timeOfDay}`;
    
    if (!usedDays.has(slot.day) || (!usedTimeSlots.has(dayTimeKey) && selected.length < 2)) {
      selected.push(slot);
      usedDays.add(slot.day);
      usedTimeSlots.add(dayTimeKey);
    }
  }

  // Second pass: fill remaining slots if needed
  for (const slot of rankedSlots) {
    if (selected.length >= targetCount) break;
    if (!selected.find(s => s.start === slot.start)) {
      selected.push(slot);
    }
  }

  return selected.slice(0, targetCount);
}

/**
 * Generate recommendations based on analysis
 * @param {Array} slots - Array of analyzed slots
 * @param {Array} preferences - User preferences
 * @returns {Array} Array of recommendation strings
 */
function generateRecommendations(slots, preferences) {
  const recommendations = [];
  
  if (slots.length === 0) {
    recommendations.push('No available slots found. Consider extending the date range or adjusting working hours.');
    return recommendations;
  }

  const avgScore = slots.reduce((sum, slot) => sum + slot.quality.score, 0) / slots.length;
  
  if (avgScore > 80) {
    recommendations.push('Excellent availability! Multiple high-quality time slots available.');
  } else if (avgScore > 60) {
    recommendations.push('Good availability with some optimal time slots.');
  } else {
    recommendations.push('Limited optimal slots. Consider adjusting time preferences or extending date range.');
  }

  const morningSlots = slots.filter(s => s.timeOfDay === 'morning').length;
  const afternoonSlots = slots.filter(s => s.timeOfDay === 'afternoon').length;

  if (morningSlots > afternoonSlots && !preferences.includes('morning')) {
    recommendations.push('Consider morning meetings - better availability detected.');
  }

  return recommendations;
}

/**
 * Get current time in specific timezone
 * @param {string} timezone - Target timezone
 * @returns {Date} Current time in target timezone
 */
function getCurrentTimeInTimezone(timezone) {
  return moment().tz(timezone).toDate();
}

/**
 * Check if time is within business hours
 * @param {Date|string} time - Time to check
 * @param {string} timezone - Timezone for the check
 * @param {Object} businessHours - Business hours object {start: 9, end: 17}
 * @returns {boolean} True if within business hours
 */
function isWithinBusinessHours(time, timezone, businessHours = { start: 9, end: 17 }) {
  const timeInTz = moment.tz(time, timezone);
  const hour = timeInTz.hour();
  const minute = timeInTz.minute();
  const hourDecimal = hour + (minute / 60);
  
  return hourDecimal >= businessHours.start && hourDecimal <= businessHours.end;
}

/**
 * Calculate time difference between two timezones
 * @param {string} timezone1 - First timezone
 * @param {string} timezone2 - Second timezone
 * @param {Date} referenceTime - Reference time (defaults to now)
 * @returns {number} Time difference in hours
 */
function getTimezoneOffset(timezone1, timezone2, referenceTime = new Date()) {
  const time1 = moment.tz(referenceTime, timezone1);
  const time2 = moment.tz(referenceTime, timezone2);
  return time1.utcOffset() - time2.utcOffset();
}

/**
 * Format duration in a human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  } else if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
  }
}

/**
 * Check if a date is a weekend
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if weekend
 */
function isWeekend(date) {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Get next business day
 * @param {Date|string} date - Starting date
 * @param {string} timezone - Timezone for calculation
 * @returns {Date} Next business day
 */
function getNextBusinessDay(date, timezone) {
  let nextDay = moment.tz(date, timezone).add(1, 'day');
  
  while (nextDay.day() === 0 || nextDay.day() === 6) {
    nextDay = nextDay.add(1, 'day');
  }
  
  return nextDay.toDate();
}

/**
 * Calculate buffer time around an event
 * @param {string} startTime - ISO start time
 * @param {string} endTime - ISO end time
 * @param {number} bufferMinutes - Buffer in minutes
 * @returns {Object} Object with buffered start and end times
 */
function addBufferTime(startTime, endTime, bufferMinutes = 15) {
  const bufferedStart = new Date(new Date(startTime).getTime() - bufferMinutes * 60 * 1000);
  const bufferedEnd = new Date(new Date(endTime).getTime() + bufferMinutes * 60 * 1000);
  
  return {
    start: bufferedStart.toISOString(),
    end: bufferedEnd.toISOString()
  };
}

module.exports = {
  formatTimeForTimezone,
  convertTimezoneToUTC,
  convertUTCToTimezone,
  groupSlotsByDay,
  selectOptimalDistribution,
  generateRecommendations,
  getCurrentTimeInTimezone,
  isWithinBusinessHours,
  getTimezoneOffset,
  formatDuration,
  isWeekend,
  getNextBusinessDay,
  addBufferTime
};