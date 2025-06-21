const express = require('express');
const router = express.Router();
const { oauth2Client, SCOPES, google } = require('../utils/googleAuth');
const { upsertUser } = require('../middleware/auth');

// Health check endpoint
router.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ 
    message: 'Coffee Scheduler API is running!', 
    timestamp: new Date().toISOString(),
    googleAuth: !!process.env.GOOGLE_CLIENT_ID,
    mongodb: mongoose.connection.readyState === 1,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start Google OAuth flow
router.get('/google', (req, res) => {
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
router.get('/google/callback', async (req, res) => {
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
router.get('/status', (req, res) => {
  res.json({
    authenticated: !!(req.session.tokens && req.session.user),
    user: req.session.user || null,
    expiresAt: req.session.cookie._expires
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;