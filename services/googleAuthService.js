const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Google OAuth configuration
const GOOGLE_CONFIG = {
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  authorizedEmail: process.env.AUTHORIZED_EMAIL || 'bibeksha48@gmail.com'
};

// Initialize Google OAuth strategy
function initializeGoogleAuth() {
  if (!GOOGLE_CONFIG.clientID || !GOOGLE_CONFIG.clientSecret) {
    console.log('⚠️ Google OAuth not configured - missing client credentials');
    return false;
  }

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CONFIG.clientID,
    clientSecret: GOOGLE_CONFIG.clientSecret,
    callbackURL: GOOGLE_CONFIG.callbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log(`🔍 Google OAuth attempt: ${profile.emails[0].value}`);
      
      // Check if the email matches the authorized email
      const userEmail = profile.emails[0].value.toLowerCase();
      const authorizedEmail = GOOGLE_CONFIG.authorizedEmail.toLowerCase();
      
      if (userEmail === authorizedEmail) {
        console.log(`✅ Authorized Google login: ${userEmail}`);
        
        const user = {
          id: profile.id,
          email: userEmail,
          name: profile.displayName,
          picture: profile.photos[0]?.value,
          provider: 'google',
          authorized: true
        };
        
        return done(null, user);
      } else {
        console.log(`❌ Unauthorized Google login attempt: ${userEmail} (expected: ${authorizedEmail})`);
        return done(null, false, { message: 'Unauthorized email address' });
      }
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  console.log('🔐 Google OAuth strategy initialized');
  console.log(`📧 Authorized email: ${GOOGLE_CONFIG.authorizedEmail}`);
  return true;
}

// Check if Google OAuth is properly configured
function isGoogleAuthConfigured() {
  return !!(GOOGLE_CONFIG.clientID && GOOGLE_CONFIG.clientSecret);
}

// Get Google OAuth configuration status
function getGoogleAuthStatus() {
  return {
    configured: isGoogleAuthConfigured(),
    clientIdSet: !!GOOGLE_CONFIG.clientID,
    clientSecretSet: !!GOOGLE_CONFIG.clientSecret,
    callbackUrl: GOOGLE_CONFIG.callbackURL,
    authorizedEmail: GOOGLE_CONFIG.authorizedEmail,
    strategy: 'Google OAuth 2.0'
  };
}

module.exports = {
  initializeGoogleAuth,
  isGoogleAuthConfigured,
  getGoogleAuthStatus,
  GOOGLE_CONFIG
};