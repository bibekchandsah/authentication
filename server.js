// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// File to store the secret key persistently
const SECRET_FILE = path.join(__dirname, '.secret-key.json');
const LOGS_FILE = path.join(__dirname, '.security-logs.json');
const SERVICE_NAME = 'Secure Webpage - Bibek Sha';

// Security logging configuration
const LOGGING_CONFIG = {
  maxLogEntries: 1000,        // Maximum log entries to keep
  logRetentionDays: 30,       // Keep logs for 30 days
  cleanupInterval: 24 * 60 * 60 * 1000  // Cleanup every 24 hours
};

// In-memory logs (backed by file)
let securityLogs = [];

// Function to load existing logs
function loadSecurityLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      const logsData = JSON.parse(data);
      securityLogs = logsData.logs || [];
      console.log(`📋 Loaded ${securityLogs.length} security log entries`);
    }
  } catch (error) {
    console.log('⚠️ Could not load existing logs, starting fresh');
    securityLogs = [];
  }
}

// Function to save logs to file
function saveSecurityLogs() {
  try {
    const logsData = {
      logs: securityLogs,
      lastUpdated: new Date().toISOString(),
      totalEntries: securityLogs.length
    };
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logsData, null, 2));
  } catch (error) {
    console.error('❌ Failed to save security logs:', error.message);
  }
}

// Function to add security log entry
function addSecurityLog(type, details) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: type, // 'login_success', 'login_failed', 'logout', 'session_expired', 'rate_limited', 'admin_action'
    ...details
  };

  securityLogs.unshift(logEntry); // Add to beginning

  // Limit log entries
  if (securityLogs.length > LOGGING_CONFIG.maxLogEntries) {
    securityLogs = securityLogs.slice(0, LOGGING_CONFIG.maxLogEntries);
  }

  // Save to file
  saveSecurityLogs();

  return logEntry;
}

// Function to get device info from user agent
function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  // Simple user agent parsing
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
}

// Function to get location info (basic)
function getLocationInfo(ip) {
  // In production, you could use a GeoIP service
  // For now, just basic classification
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { location: 'Local Network', country: 'Local', city: 'Local' };
  }
  return { location: 'External', country: 'Unknown', city: 'Unknown' };
}

// Cleanup old logs
function cleanupOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOGGING_CONFIG.logRetentionDays);

  const initialCount = securityLogs.length;
  securityLogs = securityLogs.filter(log => new Date(log.timestamp) > cutoffDate);

  if (securityLogs.length !== initialCount) {
    console.log(`🧹 Cleaned up ${initialCount - securityLogs.length} old log entries`);
    saveSecurityLogs();
  }
}

// Load logs on startup
loadSecurityLogs();

// Setup cleanup interval
setInterval(cleanupOldLogs, LOGGING_CONFIG.cleanupInterval);

// Notification configuration
const NOTIFICATION_CONFIG = {
  enabled: true,
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true' || false,
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    apiUrl: 'https://api.telegram.org/bot'
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true' || false,
    service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, yahoo, etc.
    host: process.env.EMAIL_HOST || '',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '' // App password for Gmail
    },
    from: process.env.EMAIL_FROM || '',
    to: process.env.EMAIL_TO || ''
  },
  notifications: {
    loginSuccess: true,
    loginFailed: false, // Set to true if you want failed login notifications
    rateLimited: true,
    adminActions: true,
    sessionExpired: false
  }
};

