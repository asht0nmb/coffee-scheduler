const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors());
app.use(express.json());

// Google OAuth setup - explicit configuration
const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// Ensure no PKCE is used
oauth2Client.generateAuthUrl = function(opts) {
  // Remove any PKCE-related parameters
  delete opts.code_challenge;
  delete opts.code_challenge_method;
  return google.auth.OAuth2.prototype.generateAuthUrl.call(this, opts);
};

// Debug googleapis requests
const originalRequest = oauth2Client.transporter.request;
oauth2Client.transporter.request = function(opts) {
  console.log('=== OAuth Request Debug ===');
  console.log('URL:', opts.url);
  console.log('Method:', opts.method);
  console.log('Data:', opts.data);
  console.log('========================');
  return originalRequest.apply(this, arguments);
};


// FIX: Override getToken to remove code_verifier
const originalGetToken = oauth2Client.getToken;
oauth2Client.getToken = async function(codeOrOptions) {
  // Intercept the request to remove code_verifier
  const originalTransporterRequest = this.transporter.request;
  this.transporter.request = function(opts) {
    if (opts.data && opts.data instanceof URLSearchParams) {
      // Remove the problematic code_verifier parameter
      opts.data.delete('code_verifier');
      console.log('Removed code_verifier from request');
    }
    return originalTransporterRequest.apply(this, arguments);
  };
  
  // Call the original method
  const result = await originalGetToken.apply(this, arguments);
  
  // Restore the original transporter
  this.transporter.request = originalTransporterRequest;
  
  return result;
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Coffee Scheduler API is running!', 
    timestamp: new Date().toISOString(),
    googleAuth: !!process.env.GOOGLE_CLIENT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  });
});

// Start Google OAuth flow
app.get('/api/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  
  console.log('Generated auth URL:', authUrl);
  console.log('Redirect URI configured:', process.env.GOOGLE_REDIRECT_URI);
  res.redirect(authUrl);
});

// Handle OAuth callback - FIXED VERSION
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  console.log('Callback received - Code:', code ? 'YES' : 'NO', 'Error:', error);
  
  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  try {
    console.log('Attempting to exchange code for tokens...');
    
    // Exchange code for tokens with explicit configuration
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', Object.keys(tokens));


    if (!tokens) {
      throw new Error('No tokens received from Google');
    }
    
    console.log('Tokens received:', Object.keys(tokens));
    oauth2Client.setCredentials(tokens);
    
    // Store tokens in session
    req.session.tokens = tokens;
    
    // Test if we can get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    req.session.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    };
    
    res.send(`
      <h1>✅ Authentication Successful!</h1>
      <p>Welcome, ${userInfo.name}!</p>
      <p>Email: ${userInfo.email}</p>
      <p><a href="/api/calendar/test">Test Calendar Access</a></p>
      <p><a href="/api/auth/status">Check Auth Status</a></p>
    `);
  } catch (error) {
    console.error('OAuth error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).send(`
      <h1>❌ Authentication Failed</h1>
      <p>Error: ${error.message}</p>
      <p>Details: ${error.response?.data?.error_description || 'Unknown error'}</p>
      <p><a href="/api/auth/google">Try Again</a></p>
    `);
  }
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session.tokens && req.session.user) {
    res.json({
      authenticated: true,
      user: req.session.user,
      hasTokens: !!req.session.tokens
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Test calendar access
app.get('/api/calendar/test', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    oauth2Client.setCredentials(req.session.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.calendarList.list();
    
    res.json({
      message: 'Calendar access successful!',
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary
      }))
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    res.status(500).json({ error: 'Calendar access failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});