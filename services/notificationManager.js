const { sendTelegramNotification } = require('./telegramService');
const { sendEmailNotification } = require('./emailService');
const { sendSendGridEmail } = require('./sendgridService');
const { getNotificationConfig } = require('./notificationService');
const { 
  generateTelegramMessage, 
  generateEmailSubject, 
  generateEmailHTML, 
  generateEmailText 
} = require('./notificationTemplates');

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

    // Generate Email content (try SendGrid first, fallback to Gmail)
    if (config.email.enabled) {
      const emailSubject = generateEmailSubject(type, logEntry);
      const emailHtml = generateEmailHTML(type, logEntry);
      const emailText = generateEmailText(type, logEntry);
      
      if (emailSubject && emailHtml && emailText) {
        // Smart email sending with fallback
        promises.push(
          (async () => {
            try {
              // Try SendGrid first
              const sendGridResult = await sendSendGridEmail(emailSubject, emailHtml, emailText);
              if (sendGridResult) {
                return true;
              }
              
              // If SendGrid not configured or failed, try Gmail SMTP
              console.log('⚠️ SendGrid not available, trying Gmail SMTP...');
              return await sendEmailNotification(emailSubject, emailHtml, emailText);
              
            } catch (error) {
              console.error('❌ All email methods failed:', error.message);
              return false;
            }
          })()
        );
      }
    }

    // Send all notifications
    if (promises.length > 0) {
      await Promise.all(promises);
      console.log(`📢 Security notification sent for: ${type}`);
    }

  } catch (error) {
    console.error('❌ Notification manager error:', error.message);
  }
}

// Test notifications function
async function testNotifications(type, clientIP, deviceInfo) {
  const promises = [];
  const results = {};

  if (type === 'telegram' || type === 'both') {
    const { testTelegramNotification } = require('./telegramService');
    promises.push(
      testTelegramNotification(clientIP, deviceInfo)
        .then(result => { results.telegram = result; })
        .catch(error => { results.telegram = false; })
    );
  }

  if (type === 'email' || type === 'both') {
    const { testEmailNotification } = require('./emailService');
    promises.push(
      testEmailNotification(clientIP, deviceInfo)
        .then(result => { results.email = result; })
        .catch(error => { results.email = false; })
    );
  }

  await Promise.all(promises);
  return results;
}

// Get notification settings
function getNotificationSettings() {
  const config = getNotificationConfig();
  
  return {
    enabled: config.enabled,
    telegram: {
      enabled: config.telegram.enabled,
      configured: !!(config.telegram.botToken && config.telegram.chatId)
    },
    email: {
      enabled: config.email.enabled,
      configured: !!(config.email.auth.user && config.email.to)
    },
    notifications: config.notifications
  };
}

module.exports = {
  sendSecurityNotification,
  testNotifications,
  getNotificationSettings
};