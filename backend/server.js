const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// DATABASE CONNECTION
// ===============================
const connectDB = async () => {
  try {
    if (process.env.MONGO_URL) {
      await mongoose.connect(process.env.MONGO_URL);
      console.log('MongoDB connected successfully');
    } else {
      console.log('No MongoDB URI provided - using memory storage');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't exit - allow app to run without DB
  }
};

// ===============================
// MONGODB SCHEMAS
// ===============================

// User Schema (Google profile + preferences)
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  picture: String,
  timezone: { type: String, default: 'America/Los_Angeles' },
  workingHours: {
    start: { type: Number, default: 9 },  // 9 AM
    end: { type: Number, default: 17 }    // 5 PM
  },
  preferences: {
    meetingDuration: { type: Number, default: 60 }, // minutes
    bufferTime: { type: Number, default: 15 }       // minutes between meetings
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  timezone: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'slots_generated', 'email_sent', 'scheduled', 'completed'],
    default: 'pending'
  },
  notes: String,
  meetingPreferences: {
    duration: { type: Number, default: 60 },
    timeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'any'], default: 'any' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for user queries
contactSchema.index({ userId: 1, email: 1 }, { unique: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// Tentative Slot Schema
const tentativeSlotSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  contactEmail: { type: String, required: true },
  timeSlot: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timezone: { type: String, required: true }
  },
  displayTimes: {
    userTime: String,    // "Wed, Jun 12 at 9:00 AM PST"
    contactTime: String  // "Wed, Jun 12 at 12:00 PM EST"
  },
  addedToGoogleCal: { type: Boolean, default: false },
  googleCalEventId: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
tentativeSlotSchema.index({ userId: 1, expiresAt: 1 });
tentativeSlotSchema.index({ contactEmail: 1, status: 1 });

const TentativeSlot = mongoose.models.TentativeSlot || mongoose.model('TentativeSlot', tentativeSlotSchema);

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

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware (optional, remove in production for performance)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// ===============================
// GOOGLE OAUTH SETUP
// ===============================
const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Ensure no PKCE is used
oauth2Client.generateAuthUrl = function(opts) {
  delete opts.code_challenge;
  delete opts.code_challenge_method;
  return google.auth.OAuth2.prototype.generateAuthUrl.call(this, opts);
};

// Override getToken to remove code_verifier
const originalGetToken = oauth2Client.getToken;
oauth2Client.getToken = async function(codeOrOptions) {
  const originalTransporterRequest = this.transporter.request;
  this.transporter.request = function(opts) {
    if (opts.data && opts.data instanceof URLSearchParams) {
      opts.data.delete('code_verifier');
    }
    return originalTransporterRequest.apply(this, arguments);
  };
  
  const result = await originalGetToken.apply(this, arguments);
  this.transporter.request = originalTransporterRequest;
  
  return result;
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',  // Added for creating events
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// ===============================
// AUTHENTICATION HELPERS
// ===============================

// Create or update user in MongoDB
async function upsertUser(googleProfile) {
  if (!process.env.MONGO_URL) {
    return {
      googleId: googleProfile.id,
      email: googleProfile.email,
      name: googleProfile.name,
      picture: googleProfile.picture
    };
  }

  try {
    const user = await User.findOneAndUpdate(
      { googleId: googleProfile.id },
      {
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        lastLogin: new Date()
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('User upserted:', user.email);
    return user;
  } catch (error) {
    console.error('User upsert error:', error);
    throw error;
  }
}

// Enhanced authentication middleware
async function ensureAuthenticated(req, res, next) {
  if (!req.session.tokens || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // Check if access token is expired
  const now = new Date().getTime();
  if (req.session.tokens.expiry_date && req.session.tokens.expiry_date <= now) {
    console.log('Access token expired, refreshing...');
    try {
      oauth2Client.setCredentials({ refresh_token: req.session.tokens.refresh_token });
      const { tokens } = await oauth2Client.refreshAccessToken();
      
      // Update expiry date
      if (tokens.expires_in) {
        tokens.expiry_date = new Date().getTime() + (tokens.expires_in * 1000);
      }
      
      req.session.tokens = { ...req.session.tokens, ...tokens };
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      req.session.destroy();
      return res.status(401).json({ error: 'Token refresh failed, please login again' });
    }
  }
  
  oauth2Client.setCredentials(req.session.tokens);
  req.oauth2Client = oauth2Client; // Make available to routes
  next();
}

// ===============================
// OAUTH ROUTES
// ===============================

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Coffee Scheduler API is running!', 
    timestamp: new Date().toISOString(),
    googleAuth: !!process.env.GOOGLE_CLIENT_ID,
    mongodb: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start Google OAuth flow
app.get('/api/auth/google', (req, res) => {
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  req.session.state = state;
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state
  });
  
  console.log('OAuth flow initiated');
  res.redirect(authUrl);
});

// Handle OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error, state } = req.query;
  
  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  // Verify state for CSRF protection
  if (state !== req.session.state) {
    console.error('State mismatch - possible CSRF attack');
    return res.status(400).send('Invalid state parameter');
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received successfully');
    
    // Add expiry date
    if (tokens.expires_in) {
      tokens.expiry_date = new Date().getTime() + (tokens.expires_in * 1000);
    }
    
    oauth2Client.setCredentials(tokens);
    req.session.tokens = tokens;
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    // Create or update user in MongoDB
    const dbUser = await upsertUser(userInfo);
    
    // Store complete user info in session
    req.session.user = {
      id: dbUser.googleId || userInfo.id,
      email: dbUser.email || userInfo.email,
      name: dbUser.name || userInfo.name,
      picture: dbUser.picture || userInfo.picture,
      timezone: dbUser.timezone || 'America/Los_Angeles',
      _id: dbUser._id // MongoDB ID if available
    };
    
    // Clean up state
    delete req.session.state;
    
    // Redirect based on environment
    if (process.env.FRONTEND_URL) {
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } else {
      res.send(`
        <h1>✅ Authentication Successful!</h1>
        <p>Welcome, ${req.session.user.name}!</p>
        <p>Email: ${req.session.user.email}</p>
        <p><a href="/api/auth/status">Check Status</a></p>
        <p><a href="/api/contacts">View Contacts</a></p>
        <p><a href="/api/calendar/test">Test Calendar</a></p>
      `);
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    delete req.session.state;
    
    const errorMessage = error.response?.data?.error_description || error.message;
    if (process.env.FRONTEND_URL) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    } else {
      res.status(500).send(`
        <h1>❌ Authentication Failed</h1>
        <p>Error: ${errorMessage}</p>
        <p><a href="/api/auth/google">Try Again</a></p>
      `);
    }
  }
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  res.json({
    authenticated: !!(req.session.tokens && req.session.user),
    user: req.session.user || null,
    expiresAt: req.session.cookie._expires
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
  });
});

// ===============================
// USER PROFILE ROUTES
// ===============================

// Get user profile
app.get('/api/user/profile', ensureAuthenticated, async (req, res) => {
  try {
    if (!process.env.MONGO_URL) {
      return res.json(req.session.user);
    }
    
    const user = await User.findOne({ googleId: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user preferences
app.put('/api/user/preferences', ensureAuthenticated, async (req, res) => {
  try {
    const { timezone, workingHours, preferences } = req.body;
    
    if (!process.env.MONGO_URL) {
      return res.json({ 
        message: 'Preferences updated (mock)',
        timezone, workingHours, preferences 
      });
    }
    
    const updates = {};
    if (timezone) updates.timezone = timezone;
    if (workingHours) updates.workingHours = workingHours;
    if (preferences) updates.preferences = preferences;
    
    const user = await User.findOneAndUpdate(
      { googleId: req.session.user.id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session
    if (timezone) req.session.user.timezone = timezone;
    
    res.json(user);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ===============================
// CONTACT MANAGEMENT ROUTES
// ===============================

// Get all contacts for user
app.get('/api/contacts', ensureAuthenticated, async (req, res) => {
  try {
    if (!process.env.MONGO_URL) {
      return res.json([
        { 
          id: '1', 
          name: 'Sarah Chen', 
          email: 'sarah@example.com', 
          timezone: 'America/New_York', 
          status: 'pending',
          createdAt: new Date()
        },
        { 
          id: '2', 
          name: 'Marcus Johnson', 
          email: 'marcus@example.com', 
          timezone: 'Europe/London', 
          status: 'slots_generated',
          createdAt: new Date()
        }
      ]);
    }

    const contacts = await Contact.find({ userId: req.session.user.id })
      .sort({ updatedAt: -1 });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
});

// Add new contact
app.post('/api/contacts', ensureAuthenticated, async (req, res) => {
  const { name, email, timezone, notes, meetingPreferences } = req.body;

  // Validation
  if (!name || !email || !timezone) {
    return res.status(400).json({ 
      error: 'Name, email, and timezone are required' 
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    if (!process.env.MONGO_URL) {
      return res.json({
        id: Date.now().toString(),
        userId: req.session.user.id,
        name,
        email,
        timezone,
        status: 'pending',
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: req.session.user.id,
      email: email.toLowerCase()
    });

    if (existingContact) {
      return res.status(409).json({ 
        error: 'Contact with this email already exists' 
      });
    }

    const contact = new Contact({
      userId: req.session.user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      timezone,
      notes: notes || '',
      meetingPreferences: meetingPreferences || {},
      status: 'pending'
    });

    const savedContact = await contact.save();
    console.log('Contact created:', savedContact.email);
    
    res.status(201).json(savedContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update contact
app.put('/api/contacts/:id', ensureAuthenticated, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'timezone', 'status', 'notes', 'meetingPreferences'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date();

    if (!process.env.MONGO_URL) {
      return res.json({ 
        id: req.params.id, 
        ...updates, 
        message: 'Contact updated (mock)' 
      });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log('Contact updated:', contact.email);
    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
app.delete('/api/contacts/:id', ensureAuthenticated, async (req, res) => {
  try {
    if (!process.env.MONGO_URL) {
      return res.json({ success: true, message: 'Contact deleted (mock)' });
    }

    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user.id
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Also delete associated tentative slots
    await TentativeSlot.deleteMany({
      userId: req.session.user.id,
      contactId: req.params.id
    });

    console.log('Contact deleted:', contact.email);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Get contact statistics
app.get('/api/contacts/stats', ensureAuthenticated, async (req, res) => {
  try {
    if (!process.env.MONGO_URL) {
      return res.json({
        total: 2,
        pending: 1,
        slotsGenerated: 1,
        emailSent: 0,
        scheduled: 0,
        completed: 0
      });
    }

    const stats = await Contact.aggregate([
      { $match: { userId: req.session.user.id } },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContacts = await Contact.countDocuments({ userId: req.session.user.id });

    const formattedStats = {
      total: totalContacts,
      pending: 0,
      slotsGenerated: 0,
      emailSent: 0,
      scheduled: 0,
      completed: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'pending') formattedStats.pending = stat.count;
      if (stat._id === 'slots_generated') formattedStats.slotsGenerated = stat.count;
      if (stat._id === 'email_sent') formattedStats.emailSent = stat.count;
      if (stat._id === 'scheduled') formattedStats.scheduled = stat.count;
      if (stat._id === 'completed') formattedStats.completed = stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ===============================
// CALENDAR ROUTES
// ===============================

// Test calendar access
app.get('/api/calendar/test', ensureAuthenticated, async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    
    const response = await calendar.calendarList.list();
    
    res.json({
      message: 'Calendar access successful!',
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary,
        accessRole: cal.accessRole
      }))
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    res.status(500).json({ 
      error: 'Calendar access failed',
      details: error.message 
    });
  }
});

// Get calendar events for a date range
app.get('/api/calendar/events', ensureAuthenticated, async (req, res) => {
  try {
    const { timeMin, timeMax, calendarId = 'primary' } = req.query;
    
    if (!timeMin || !timeMax) {
      return res.status(400).json({ 
        error: 'timeMin and timeMax query parameters are required' 
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });
    
    res.json({
      events: response.data.items,
      nextSyncToken: response.data.nextSyncToken
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      error: 'Failed to get calendar events',
      details: error.message 
    });
  }
});

// ===============================
// ERROR HANDLING
// ===============================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// ===============================
// SERVER STARTUP
// ===============================

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log('MongoDB:', process.env.MONGO_URL ? 'Connected' : 'Not configured');
      console.log('Google OAuth:', process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not configured');
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

// Start the server
startServer();