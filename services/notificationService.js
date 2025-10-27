// Load environment variables
require('dotenv').config();

// Notification configuration (Telegram only)
const NOTIFICATION_CONFIG = {
  enabled: true,
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true' || false,
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    apiUrl: 'https://api.telegram.org/bot'
  },
  notifications: {
    loginSuccess: true,
    loginFailed: false,
    rateLimited: true,
    adminActions: true,
    sessionExpired: false
  }
};

// Initialize Telegram-only notification system
console.log('📱 Telegram-only notification system initialized');

// Export configuration for external access
function getNotificationConfig() {
  return NOTIFICATION_CONFIG;
}

module.exports = {
  NOTIFICATION_CONFIG,
  getNotificationConfig
};