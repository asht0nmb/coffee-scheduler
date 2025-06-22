const express = require('express');
const session = require('express-session');
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
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
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