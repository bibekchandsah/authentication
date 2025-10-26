const express = require('express');
const session = require('express-session');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// File to store the secret key persistently
const SECRET_FILE = path.join(__dirname, '.secret-key.json');
const SERVICE_NAME = 'Secure Webpage - Bibek Sha';

// Function to get or create persistent secret key
function getOrCreateSecret() {
  try {
    // Try to read existing secret
    if (fs.existsSync(SECRET_FILE)) {
      const data = fs.readFileSync(SECRET_FILE, 'utf8');
      const secretData = JSON.parse(data);
      console.log('📂 Using existing secret key from file');
      return secretData.secret;
    }
  } catch (error) {
    console.log('⚠️ Could not read existing secret, generating new one');
  }

  // Generate new secret if file doesn't exist or is corrupted
  const secret = speakeasy.generateSecret({
    name: SERVICE_NAME,
    issuer: 'SecureWebApp',
    length: 32
  });

  // Save the secret to file
  try {
    const secretData = {
      secret: secret.base32,
      created: new Date().toISOString(),
      serviceName: SERVICE_NAME
    };
    fs.writeFileSync(SECRET_FILE, JSON.stringify(secretData, null, 2));
    console.log('💾 New secret key generated and saved');
  } catch (error) {
    console.error('❌ Failed to save secret key:', error.message);
  }

  return secret.base32;
}

// Get the persistent secret key (make it mutable for regeneration)
let TOTP_SECRET = getOrCreateSecret();

// Rate limiting storage (in production, use Redis or database)
const loginAttempts = new Map();

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,           // Maximum failed attempts
  lockoutDuration: 15 * 60 * 1000,  // 15 minutes lockout
  progressiveLockout: true, // Increase lockout time with repeated violations
  cleanupInterval: 60 * 60 * 1000   // Clean old records every hour
};

// Function to get client IP address
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '127.0.0.1';
}

// Function to check if IP is rate limited
function isRateLimited(ip) {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return { limited: false };
  
  const now = Date.now();
  
  // Check if lockout period has expired
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60); // minutes
    return { 
      limited: true, 
      remainingTime,
      attempts: attempts.count,
      lockedUntil: new Date(attempts.lockedUntil)
    };
  }
  
  // Reset if lockout expired
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    loginAttempts.delete(ip);
    return { limited: false };
  }
  
  return { limited: false, attempts: attempts.count };
}

// Function to record failed login attempt
function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now, violations: 0 };
  
  attempts.count++;
  attempts.lastAttempt = now;
  
  // Check if max attempts reached
  if (attempts.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    attempts.violations++;
    
    // Progressive lockout: increase duration with repeated violations
    let lockoutDuration = RATE_LIMIT_CONFIG.lockoutDuration;
    if (RATE_LIMIT_CONFIG.progressiveLockout && attempts.violations > 1) {
      lockoutDuration *= Math.pow(2, attempts.violations - 1); // Exponential backoff
      lockoutDuration = Math.min(lockoutDuration, 24 * 60 * 60 * 1000); // Max 24 hours
    }
    
    attempts.lockedUntil = now + lockoutDuration;
    attempts.count = 0; // Reset count for next cycle
    
    console.log(`🚨 IP ${ip} locked out for ${Math.ceil(lockoutDuration / 1000 / 60)} minutes (violation #${attempts.violations})`);
  }
  
  loginAttempts.set(ip, attempts);
}

// Function to record successful login (reset attempts)
function recordSuccessfulLogin(ip) {
  loginAttempts.delete(ip);
}

// Cleanup old rate limit records
setInterval(() => {
  const now = Date.now();
  const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  for (const [ip, attempts] of loginAttempts.entries()) {
    // Remove old unlocked records
    if (!attempts.lockedUntil && attempts.lastAttempt < cutoff) {
      loginAttempts.delete(ip);
    }
    // Remove expired lockouts
    else if (attempts.lockedUntil && now >= attempts.lockedUntil) {
      loginAttempts.delete(ip);
    }
  }
}, RATE_LIMIT_CONFIG.cleanupInterval);

