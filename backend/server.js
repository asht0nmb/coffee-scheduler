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
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const basePath = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace('^', '');
          routes.push({
            path: basePath + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });

  res.json({
    message: 'Available API routes',
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
  console.error('Global error handler:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
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