// Email transporter setup
let emailTransporter = null;
if (NOTIFICATION_CONFIG.email.enabled && NOTIFICATION_CONFIG.email.auth.user) {
  try {
    console.log('🔍 Email Debug Info:');
    console.log('- Service:', NOTIFICATION_CONFIG.email.service);
    console.log('- User:', NOTIFICATION_CONFIG.email.auth.user);
    console.log('- From:', NOTIFICATION_CONFIG.email.from);
    console.log('- To:', NOTIFICATION_CONFIG.email.to);
    console.log('- Host:', NOTIFICATION_CONFIG.email.host || 'Using service default');
    console.log('- Port:', NOTIFICATION_CONFIG.email.port);
    
    emailTransporter = nodemailer.createTransport({
      service: NOTIFICATION_CONFIG.email.service,
      host: NOTIFICATION_CONFIG.email.host,
      port: NOTIFICATION_CONFIG.email.port,
      secure: NOTIFICATION_CONFIG.email.secure,
      auth: NOTIFICATION_CONFIG.email.auth
    });
    
    console.log('📧 Email notifications configured successfully');
    
    // Test the connection
    emailTransporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email connection test failed:', error.message);
      } else {
        console.log('✅ Email server connection verified');
      }
    });
    
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    emailTransporter = null;
  }
} else {
  console.log('⚠️ Email notifications disabled or not configured');
}

