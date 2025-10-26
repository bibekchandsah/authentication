const axios = require('axios');
const { getNotificationConfig } = require('./notificationService');

// Telegram notification function
async function sendTelegramNotification(message) {
  const config = getNotificationConfig();
  
  if (!config.telegram.enabled || !config.telegram.botToken) {
    console.log('⚠️ Telegram not configured - skipping notification');
    return false;
  }

  try {
    const url = `${config.telegram.apiUrl}${config.telegram.botToken}/sendMessage`;
    
    // Debug logging
    console.log('🔍 Telegram Debug Info:');
    console.log('- Bot Token:', config.telegram.botToken ? `${config.telegram.botToken.substring(0, 10)}...` : 'NOT SET');
    console.log('- Chat ID:', config.telegram.chatId);
    console.log('- Chat ID Type:', typeof config.telegram.chatId);
    console.log('- URL:', url.replace(config.telegram.botToken, 'TOKEN_HIDDEN'));
    
    const payload = {
      chat_id: config.telegram.chatId,
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

// Validate Telegram configuration
function validateTelegramConfig() {
  const config = getNotificationConfig();
  
  const validation = {
    enabled: config.telegram.enabled,
    botTokenSet: !!config.telegram.botToken,
    chatIdSet: !!config.telegram.chatId,
    botTokenFormat: false,
    chatIdFormat: false
  };
  
  // Validate bot token format
  if (config.telegram.botToken) {
    const tokenRegex = /^\d+:[A-Za-z0-9_-]+$/;
    validation.botTokenFormat = tokenRegex.test(config.telegram.botToken);
    validation.botTokenLength = config.telegram.botToken.length;
  }
  
  // Validate chat ID format
  if (config.telegram.chatId) {
    validation.chatIdFormat = !isNaN(config.telegram.chatId);
    validation.chatIdValue = config.telegram.chatId;
    validation.chatIdType = typeof config.telegram.chatId;
  }
  
  validation.allValid = validation.enabled && validation.botTokenSet && validation.chatIdSet && 
                       validation.botTokenFormat && validation.chatIdFormat;
  
  return validation;
}

// Test Telegram notification
async function testTelegramNotification(clientIP, deviceInfo) {
  const testMessage = `🧪 <b>TEST NOTIFICATION</b>\n\n` +
                     `✅ <b>Notification Test</b>\n` +
                     `🕐 Time: ${new Date().toLocaleString()}\n` +
                     `🌐 IP: <code>${clientIP}</code>\n` +
                     `💻 Device: ${deviceInfo.browser}/${deviceInfo.os}\n` +
                     `👤 Initiated by: Admin\n\n` +
                     `<i>This is a test notification from your secure webpage system.</i>`;
  
  return await sendTelegramNotification(testMessage);
}

module.exports = {
  sendTelegramNotification,
  validateTelegramConfig,
  testTelegramNotification
};