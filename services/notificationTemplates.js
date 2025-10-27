// Telegram notification templates for different events

// Generate Telegram message for different notification types
function generateTelegramMessage(type, logEntry) {
  const timestamp = new Date(logEntry.timestamp).toLocaleString();
  const deviceInfo = `${logEntry.browser}/${logEntry.os} (${logEntry.device})`;
  const locationInfo = logEntry.location || 'Unknown';

  switch (type) {
    case 'loginSuccess':
      return `🔐 <b>SECURE LOGIN ALERT</b>\n\n` +
             `✅ <b>Successful Login</b>\n` +
             `🕐 Time: ${timestamp}\n` +
             `🌐 IP: <code>${logEntry.ip}</code>\n` +
             `🏙️ City: ${logEntry.city || 'Unknown'}\n` +
             `🗺️ Region: ${logEntry.region || 'Unknown'}\n` +
             `🌍 Country: ${logEntry.country || 'Unknown'} (${logEntry.countryCode || 'XX'})\n` +
             `📍 Location: ${locationInfo}\n` +
             `📮 Postal: ${logEntry.postal || 'Unknown'}\n` +
             `🕒 Timezone: ${logEntry.timezone || 'Unknown'}\n` +
             `📡 ISP: ${logEntry.isp || logEntry.org || 'Unknown'}\n` +
             `🏢 Organization: ${logEntry.org || 'Unknown'}\n` +
             `📐 Coordinates: ${logEntry.latitude && logEntry.longitude ? `${logEntry.latitude}, ${logEntry.longitude}` : 'Unknown'}\n` +
             `💻 Browser: ${logEntry.browser || 'Unknown'}\n` +
             `🖥️ OS: ${logEntry.os || 'Unknown'}\n` +
             `📱 Device: ${logEntry.device || 'Unknown'}\n` +
             `🌐 User Agent: <code>${(logEntry.userAgent || 'Unknown').substring(0, 50)}...</code>\n` +
             `🗣️ Language: ${logEntry.acceptLanguage || 'Unknown'}\n` +
             `🔑 Session: ${logEntry.sessionId?.substring(0, 8)}...\n\n` +
             `<i>Secure Webpage - Bibek Sha</i>`;

    case 'rateLimited':
      return `🚫 <b>SECURITY ALERT</b>\n\n` +
             `⚠️ <b>Rate Limited Access</b>\n` +
             `🕐 Time: ${timestamp}\n` +
             `🌐 IP: <code>${logEntry.ip}</code>\n` +
             `🏙️ City: ${logEntry.city || 'Unknown'}\n` +
             `🗺️ Region: ${logEntry.region || 'Unknown'}\n` +
             `🌍 Country: ${logEntry.country || 'Unknown'} (${logEntry.countryCode || 'XX'})\n` +
             `📍 Location: ${locationInfo}\n` +
             `📡 ISP: ${logEntry.isp || logEntry.org || 'Unknown'}\n` +
             `💻 Browser: ${logEntry.browser || 'Unknown'}\n` +
             `🖥️ OS: ${logEntry.os || 'Unknown'}\n` +
             `📱 Device: ${logEntry.device || 'Unknown'}\n` +
             `🔢 Attempts: ${logEntry.totalAttempts}\n` +
             `⏰ Locked for: ${logEntry.remainingTime} minutes\n\n` +
             `<i>Possible brute force attack detected</i>`;

    case 'adminActions':
      return `🛠️ <b>ADMIN ACTION</b>\n\n` +
             `⚙️ <b>${logEntry.action}</b>\n` +
             `🕐 Time: ${timestamp}\n` +
             `🌐 IP: <code>${logEntry.ip}</code>\n` +
             `🏙️ City: ${logEntry.city || 'Unknown'}\n` +
             `🗺️ Region: ${logEntry.region || 'Unknown'}\n` +
             `🌍 Country: ${logEntry.country || 'Unknown'}\n` +
             `📡 ISP: ${logEntry.isp || logEntry.org || 'Unknown'}\n` +
             `💻 Device: ${deviceInfo}\n` +
             `📝 Details: ${logEntry.details}\n\n` +
             `<i>Administrative action performed</i>`;

    default:
      return `📝 <b>SECURITY EVENT</b>\n\n` +
             `Event: ${type}\n` +
             `Time: ${timestamp}\n` +
             `IP: <code>${logEntry.ip}</code>\n` +
             `Device: ${deviceInfo}`;
  }
}

module.exports = {
  generateTelegramMessage
};