// Telegram notification function
async function sendTelegramNotification(message) {
  if (!NOTIFICATION_CONFIG.telegram.enabled || !NOTIFICATION_CONFIG.telegram.botToken) {
    console.log('⚠️ Telegram not configured - skipping notification');
    return false;
  }

  try {
    const url = `${NOTIFICATION_CONFIG.telegram.apiUrl}${NOTIFICATION_CONFIG.telegram.botToken}/sendMessage`;
    
    // Debug logging
    console.log('🔍 Telegram Debug Info:');
    console.log('- Bot Token:', NOTIFICATION_CONFIG.telegram.botToken ? `${NOTIFICATION_CONFIG.telegram.botToken.substring(0, 10)}...` : 'NOT SET');
    console.log('- Chat ID:', NOTIFICATION_CONFIG.telegram.chatId);
    console.log('- Chat ID Type:', typeof NOTIFICATION_CONFIG.telegram.chatId);
    console.log('- URL:', url.replace(NOTIFICATION_CONFIG.telegram.botToken, 'TOKEN_HIDDEN'));
    
    const payload = {
      chat_id: NOTIFICATION_CONFIG.telegram.chatId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    
    console.log('- Payload Chat ID:', payload.chat_id, typeof payload.chat_id);
    
    const response = await axios.post(url, payload);
    
    console.log('📱 Telegram notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Telegram notification error:', error.message);
    
    // More detailed error logging
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Common error explanations
    if (error.response?.status === 400) {
      console.error('💡 Common 400 error causes:');
      console.error('   - Invalid bot token format');
      console.error('   - Invalid chat ID (should be a number, not string)');
      console.error('   - Bot hasn\'t been started by the user');
      console.error('   - HTML parsing error in message');
    }
    
    return false;
  }
}

// Email notification function
async function sendEmailNotification(subject, htmlContent, textContent) {
  if (!NOTIFICATION_CONFIG.email.enabled || !emailTransporter) {
    return false;
  }

  try {
    const mailOptions = {
      from: NOTIFICATION_CONFIG.email.from,
      to: NOTIFICATION_CONFIG.email.to,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email notification sent');
    return true;
  } catch (error) {
    console.error('❌ Email notification error:', error.message);
    return false;
  }
}

// Main notification function
async function sendSecurityNotification(type, logEntry) {
  if (!NOTIFICATION_CONFIG.enabled || !NOTIFICATION_CONFIG.notifications[type]) {
    return;
  }

  const timestamp = new Date(logEntry.timestamp).toLocaleString();
  const deviceInfo = `${logEntry.browser}/${logEntry.os} (${logEntry.device})`;
  const locationInfo = logEntry.location || 'Unknown';

  let telegramMessage = '';
  let emailSubject = '';
  let emailHtml = '';
  let emailText = '';

  switch (type) {
    case 'loginSuccess':
      telegramMessage = `🔐 <b>SECURE LOGIN ALERT</b>\n\n` +
        `✅ <b>Successful Login</b>\n` +
        `🕐 Time: ${timestamp}\n` +
        `🌐 IP: <code>${logEntry.ip}</code>\n` +
        `💻 Device: ${deviceInfo}\n` +
        `📍 Location: ${locationInfo}\n` +
        `🔑 Session: ${logEntry.sessionId?.substring(0, 8)}...\n\n` +
        `<i>Secure Webpage - Bibek Sha</i>`;

      emailSubject = '🔐 Security Alert: Successful Login Detected';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1>🔐 Security Alert</h1>
            <h2>Successful Login Detected</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #28a745;">
              <h3 style="color: #28a745; margin-top: 0;">✅ Login Successful</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td>${timestamp}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">IP Address:</td><td><code>${logEntry.ip}</code></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Browser:</td><td>${logEntry.browser}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Operating System:</td><td>${logEntry.os}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Device Type:</td><td>${logEntry.device}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Location:</td><td>${locationInfo}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Session ID:</td><td><code>${logEntry.sessionId?.substring(0, 12)}...</code></td></tr>
              </table>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> If this login was not authorized by you, please check your system immediately and consider regenerating your authentication secret.</p>
            </div>
          </div>
          <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
            <p style="margin: 5px 0 0 0;">This is an automated security notification</p>
          </div>
        </div>
      `;
      emailText = `SECURITY ALERT: Successful Login Detected\n\n` +
        `Time: ${timestamp}\n` +
        `IP Address: ${logEntry.ip}\n` +
        `Device: ${deviceInfo}\n` +
        `Location: ${locationInfo}\n` +
        `Session: ${logEntry.sessionId?.substring(0, 8)}...\n\n` +
        `If this login was not authorized, please check your system immediately.\n\n` +
        `Secure Webpage System - Bibek Sha`;
      break;

    case 'rateLimited':
      telegramMessage = `🚫 <b>SECURITY ALERT</b>\n\n` +
        `⚠️ <b>Rate Limited Access</b>\n` +
        `🕐 Time: ${timestamp}\n` +
        `🌐 IP: <code>${logEntry.ip}</code>\n` +
        `💻 Device: ${deviceInfo}\n` +
        `📍 Location: ${locationInfo}\n` +
        `🔢 Attempts: ${logEntry.totalAttempts}\n` +
        `⏰ Locked for: ${logEntry.remainingTime} minutes\n\n` +
        `<i>Possible brute force attack detected</i>`;

      emailSubject = '🚫 Security Alert: Rate Limited Access Attempt';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center;">
            <h1>🚫 Security Alert</h1>
            <h2>Rate Limited Access Attempt</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #dc3545;">
              <h3 style="color: #dc3545; margin-top: 0;">⚠️ Suspicious Activity Detected</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td>${timestamp}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">IP Address:</td><td><code>${logEntry.ip}</code></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Device:</td><td>${deviceInfo}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Location:</td><td>${locationInfo}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Failed Attempts:</td><td>${logEntry.totalAttempts}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Locked Duration:</td><td>${logEntry.remainingTime} minutes</td></tr>
              </table>
              <p style="margin-top: 15px; color: #dc3545;"><strong>Possible brute force attack detected!</strong></p>
            </div>
          </div>
          <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
          </div>
        </div>
      `;
      emailText = `SECURITY ALERT: Rate Limited Access Attempt\n\n` +
        `Possible brute force attack detected!\n\n` +
        `Time: ${timestamp}\n` +
        `IP: ${logEntry.ip}\n` +
        `Device: ${deviceInfo}\n` +
        `Failed Attempts: ${logEntry.totalAttempts}\n` +
        `Locked for: ${logEntry.remainingTime} minutes`;
      break;

    case 'adminActions':
      telegramMessage = `🛠️ <b>ADMIN ACTION</b>\n\n` +
        `⚙️ <b>${logEntry.action}</b>\n` +
        `🕐 Time: ${timestamp}\n` +
        `🌐 IP: <code>${logEntry.ip}</code>\n` +
        `💻 Device: ${deviceInfo}\n` +
        `📝 Details: ${logEntry.details}\n\n` +
        `<i>Administrative action performed</i>`;

      emailSubject = '🛠️ Admin Action Notification';
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #212529; padding: 20px; text-align: center;">
            <h1>🛠️ Admin Action</h1>
            <h2>${logEntry.action}</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">⚙️ Administrative Action</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td>${timestamp}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Action:</td><td>${logEntry.action}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">IP Address:</td><td><code>${logEntry.ip}</code></td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Device:</td><td>${deviceInfo}</td></tr>
                <tr><td style="padding: 8px 0; font-weight: bold;">Details:</td><td>${logEntry.details}</td></tr>
              </table>
            </div>
          </div>
          <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
          </div>
        </div>
      `;
      emailText = `ADMIN ACTION: ${logEntry.action}\n\n` +
        `Time: ${timestamp}\n` +
        `IP: ${logEntry.ip}\n` +
        `Device: ${deviceInfo}\n` +
        `Details: ${logEntry.details}`;
      break;
  }

  // Send notifications
  const promises = [];
  if (telegramMessage) {
    promises.push(sendTelegramNotification(telegramMessage));
  }
  if (emailSubject && emailHtml) {
    promises.push(sendEmailNotification(emailSubject, emailHtml, emailText));
  }

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('❌ Notification error:', error.message);
  }
}

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
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const deviceInfo = parseUserAgent(userAgent);
      const sessionDuration = Math.floor((now - new Date(req.session.createdAt).getTime()) / 1000 / 60);

      console.log(`⏰ Session expired for user due to inactivity`);

      // Log session expiry
      addSecurityLog('session_expired', {
        ip: clientIP,
        userAgent: userAgent,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device: deviceInfo.device,
        sessionId: req.sessionID,
        sessionDuration: `${sessionDuration} minutes`,
        inactivityTime: `${Math.floor(timeSinceLastActivity / 1000 / 60)} minutes`,
        reason: 'Session expired due to inactivity'
      });

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

// Login POST endpoint with rate limiting and comprehensive logging
app.post('/login', (req, res) => {
  const { authCode } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);
  const locationInfo = getLocationInfo(clientIP);

  // Common log details
  const logDetails = {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    location: locationInfo.location,
    country: locationInfo.country,
    city: locationInfo.city,
    authCode: authCode ? authCode.substring(0, 2) + '****' : 'none' // Partial code for security
  };

  // Check rate limiting
  const rateLimitCheck = isRateLimited(clientIP);
  if (rateLimitCheck.limited) {
    console.log(`🚫 Rate limited login attempt from IP: ${clientIP}`);

    // Log rate limited attempt
    const rateLimitLog = addSecurityLog('rate_limited', {
      ...logDetails,
      reason: 'Too many failed attempts',
      remainingTime: rateLimitCheck.remainingTime,
      totalAttempts: rateLimitCheck.attempts
    });

    // Send notification for rate limiting
    sendSecurityNotification('rateLimited', rateLimitLog).catch(err =>
      console.error('Notification error:', err.message)
    );

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
    req.session.loginTime = new Date().toISOString();
    req.session.loginIP = clientIP;
    req.session.deviceInfo = deviceInfo;

    console.log(`✅ Successful login from IP: ${clientIP}`);

    // Log successful login
    const loginLog = addSecurityLog('login_success', {
      ...logDetails,
      sessionId: req.sessionID,
      message: 'Successful authentication'
    });

    // Send instant notification
    sendSecurityNotification('loginSuccess', loginLog).catch(err =>
      console.error('Notification error:', err.message)
    );

    res.json({ success: true, message: 'Authentication successful' });
  } else {
    // Failed login - record attempt
    recordFailedAttempt(clientIP);
    const attemptsInfo = loginAttempts.get(clientIP);
    const remainingAttempts = RATE_LIMIT_CONFIG.maxAttempts - (attemptsInfo ? attemptsInfo.count : 0);

    console.log(`❌ Failed login attempt from IP: ${clientIP} (${attemptsInfo ? attemptsInfo.count : 1}/${RATE_LIMIT_CONFIG.maxAttempts})`);

    // Log failed login
    addSecurityLog('login_failed', {
      ...logDetails,
      reason: 'Invalid authentication code',
      attemptNumber: attemptsInfo ? attemptsInfo.count : 1,
      remainingAttempts: Math.max(0, remainingAttempts)
    });

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

// Logout endpoint with logging
app.post('/logout', (req, res) => {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);
  const sessionDuration = req.session && req.session.loginTime
    ? Math.floor((Date.now() - new Date(req.session.loginTime).getTime()) / 1000 / 60) // minutes
    : 0;

  // Log logout
  addSecurityLog('logout', {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    sessionId: req.sessionID,
    sessionDuration: `${sessionDuration} minutes`,
    logoutType: 'manual',
    message: 'User initiated logout'
  });

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    console.log(`👋 User logged out from IP: ${clientIP}`);
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
  const clientIP = getClientIP(req);

  loginAttempts.clear();
  console.log(`🔓 Admin cleared all rate limits (${clearedCount} IPs)`);

  // Log admin action
  const adminLog = addSecurityLog('admin_action', {
    ip: clientIP,
    action: 'clear_all_rate_limits',
    details: `Cleared rate limits for ${clearedCount} IPs`,
    userAgent: req.headers['user-agent'] || '',
    browser: parseUserAgent(req.headers['user-agent'] || '').browser,
    os: parseUserAgent(req.headers['user-agent'] || '').os,
    device: parseUserAgent(req.headers['user-agent'] || '').device
  });

  // Send notification for admin action
  sendSecurityNotification('adminActions', adminLog).catch(err =>
    console.error('Notification error:', err.message)
  );

  res.json({ success: true, message: `Cleared rate limits for ${clearedCount} IPs` });
});

// Admin: View security logs (protected)
app.get('/admin/security-logs', requireAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const type = req.query.type || 'all';
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let filteredLogs = [...securityLogs];

  // Filter by type
  if (type !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.type === type);
  }

  // Filter by date range
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Statistics
  const stats = {
    total: securityLogs.length,
    filtered: filteredLogs.length,
    loginSuccess: securityLogs.filter(log => log.type === 'login_success').length,
    loginFailed: securityLogs.filter(log => log.type === 'login_failed').length,
    rateLimited: securityLogs.filter(log => log.type === 'rate_limited').length,
    logouts: securityLogs.filter(log => log.type === 'logout').length,
    adminActions: securityLogs.filter(log => log.type === 'admin_action').length,
    uniqueIPs: [...new Set(securityLogs.map(log => log.ip))].length,
    last24Hours: securityLogs.filter(log =>
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  res.json({
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      total: filteredLogs.length,
      pages: Math.ceil(filteredLogs.length / limit)
    },
    filters: { type, startDate, endDate },
    statistics: stats
  });
});

// Admin: Get security dashboard summary (protected)
app.get('/admin/security-dashboard', requireAuth, (req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Recent activity
  const recentLogs = securityLogs.filter(log => new Date(log.timestamp) > last24h);
  const weeklyLogs = securityLogs.filter(log => new Date(log.timestamp) > last7d);

  // Top IPs
  const ipCounts = {};
  securityLogs.forEach(log => {
    ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
  });
  const topIPs = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Failed login attempts by IP
  const failedAttempts = {};
  securityLogs
    .filter(log => log.type === 'login_failed')
    .forEach(log => {
      failedAttempts[log.ip] = (failedAttempts[log.ip] || 0) + 1;
    });
  const topFailedIPs = Object.entries(failedAttempts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  // Browser/OS statistics
  const browsers = {};
  const operatingSystems = {};
  securityLogs.forEach(log => {
    if (log.browser) browsers[log.browser] = (browsers[log.browser] || 0) + 1;
    if (log.os) operatingSystems[log.os] = (operatingSystems[log.os] || 0) + 1;
  });

  res.json({
    summary: {
      totalLogs: securityLogs.length,
      last24Hours: recentLogs.length,
      last7Days: weeklyLogs.length,
      successfulLogins: securityLogs.filter(log => log.type === 'login_success').length,
      failedLogins: securityLogs.filter(log => log.type === 'login_failed').length,
      rateLimitedAttempts: securityLogs.filter(log => log.type === 'rate_limited').length,
      uniqueIPs: Object.keys(ipCounts).length
    },
    recentActivity: recentLogs.slice(0, 10),
    topIPs,
    topFailedIPs,
    browsers: Object.entries(browsers).sort(([, a], [, b]) => b - a).slice(0, 5),
    operatingSystems: Object.entries(operatingSystems).sort(([, a], [, b]) => b - a).slice(0, 5),
    timeline: {
      last24h: recentLogs.length,
      last7d: weeklyLogs.length,
      thisMonth: securityLogs.filter(log =>
        new Date(log.timestamp).getMonth() === now.getMonth() &&
        new Date(log.timestamp).getFullYear() === now.getFullYear()
      ).length
    }
  });
});

// Admin: Export security logs (protected)
app.get('/admin/export-logs', requireAuth, (req, res) => {
  const format = req.query.format || 'json';
  const clientIP = getClientIP(req);

  // Log export action
  addSecurityLog('admin_action', {
    ip: clientIP,
    action: 'export_logs',
    details: `Exported ${securityLogs.length} log entries in ${format} format`,
    userAgent: req.headers['user-agent'] || ''
  });

  if (format === 'csv') {
    // CSV export
    const csvHeader = 'Timestamp,Type,IP,Browser,OS,Device,Location,Message\n';
    const csvData = securityLogs.map(log =>
      `"${log.timestamp}","${log.type}","${log.ip}","${log.browser || ''}","${log.os || ''}","${log.device || ''}","${log.location || ''}","${log.message || log.reason || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvData);
  } else {
    // JSON export
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      totalEntries: securityLogs.length,
      logs: securityLogs
    });
  }
});

