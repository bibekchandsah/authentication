// Load environment variables
require('dotenv').config();

const nodemailer = require('nodemailer');
const axios = require('axios');

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
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST || '',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true' || false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    },
    from: process.env.EMAIL_FROM || '',
    to: process.env.EMAIL_TO || ''
  },
  notifications: {
    loginSuccess: true,
    loginFailed: false,
    rateLimited: true,
    adminActions: true,
    sessionExpired: false
  }
};

// Email transporter setup
let emailTransporter = null;

function initializeEmailTransporter() {
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
}

// Initialize email transporter
initializeEmailTransporter();

// Export configuration for external access
function getNotificationConfig() {
  return NOTIFICATION_CONFIG;
}

// Export email transporter for external access
function getEmailTransporter() {
  return emailTransporter;
}

module.exports = {
  NOTIFICATION_CONFIG,
  getNotificationConfig,
  getEmailTransporter,
  initializeEmailTransporter
};