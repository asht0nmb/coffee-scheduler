// Standardized error handling for scheduling system

/**
 * Error types for categorization
 */
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  ALGORITHM: 'ALGORITHM_ERROR',
  CALENDAR: 'CALENDAR_ERROR',
  DATABASE: 'DATABASE_ERROR',
  NETWORK: 'NETWORK_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Standardized error response format
 */
const createErrorResponse = (error, type = ERROR_TYPES.INTERNAL, severity = ERROR_SEVERITY.MEDIUM) => {
  const timestamp = new Date().toISOString();
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const baseResponse = {
    success: false,
    error: {
      type,
      severity,
      message: error.message || 'An unexpected error occurred',
      timestamp,
      errorId
    }
  };
  
  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    baseResponse.error.details = error.message;
    baseResponse.error.stack = error.stack;
  }
  
  return baseResponse;
};

/**
 * Handle scheduling-specific errors
 */
const handleSchedulingError = (error, res, context = 'scheduling') => {
  console.error(`${context} error:`, error);
  
  // Categorize error based on type
  let errorType = ERROR_TYPES.INTERNAL;
  let severity = ERROR_SEVERITY.MEDIUM;
  let statusCode = 500;
  
  // MongoDB errors
  if (error.name === 'ValidationError') {
    errorType = ERROR_TYPES.VALIDATION;
    severity = ERROR_SEVERITY.LOW;
    statusCode = 400;
  } else if (error.name === 'CastError') {
    errorType = ERROR_TYPES.VALIDATION;
    severity = ERROR_SEVERITY.LOW;
    statusCode = 400;
  } else if (error.code === 11000) {
    errorType = ERROR_TYPES.VALIDATION;
    severity = ERROR_SEVERITY.LOW;
    statusCode = 409;
  }
  
  // Google Calendar errors
  else if (error.code === 403) {
    errorType = ERROR_TYPES.AUTHORIZATION;
    severity = ERROR_SEVERITY.HIGH;
    statusCode = 403;
  } else if (error.code === 401) {
    errorType = ERROR_TYPES.AUTHENTICATION;
    severity = ERROR_SEVERITY.HIGH;
    statusCode = 401;
  }
  
  // Algorithm errors
  else if (error.message && error.message.includes('algorithm')) {
    errorType = ERROR_TYPES.ALGORITHM;
    severity = ERROR_SEVERITY.MEDIUM;
    statusCode = 500;
  }
  
  // Rate limiting errors
  else if (error.message && error.message.includes('rate limit')) {
    errorType = ERROR_TYPES.RATE_LIMIT;
    severity = ERROR_SEVERITY.LOW;
    statusCode = 429;
  }
  
  // Network errors
  else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    errorType = ERROR_TYPES.NETWORK;
    severity = ERROR_SEVERITY.HIGH;
    statusCode = 503;
  }
  
  const errorResponse = createErrorResponse(error, errorType, severity);
  
  // Add context-specific information
  if (context === 'batch-scheduling') {
    errorResponse.error.context = 'batch-scheduling';
    errorResponse.error.suggestion = 'Try reducing the number of contacts or date range';
  } else if (context === 'batch-scheduling-advanced') {
    errorResponse.error.context = 'advanced-algorithm';
    errorResponse.error.suggestion = 'Try using fewer contacts, adjusting working hours, or relaxing constraints';
  } else if (context === 'algorithm') {
    errorResponse.error.context = 'scheduling-algorithm';
    errorResponse.error.suggestion = 'Try adjusting working hours, time preferences, or contact timezones';
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Handle validation errors specifically
 */
const handleValidationError = (error, res) => {
  const validationResponse = {
    success: false,
    error: {
      type: ERROR_TYPES.VALIDATION,
      severity: ERROR_SEVERITY.LOW,
      message: 'Validation failed',
      timestamp: new Date().toISOString(),
      details: error.message,
      fields: error.fields || []
    }
  };
  
  res.status(400).json(validationResponse);
};

/**
 * Handle rate limit errors
 */
const handleRateLimitError = (error, res) => {
  const rateLimitResponse = {
    success: false,
    error: {
      type: ERROR_TYPES.RATE_LIMIT,
      severity: ERROR_SEVERITY.LOW,
      message: 'Rate limit exceeded',
      timestamp: new Date().toISOString(),
      retryAfter: error.retryAfter || 60
    }
  };
  
  res.status(429).json(rateLimitResponse);
};

/**
 * Log error for monitoring
 */
const logError = (error, context = 'general') => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    }
  };
  
  // In production, you might want to send this to a logging service
  console.error('Error logged:', JSON.stringify(logEntry, null, 2));
};

module.exports = {
  ERROR_TYPES,
  ERROR_SEVERITY,
  createErrorResponse,
  handleSchedulingError,
  handleValidationError,
  handleRateLimitError,
  logError
}; 