// Admin: Get notification settings (protected)
app.get('/admin/notification-settings', requireAuth, (req, res) => {
  res.json({
    enabled: NOTIFICATION_CONFIG.enabled,
    telegram: {
      enabled: NOTIFICATION_CONFIG.telegram.enabled,
      configured: !!(NOTIFICATION_CONFIG.telegram.botToken && NOTIFICATION_CONFIG.telegram.chatId)
    },
    email: {
      enabled: NOTIFICATION_CONFIG.email.enabled,
      configured: !!(NOTIFICATION_CONFIG.email.auth.user && NOTIFICATION_CONFIG.email.to)
    },
    notifications: NOTIFICATION_CONFIG.notifications
  });
});

// Admin: Validate Email setup (protected)
app.get('/admin/validate-email', requireAuth, (req, res) => {
  const validation = {
    enabled: NOTIFICATION_CONFIG.email.enabled,
    userSet: !!NOTIFICATION_CONFIG.email.auth.user,
    passSet: !!NOTIFICATION_CONFIG.email.auth.pass,
    fromSet: !!NOTIFICATION_CONFIG.email.from,
    toSet: !!NOTIFICATION_CONFIG.email.to,
    serviceSet: !!NOTIFICATION_CONFIG.email.service,
    transporterCreated: !!emailTransporter
  };
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  validation.fromValid = validation.fromSet && emailRegex.test(NOTIFICATION_CONFIG.email.from);
  validation.toValid = validation.toSet && emailRegex.test(NOTIFICATION_CONFIG.email.to);
  validation.userValid = validation.userSet && emailRegex.test(NOTIFICATION_CONFIG.email.auth.user);
  
  validation.allValid = validation.enabled && validation.userSet && validation.passSet && 
                       validation.fromSet && validation.toSet && validation.transporterCreated &&
                       validation.fromValid && validation.toValid && validation.userValid;
  
  // Add configuration details (without sensitive info)
  validation.config = {
    service: NOTIFICATION_CONFIG.email.service,
    host: NOTIFICATION_CONFIG.email.host || 'Using service default',
    port: NOTIFICATION_CONFIG.email.port,
    secure: NOTIFICATION_CONFIG.email.secure,
    from: NOTIFICATION_CONFIG.email.from,
    to: NOTIFICATION_CONFIG.email.to,
    user: NOTIFICATION_CONFIG.email.auth.user
  };
  
  res.json(validation);
});

