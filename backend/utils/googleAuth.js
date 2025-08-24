const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

// CRITICAL: Custom PKCE override - DO NOT MODIFY
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

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000', // HTTPS variants
      'https://localhost:5173'
    ].filter(Boolean);
    
    console.log('🌐 CORS Origin Check:', {
      requestOrigin: origin,
      allowedOrigins,
      isProduction: process.env.NODE_ENV === 'production'
    });
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Essential for session cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Cookie',
    'Set-Cookie',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'set-cookie',
    'Set-Cookie'
  ],
  // Handle preflight requests properly
  preflightContinue: false,
  optionsSuccessStatus: 200
};

module.exports = {
  oauth2Client,
  SCOPES,
  corsOptions,
  google
};