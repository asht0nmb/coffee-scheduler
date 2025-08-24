const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();

// Import configuration
const { connectDB } = require('./config/database');
const { corsOptions } = require('./utils/googleAuth');
const { generalRateLimit } = require('./middleware/rateLimiting');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const contactsRoutes = require('./routes/contacts');
const calendarRoutes = require('./routes/calendar');

// Import middleware
const { ensureAuthenticated } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// SESSION CONFIGURATION
// ===============================

// Debug MongoDB URLs available
console.log('🔍 MongoDB Debug Info:');
console.log('- MONGO_URL exists:', !!process.env.MONGO_URL);
console.log('- MONGO_PUBLIC_URL exists:', !!process.env.MONGO_PUBLIC_URL);
console.log('- MONGOHOST exists:', !!process.env.MONGOHOST);

// Create session store with debugging
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  dbName: 'coffee-scheduler-sessions',
  collectionName: 'sessions',
  ttl: 24 * 60 * 60, // 24 hours
  touchAfter: 24 * 3600 // Lazy session update
});

// Add session store event listeners for debugging
sessionStore.on('connected', () => {
  console.log('✅ Session store connected to MongoDB');
});

sessionStore.on('error', (error) => {
  console.error('❌ Session store connection error:', error);
});

sessionStore.on('disconnected', () => {
  console.log('⚠️ Session store disconnected from MongoDB');
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  name: 'sessionId',
  proxy: process.env.NODE_ENV === 'production'
}));

// ===============================
// MIDDLEWARE
// ===============================