// Admin: Validate Telegram setup (protected)
app.get('/admin/validate-telegram', requireAuth, (req, res) => {
  const validation = {
    enabled: NOTIFICATION_CONFIG.telegram.enabled,
    botTokenSet: !!NOTIFICATION_CONFIG.telegram.botToken,
    chatIdSet: !!NOTIFICATION_CONFIG.telegram.chatId,
    botTokenFormat: false,
    chatIdFormat: false
  };
  
  // Validate bot token format
  if (NOTIFICATION_CONFIG.telegram.botToken) {
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    validation.botTokenFormat = tokenRegex.test(NOTIFICATION_CONFIG.telegram.botToken);
    validation.botTokenLength = NOTIFICATION_CONFIG.telegram.botToken.length;
  }
  
  // Validate chat ID format
  if (NOTIFICATION_CONFIG.telegram.chatId) {
    validation.chatIdFormat = !isNaN(NOTIFICATION_CONFIG.telegram.chatId);
    validation.chatIdValue = NOTIFICATION_CONFIG.telegram.chatId;
    validation.chatIdType = typeof NOTIFICATION_CONFIG.telegram.chatId;
  }
  
  validation.allValid = validation.enabled && validation.botTokenSet && validation.chatIdSet && 
                       validation.botTokenFormat && validation.chatIdFormat;
  
  res.json(validation);
});