// Function to regenerate secret key
function regenerateSecret() {
  const secret = speakeasy.generateSecret({
    name: SERVICE_NAME,
    issuer: 'SecureWebApp',
    length: 32
  });

  try {
    const secretData = {
      secret: secret.base32,
      created: new Date().toISOString(),
      serviceName: SERVICE_NAME,
      regenerated: true
    };
    fs.writeFileSync(SECRET_FILE, JSON.stringify(secretData, null, 2));
    console.log('🔄 Secret key regenerated and saved');
    return secret.base32;
  } catch (error) {
    console.error('❌ Failed to save regenerated secret key:', error.message);
    throw error;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session timeout configuration
const SESSION_CONFIG = {
  maxAge: 30 * 60 * 1000,        // 30 minutes session timeout
  warningTime: 5 * 60 * 1000,    // Show warning 5 minutes before expiry
  extendTime: 15 * 60 * 1000,    // Extend session by 15 minutes on activity
  checkInterval: 60 * 1000       // Check session every minute
};

// Session configuration with activity tracking
app.use(session({
  secret: 'secure-session-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: SESSION_CONFIG.maxAge,
    httpOnly: true // Prevent XSS attacks
  }
}));

// Session activity tracking middleware
app.use((req, res, next) => {
  if (req.session && req.session.authenticated) {
    const now = Date.now();
    
    // Initialize session timestamps
    if (!req.session.createdAt) {
      req.session.createdAt = now;
    }
    
    // Update last activity
    req.session.lastActivity = now;
    
    // Check if session should expire due to inactivity
    const timeSinceLastActivity = now - (req.session.lastActivity || req.session.createdAt);
    if (timeSinceLastActivity > SESSION_CONFIG.maxAge) {
      console.log(`⏰ Session expired for user due to inactivity`);
      req.session.destroy();
      if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(401).json({ 
          success: false, 
          sessionExpired: true,
          message: 'Session expired due to inactivity' 
        });
      }
      return res.redirect('/login');
    }
    
    // Extend session on activity (reset cookie maxAge)
    req.session.cookie.maxAge = SESSION_CONFIG.maxAge;
  }
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Routes
// Login page
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/main');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login POST endpoint with rate limiting
app.post('/login', (req, res) => {
  const { authCode } = req.body;
  const clientIP = getClientIP(req);
  
  // Check rate limiting
  const rateLimitCheck = isRateLimited(clientIP);
  if (rateLimitCheck.limited) {
    console.log(`🚫 Rate limited login attempt from IP: ${clientIP}`);
    return res.status(429).json({ 
      success: false, 
      message: `Too many failed attempts. Account locked for ${rateLimitCheck.remainingTime} more minutes.`,
      rateLimited: true,
      remainingTime: rateLimitCheck.remainingTime,
      lockedUntil: rateLimitCheck.lockedUntil
    });
  }
  
  // Verify the TOTP code from Microsoft Authenticator
  const verified = speakeasy.totp.verify({
    secret: TOTP_SECRET,
    encoding: 'base32',
    token: authCode,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });
  
  if (verified) {
    // Successful login - reset rate limiting
    recordSuccessfulLogin(clientIP);
    req.session.authenticated = true;
    req.session.user = 'Authorized User';
    console.log(`✅ Successful login from IP: ${clientIP}`);
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    // Failed login - record attempt
    recordFailedAttempt(clientIP);
    const attemptsInfo = loginAttempts.get(clientIP);
    const remainingAttempts = RATE_LIMIT_CONFIG.maxAttempts - (attemptsInfo ? attemptsInfo.count : 0);
    
    console.log(`❌ Failed login attempt from IP: ${clientIP} (${attemptsInfo ? attemptsInfo.count : 1}/${RATE_LIMIT_CONFIG.maxAttempts})`);
    
    res.status(401).json({ 
      success: false, 
      message: remainingAttempts > 0 
        ? `Invalid authentication code. ${remainingAttempts} attempts remaining.`
        : 'Invalid authentication code.',
      remainingAttempts: Math.max(0, remainingAttempts)
    });
  }
});

// Main page (protected)
app.get('/main', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'main.html'));
});

