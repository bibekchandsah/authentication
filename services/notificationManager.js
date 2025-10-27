const { sendTelegramNotification } = require('./telegramService');
const { getNotificationConfig } = require('./notificationService');
const { generateTelegramMessage } = require('./notificationTemplates');

// Main notification function that coordinates all notification services
async function sendSecurityNotification(type, logEntry) {
  const config = getNotificationConfig();
  
  if (!config.enabled || !config.notifications[type]) {
    return;
  }

  try {
    const promises = [];

    // Generate Telegram message
    if (config.telegram.enabled) {
      const telegramMessage = generateTelegramMessage(type, logEntry);
      if (telegramMessage) {
        promises.push(sendTelegramNotification(telegramMessage));
      }
    }

    // All notifications are Telegram-only now
    console.log(`📱 Using Telegram-only notifications for: ${type}`);

    // Send all notifications
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log(`📢 Security notification sent for: ${type}`);
    }

  } catch (error) {
    console.error('❌ Notification manager error:', error.message);
  }
}

// Test notifications function (Telegram only)
async function testNotifications(type, clientIP, deviceInfo) {
  const results = {};

  // Only test Telegram notifications
  const { testTelegramNotification } = require('./telegramService');
  try {
    results.telegram = await testTelegramNotification(clientIP, deviceInfo);
    console.log('📱 Telegram test notification completed');
  } catch (error) {
    results.telegram = false;
    console.error('❌ Telegram test failed:', error.message);
  }

  return results;
}

// Get notification settings (Telegram only)
function getNotificationSettings() {
  const config = getNotificationConfig();
  
  return {
    enabled: config.enabled,
    telegram: {
      enabled: config.telegram.enabled,
      configured: !!(config.telegram.botToken && config.telegram.chatId)
    },
    notifications: config.notifications,
    type: 'telegram-only'
  };
}

module.exports = {
  sendSecurityNotification,
  testNotifications,
  getNotificationSettings
};