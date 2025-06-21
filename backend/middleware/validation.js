// Input validation middleware

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

module.exports = {
  validateEmail,
  validateTimezone,
  validateDateRange,
  validateContactData,
  validateDateRangeQuery,
  validateBatchRequest
};