// Admin: Test notifications (protected)
app.post('/admin/test-notifications', requireAuth, (req, res) => {
  const { type } = req.body; // 'telegram', 'email', or 'both'
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  const testLog = {
    timestamp: new Date().toISOString(),
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    location: 'Test Location',
    sessionId: 'test-session-123',
    message: 'Test notification from admin panel'
  };

  const promises = [];

  if (type === 'telegram' || type === 'both') {
    const testMessage = `🧪 <b>TEST NOTIFICATION</b>\n\n` +
      `✅ <b>Notification Test</b>\n` +
      `🕐 Time: ${new Date().toLocaleString()}\n` +
      `🌐 IP: <code>${clientIP}</code>\n` +
      `💻 Device: ${deviceInfo.browser}/${deviceInfo.os}\n` +
      `👤 Initiated by: Admin\n\n` +
      `<i>This is a test notification from your secure webpage system.</i>`;

    promises.push(sendTelegramNotification(testMessage));
  }

  if (type === 'email' || type === 'both') {
    const testSubject = '🧪 Test Notification - Secure Webpage System';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; text-align: center;">
          <h1>🧪 Test Notification</h1>
          <h2>System Test Successful</h2>
        </div>
        <div style="padding: 20px; background: #f8f9fa;">
          <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #17a2b8;">
            <h3 style="color: #17a2b8; margin-top: 0;">✅ Notification System Working</h3>
            <p>This is a test notification sent from your secure webpage admin panel.</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Test Time:</td><td>${new Date().toLocaleString()}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Initiated From:</td><td><code>${clientIP}</code></td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Admin Device:</td><td>${deviceInfo.browser}/${deviceInfo.os}</td></tr>
            </table>
            <p style="margin-top: 15px; color: #17a2b8;"><strong>Your notification system is working correctly!</strong></p>
          </div>
        </div>
        <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
        </div>
      </div>
    `;
    const testText = `TEST NOTIFICATION - Secure Webpage System\n\n` +
      `This is a test notification from your admin panel.\n` +
      `Test Time: ${new Date().toLocaleString()}\n` +
      `Your notification system is working correctly!`;

    promises.push(sendEmailNotification(testSubject, testHtml, testText));
  }

  Promise.all(promises)
    .then(results => {
      const telegramSent = type === 'telegram' || type === 'both' ? results[0] : null;
      const emailSent = type === 'email' || type === 'both' ? results[type === 'both' ? 1 : 0] : null;

      res.json({
        success: true,
        message: 'Test notifications sent',
        results: {
          telegram: telegramSent,
          email: emailSent
        }
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        message: 'Test notification failed',
        error: error.message
      });
    });
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