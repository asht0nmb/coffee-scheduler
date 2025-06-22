// Input validation middleware
const mongoose = require('mongoose');

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateTimezone = (timezone) => {
  try {
    // Basic timezone validation - check if it's a string and has proper format
    if (typeof timezone !== 'string') return false;
    
    // Common timezone patterns
    const timezoneRegex = /^[A-Z][a-z]+\/[A-Za-z_]+$/;
    return timezoneRegex.test(timezone);
  } catch (error) {
    return false;
  }
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (start >= end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  const maxRangeDays = 90; // Maximum 90 days range
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  
  if (diffDays > maxRangeDays) {
    return { valid: false, error: `Date range cannot exceed ${maxRangeDays} days` };
  }
  
  return { valid: true };
};

const validateContactData = (req, res, next) => {
  const { name, email, timezone } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: 'Valid name is required' });
  }
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  
  if (!timezone || !validateTimezone(timezone)) {
    return res.status(400).json({ error: 'Valid timezone is required' });
  }
  
  // Sanitize inputs
  req.body.name = name.trim();
  req.body.email = email.toLowerCase().trim();
  
  next();
};

const validateDateRangeQuery = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      error: 'startDate and endDate query parameters are required' 
    });
  }
  
  const validation = validateDateRange(startDate, endDate);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  next();
};

const validateBatchRequest = (req, res, next) => {
  const { contactEmails, dateRange } = req.body;
  
  if (!Array.isArray(contactEmails) || contactEmails.length === 0) {
    return res.status(400).json({ error: 'contactEmails array is required' });
  }
  
  if (contactEmails.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 contacts allowed per batch' });
  }
  
  // Validate each email
  for (const email of contactEmails) {
    if (!validateEmail(email)) {
      return res.status(400).json({ error: `Invalid email: ${email}` });
    }
  }
  
  if (!dateRange || !dateRange.start || !dateRange.end) {
    return res.status(400).json({ error: 'dateRange with start and end is required' });
  }
  
  const validation = validateDateRange(dateRange.start, dateRange.end);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  next();
};

// New comprehensive validation for scheduling requests
const validateSchedulingRequest = (req, res, next) => {
  const { contactIds, slotsPerContact, dateRange, consultantMode } = req.body;
  
  // Validate contactIds
  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return res.status(400).json({ 
      error: 'contactIds array is required',
      example: { contactIds: ['64a1b2c3d4e5f6789012345'] }
    });
  }
  
  if (contactIds.length > 50) {
    return res.status(400).json({ 
      error: 'Maximum 50 contacts per batch',
      limit: 50,
      received: contactIds.length
    });
  }
  
  // Validate ObjectId format
  if (!contactIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ 
      error: 'Invalid contact ID format',
      details: 'Contact IDs must be valid MongoDB ObjectIds'
    });
  }
  
  // Validate slotsPerContact
  if (typeof slotsPerContact !== 'number' || slotsPerContact < 1 || slotsPerContact > 10) {
    return res.status(400).json({ 
      error: 'slotsPerContact must be between 1 and 10',
      validRange: { min: 1, max: 10 },
      received: slotsPerContact
    });
  }
  
  // Validate dateRange if provided
  if (dateRange) {
    const validation = validateDateRange(dateRange.start, dateRange.end);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error,
        format: 'Use ISO 8601 format: 2024-03-15T00:00:00Z'
      });
    }
    
    // Additional business logic validation
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Prevent scheduling too far in the past
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (start < oneDayAgo) {
      return res.status(400).json({ 
        error: 'Start date cannot be in the past',
        minimumDate: oneDayAgo.toISOString()
      });
    }
    
    // Prevent scheduling too far in the future
    const maxFutureDays = 90;
    const maxFutureDate = new Date(Date.now() + maxFutureDays * 24 * 60 * 60 * 1000);
    if (end > maxFutureDate) {
      return res.status(400).json({ 
        error: `End date cannot be more than ${maxFutureDays} days in the future`,
        maximumDate: maxFutureDate.toISOString()
      });
    }
  }
  
  // Validate consultantMode
  if (consultantMode !== undefined && typeof consultantMode !== 'boolean') {
    return res.status(400).json({ 
      error: 'consultantMode must be a boolean value',
      validValues: [true, false]
    });
  }
  
  next();
};

// Validation for working hours
const validateWorkingHours = (workingHours) => {
  if (!workingHours || typeof workingHours !== 'object') {
    return { valid: false, error: 'Working hours object is required' };
  }
  
  const { start, end } = workingHours;
  
  if (typeof start !== 'number' || typeof end !== 'number') {
    return { valid: false, error: 'Working hours start and end must be numbers' };
  }
  
  if (start < 0 || start > 23 || end < 0 || end > 23) {
    return { valid: false, error: 'Working hours must be between 0 and 23' };
  }
  
  if (start >= end) {
    return { valid: false, error: 'Working hours start must be before end' };
  }
  
  return { valid: true };
};

// Validation for time preferences
const validateTimePreferences = (preferences) => {
  if (!Array.isArray(preferences)) {
    return { valid: false, error: 'Time preferences must be an array' };
  }
  
  const validPreferences = ['morning', 'afternoon', 'evening'];
  
  for (const preference of preferences) {
    if (!validPreferences.includes(preference)) {
      return { 
        valid: false, 
        error: `Invalid time preference: ${preference}`,
        validOptions: validPreferences
      };
    }
  }
  
  return { valid: true };
};

module.exports = {
  validateEmail,
  validateTimezone,
  validateDateRange,
  validateContactData,
  validateDateRangeQuery,
  validateBatchRequest,
  validateSchedulingRequest,
  validateWorkingHours,
  validateTimePreferences
};