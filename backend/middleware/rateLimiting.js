// Rate limiting middleware for expensive operations

const rateLimitStore = new Map();

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.session?.user?.id || req.ip,
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Cleanup expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to run cleanup
      cleanupExpiredEntries();
    }
    
    let userData = rateLimitStore.get(key);
    
    if (!userData || now > userData.resetTime) {
      userData = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    userData.count++;
    rateLimitStore.set(key, userData);
    
    // Set headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userData.count),
      'X-RateLimit-Reset': new Date(userData.resetTime).toISOString()
    });
    
    if (userData.count > maxRequests) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((userData.resetTime - now) / 1000)
      });
    }
    
    // Track failed requests
    if (!skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode >= 400) {
          // Don't count failed requests against the limit for some endpoints
        }
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
};

// Specific rate limiters for different endpoints

// General API rate limiting
const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  message: 'Too many API requests, please try again later.'
});

// Calendar operations (more expensive)
const calendarRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 50,
  message: 'Too many calendar requests, please try again later.'
});

// Batch operations (most expensive)
const batchRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many batch scheduling requests, please try again later.'
});

// Contact creation/updates
const contactRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20,
  message: 'Too many contact operations, please try again later.'
});

// Authentication attempts
const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => req.ip, // Use IP for auth attempts
  message: 'Too many authentication attempts, please try again later.'
});

module.exports = {
  createRateLimit,
  generalRateLimit,
  calendarRateLimit,
  batchRateLimit,
  contactRateLimit,
  authRateLimit
};