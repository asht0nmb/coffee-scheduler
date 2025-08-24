const { oauth2Client } = require('../utils/googleAuth');
const User = require('../models/User');

// Create or update user in MongoDB
async function upsertUser(googleProfile) {
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
  console.log('🔒 Authentication Check:', {
    path: req.path,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasTokens: !!req.session?.tokens,
    hasUser: !!req.session?.user,
    userEmail: req.session?.user?.email
  });
  
  if (!req.session.tokens || !req.session.user) {
    console.log('❌ Authentication failed - missing session data:', {
      hasTokens: !!req.session?.tokens,
      hasUser: !!req.session?.user,
      sessionKeys: req.session ? Object.keys(req.session) : []
    });
    
    return res.status(401).json({ 
      error: 'Not authenticated',
      details: 'Session missing authentication tokens or user data',
      debug: {
        hasSession: !!req.session,
        hasTokens: !!req.session?.tokens,
        hasUser: !!req.session?.user,
        sessionId: req.sessionID
      }
    });
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

module.exports = {
  upsertUser,
  ensureAuthenticated
};