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

// Session configuration
app.use(session({
  secret: 'secure-session-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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

// Login POST endpoint
app.post('/login', (req, res) => {
  const { authCode } = req.body;
  
  // Verify the TOTP code from Microsoft Authenticator
  const verified = speakeasy.totp.verify({
    secret: TOTP_SECRET,
    encoding: 'base32',
    token: authCode,
    window: 2 // Allow 2 time steps (60 seconds) tolerance
  });
  
  if (verified) {
    req.session.authenticated = true;
    req.session.user = 'Authorized User';
    res.json({ success: true, message: 'Authentication successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid authentication code' });
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

// Check authentication status
app.get('/auth-status', (req, res) => {
  res.json({ 
    authenticated: !!(req.session && req.session.authenticated),
    user: req.session ? req.session.user : null
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