// Setup page (HTML)
app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'setup.html'));
});

// Get setup information for Microsoft Authenticator (API)
app.get('/api/setup', (req, res) => {
  // Generate QR code for easy setup
  const otpauthUrl = speakeasy.otpauthURL({
    secret: TOTP_SECRET,
    label: SERVICE_NAME,
    issuer: 'SecureWebApp',
    encoding: 'base32'
  });
  
  QRCode.toDataURL(otpauthUrl, (err, dataUrl) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate QR code' });
    }
    
    res.json({
      secret: TOTP_SECRET,
      qrCode: dataUrl,
      manualEntryKey: TOTP_SECRET,
      serviceName: SERVICE_NAME,
      issuer: 'SecureWebApp'
    });
  });
});

// Root redirect
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.redirect('/main');
  } else {
    res.redirect('/login');
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Admin: Regenerate secret key (protected)
app.post('/admin/regenerate-secret', requireAuth, (req, res) => {
  try {
    const oldSecret = TOTP_SECRET;
    TOTP_SECRET = regenerateSecret();
    
    res.json({ 
      success: true, 
      message: 'Secret key regenerated successfully',
      newSecret: TOTP_SECRET,
      oldSecret: oldSecret.substring(0, 8) + '...' // Show only first 8 chars for reference
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to regenerate secret key',
      error: error.message 
    });
  }
});

// Admin: Get current secret info (protected)
app.get('/admin/secret-info', requireAuth, (req, res) => {
  try {
    let secretInfo = { secret: TOTP_SECRET, created: 'Unknown' };
    
    if (fs.existsSync(SECRET_FILE)) {
      const data = fs.readFileSync(SECRET_FILE, 'utf8');
      const secretData = JSON.parse(data);
      secretInfo = {
        secret: secretData.secret,
        created: secretData.created,
        serviceName: secretData.serviceName,
        regenerated: secretData.regenerated || false
      };
    }
    
    res.json(secretInfo);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to read secret info',
      message: error.message 
    });
  }
});

// Check rate limit status for current IP
app.get('/rate-limit-status', (req, res) => {
  const clientIP = getClientIP(req);
  const rateLimitCheck = isRateLimited(clientIP);
  const attempts = loginAttempts.get(clientIP);
  
  res.json({
    ip: clientIP,
    rateLimited: rateLimitCheck.limited,
    remainingTime: rateLimitCheck.remainingTime || 0,
    attempts: attempts ? attempts.count : 0,
    maxAttempts: RATE_LIMIT_CONFIG.maxAttempts,
    lockedUntil: rateLimitCheck.lockedUntil || null
  });
});

// Admin: View all rate limited IPs (protected)
app.get('/admin/rate-limits', requireAuth, (req, res) => {
  const now = Date.now();
  const rateLimitData = [];
  
  for (const [ip, attempts] of loginAttempts.entries()) {
    const isLocked = attempts.lockedUntil && now < attempts.lockedUntil;
    rateLimitData.push({
      ip,
      attempts: attempts.count,
      violations: attempts.violations,
      firstAttempt: new Date(attempts.firstAttempt),
      lastAttempt: new Date(attempts.lastAttempt),
      locked: isLocked,
      lockedUntil: attempts.lockedUntil ? new Date(attempts.lockedUntil) : null,
      remainingTime: isLocked ? Math.ceil((attempts.lockedUntil - now) / 1000 / 60) : 0
    });
  }
  
  res.json({
    totalIPs: rateLimitData.length,
    lockedIPs: rateLimitData.filter(item => item.locked).length,
    config: RATE_LIMIT_CONFIG,
    rateLimits: rateLimitData.sort((a, b) => b.lastAttempt - a.lastAttempt)
  });
});