// Session debugging middleware
app.use((req, res, next) => {
  // Log session details for debugging
  if (req.path.includes('/auth/')) {
    console.log(`🔍 Session Debug [${req.method} ${req.path}]:`, {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      sessionKeys: req.session ? Object.keys(req.session) : 'no session',
      cookies: req.headers.cookie ? 'cookies present' : 'no cookies'
    });
  }
  
  // Handle session store connection errors
  if (!req.session) {
    console.error('❌ Session store unavailable');
    return res.status(503).json({ error: 'Session store unavailable' });
  }
  next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(generalRateLimit);

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===============================
// ROUTES
// ===============================

// Health check endpoint (public, no auth required)
app.get('/api/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    message: 'Coffee Scheduler API is running!', 
    timestamp: new Date().toISOString(),
    googleAuth: !!process.env.GOOGLE_CLIENT_ID,
    mongodb: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Temporary session debugging endpoint
app.get('/api/debug/session', (req, res) => {
  console.log('📊 Session Debug Endpoint Called');
  
  // Create test session data
  if (!req.session.debugTest) {
    req.session.debugTest = {
      created: new Date().toISOString(),
      random: Math.random().toString(36).substring(7)
    };
  }
  
  res.json({
    message: 'Session debug information',
    sessionId: req.sessionID,
    hasSession: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : [],
    debugTest: req.session.debugTest,
    cookies: req.headers.cookie ? 'present' : 'missing',
    userAgent: req.headers['user-agent']
  });
});

// Server-level debug endpoint (bypasses authentication)
app.get('/api/debug/server', (_req, res) => {
  const results = {
    message: 'Server-level debug test',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  try {
    // Test 1: Environment variables
    results.tests.environment = {
      hasMongoUrl: !!process.env.MONGO_URL,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      nodeEnv: process.env.NODE_ENV || 'not set',
      status: 'pass'
    };

    // Test 2: Database connection
    try {
      const mongoose = require('mongoose');
      results.tests.database = {
        connectionState: mongoose.connection.readyState,
        connectionStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
        hasModels: {
          User: !!mongoose.models.User,
          Contact: !!mongoose.models.Contact,
          SuggestedSlot: !!mongoose.models.SuggestedSlot
        },
        status: mongoose.connection.readyState === 1 ? 'pass' : 'warn'
      };
    } catch (dbError) {
      results.tests.database = {
        error: dbError.message,
        status: 'fail'
      };
    }

    // Test 3: Dependencies and modules
    try {
      const requiredModules = {
        express: require('express'),
        mongoose: require('mongoose'),
        googleapis: require('googleapis'),
        moment: require('moment-timezone'),
        cors: require('cors')
      };
      
      results.tests.dependencies = {
        expressVersion: requiredModules.express.version || 'unknown',
        mongooseVersion: requiredModules.mongoose.version || 'unknown',
        allLoaded: Object.keys(requiredModules).length === 5,
        status: 'pass'
      };
    } catch (depError) {
      results.tests.dependencies = {
        error: depError.message,
        status: 'fail'
      };
    }

    // Test 4: File system access
    try {
      const fs = require('fs');
      const path = require('path');
      const routesPath = path.join(__dirname, 'routes', 'calendar.js');
      const utilsPath = path.join(__dirname, 'utils', 'slotAnalysis.js');
      
      results.tests.fileSystem = {
        calendarRouteExists: fs.existsSync(routesPath),
        slotAnalysisExists: fs.existsSync(utilsPath),
        workingDirectory: process.cwd(),
        status: 'pass'
      };
    } catch (fsError) {
      results.tests.fileSystem = {
        error: fsError.message,
        status: 'fail'
      };
    }

    // Overall status
    const allPassed = Object.values(results.tests).every(test => test.status === 'pass');
    const anyFailed = Object.values(results.tests).some(test => test.status === 'fail');
    results.overallStatus = anyFailed ? 'fail' : (allPassed ? 'pass' : 'partial');

    res.json(results);

  } catch (error) {
    results.tests.criticalError = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production',
      status: 'fail'
    };
    results.overallStatus = 'fail';
    res.status(500).json(results);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/calendar', ensureAuthenticated, calendarRoutes);

// Debug route for listing all registered routes
app.get('/api/debug/routes', (_req, res) => {
  // Manual route listing - more reliable than introspection
  const routes = [
    // Health and debug routes
    { path: '/api/health', methods: ['GET'], description: 'Health check endpoint' },
    { path: '/api/debug/server', methods: ['GET'], description: 'Server-level debug (bypasses auth)' },
    { path: '/api/debug/routes', methods: ['GET'], description: 'This route listing' },
    
    // Auth routes
    { path: '/api/auth/google', methods: ['GET'], description: 'Start Google OAuth flow' },
    { path: '/api/auth/google/callback', methods: ['GET'], description: 'OAuth callback handler' },
    { path: '/api/auth/status', methods: ['GET'], description: 'Check authentication status' },
    { path: '/api/auth/logout', methods: ['POST'], description: 'Logout user' },
    
    // User routes
    { path: '/api/user/profile', methods: ['GET'], description: 'Get user profile' },
    { path: '/api/user/preferences', methods: ['PUT'], description: 'Update user preferences' },
    
    // Contact routes
    { path: '/api/contacts', methods: ['GET'], description: 'Get all contacts' },
    { path: '/api/contacts', methods: ['POST'], description: 'Create new contact' },
    { path: '/api/contacts/:id', methods: ['PUT'], description: 'Update contact' },
    { path: '/api/contacts/:id', methods: ['DELETE'], description: 'Delete contact' },
    { path: '/api/contacts/stats', methods: ['GET'], description: 'Get contact statistics' },
    
    // Calendar routes (require authentication)
    { path: '/api/calendar/debug', methods: ['GET'], description: 'Debug calendar route access' },
    { path: '/api/calendar/debug-middleware', methods: ['POST'], description: 'Test middleware imports' },
    { path: '/api/calendar/debug-rate-limit', methods: ['POST'], description: 'Test rate limiting' },
    { path: '/api/calendar/debug-validation', methods: ['POST'], description: 'Test validation middleware' },
    { path: '/api/calendar/test', methods: ['GET'], description: 'Test calendar access' },
    { path: '/api/calendar/events', methods: ['GET'], description: 'Get calendar events' },
    { path: '/api/calendar/raw-availability', methods: ['GET'], description: 'Get raw availability' },
    { path: '/api/calendar/analyze-slots', methods: ['POST'], description: 'Analyze slot quality' },
    { path: '/api/calendar/schedule-batch', methods: ['POST'], description: 'Legacy batch scheduling' },
    { path: '/api/calendar/schedule-batch-advanced', methods: ['POST'], description: 'Advanced batch scheduling algorithm' },
    { path: '/api/calendar/suggestions', methods: ['GET'], description: 'Get current scheduling suggestions' },
    { path: '/api/calendar/clear-suggestions', methods: ['POST'], description: 'Clear scheduling suggestions' },
    { path: '/api/calendar/sync-scheduled', methods: ['POST'], description: 'Sync scheduled meetings with calendar' },
    { path: '/api/calendar/cleanup-expired', methods: ['POST'], description: 'Cleanup expired suggestions' }
  ];

  res.json({
    message: 'Available API routes',
    count: routes.length,
    environment: process.env.NODE_ENV || 'development',
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// ===============================
// ERROR HANDLING
// ===============================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  // Safely log error with fallback
  console.error('Global error handler:', err || 'Unknown error');
  
  // Handle case where err is undefined or not an Error object
  if (!err) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: 'Unknown error occurred'
    });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? (err.message || 'Unknown error') : undefined
  });
});

// ===============================
// SERVER STARTUP
// ===============================
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Coffee Scheduler API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 Routes: http://localhost:${PORT}/api/debug/routes`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();