// Admin: Clear rate limits for specific IP (protected)
app.post('/admin/clear-rate-limit', requireAuth, (req, res) => {
  const { ip } = req.body;
  
  if (!ip) {
    return res.status(400).json({ success: false, message: 'IP address required' });
  }
  
  if (loginAttempts.has(ip)) {
    loginAttempts.delete(ip);
    console.log(`🔓 Admin cleared rate limit for IP: ${ip}`);
    res.json({ success: true, message: `Rate limit cleared for IP: ${ip}` });
  } else {
    res.json({ success: false, message: `No rate limit found for IP: ${ip}` });
  }
});

// Admin: Clear all rate limits (protected)
app.post('/admin/clear-all-rate-limits', requireAuth, (req, res) => {
  const clearedCount = loginAttempts.size;
  loginAttempts.clear();
  console.log(`🔓 Admin cleared all rate limits (${clearedCount} IPs)`);
  res.json({ success: true, message: `Cleared rate limits for ${clearedCount} IPs` });
});

// Check authentication status with session info
app.get('/auth-status', (req, res) => {
  if (req.session && req.session.authenticated) {
    const now = Date.now();
    const sessionAge = now - req.session.createdAt;
    const timeSinceActivity = now - req.session.lastActivity;
    const timeUntilExpiry = SESSION_CONFIG.maxAge - timeSinceActivity;
    const showWarning = timeUntilExpiry <= SESSION_CONFIG.warningTime;
    
    res.json({ 
      authenticated: true,
      user: req.session.user,
      sessionInfo: {
        createdAt: new Date(req.session.createdAt),
        lastActivity: new Date(req.session.lastActivity),
        sessionAge: Math.floor(sessionAge / 1000), // seconds
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000), // seconds
        showWarning,
        maxAge: SESSION_CONFIG.maxAge / 1000 // seconds
      }
    });
  } else {
    res.json({ 
      authenticated: false,
      user: null,
      sessionExpired: true
    });
  }
});

// Extend session endpoint (for keeping session alive)
app.post('/extend-session', requireAuth, (req, res) => {
  const now = Date.now();
  req.session.lastActivity = now;
  req.session.cookie.maxAge = SESSION_CONFIG.maxAge;
  
  console.log(`🔄 Session extended for user`);
  
  res.json({
    success: true,
    message: 'Session extended successfully',
    newExpiry: new Date(now + SESSION_CONFIG.maxAge),
    extendedBy: SESSION_CONFIG.extendTime / 1000 / 60 // minutes
  });
});

// Session info endpoint
app.get('/session-info', requireAuth, (req, res) => {
  const now = Date.now();
  const sessionAge = now - req.session.createdAt;
  const timeSinceActivity = now - req.session.lastActivity;
  const timeUntilExpiry = SESSION_CONFIG.maxAge - timeSinceActivity;
  
  res.json({
    createdAt: new Date(req.session.createdAt),
    lastActivity: new Date(req.session.lastActivity),
    sessionAge: Math.floor(sessionAge / 1000 / 60), // minutes
    timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60), // minutes
    maxSessionTime: SESSION_CONFIG.maxAge / 1000 / 60, // minutes
    warningThreshold: SESSION_CONFIG.warningTime / 1000 / 60, // minutes
    autoExtend: true
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔐 Secure webpage server running on http://localhost:${PORT}`);
  console.log(`\n📱 MICROSOFT AUTHENTICATOR SETUP:`);
  console.log(`🔑 Secret Key: ${TOTP_SECRET}`);
  console.log(`📋 Service Name: ${SERVICE_NAME}`);
  console.log(`🌐 Setup URL: http://localhost:${PORT}/setup`);
  console.log(`\n📖 Instructions:`);
  console.log(`1. Open Microsoft Authenticator app`);
  console.log(`2. Add account > Other (Google, Facebook, etc.)`);
  console.log(`3. Scan QR code at /setup or manually enter the secret key above`);
  console.log(`4. Use the 6-digit code from the app to login`);
});