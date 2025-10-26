// Notification message templates for different events

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
             `💻 Device: ${deviceInfo}\n` +
             `📍 Location: ${locationInfo}\n` +
             `🔑 Session: ${logEntry.sessionId?.substring(0, 8)}...\n\n` +
             `<i>Secure Webpage - Bibek Sha</i>`;

    case 'rateLimited':
      return `🚫 <b>SECURITY ALERT</b>\n\n` +
             `⚠️ <b>Rate Limited Access</b>\n` +
             `🕐 Time: ${timestamp}\n` +
             `🌐 IP: <code>${logEntry.ip}</code>\n` +
             `💻 Device: ${deviceInfo}\n` +
             `📍 Location: ${locationInfo}\n` +
             `🔢 Attempts: ${logEntry.totalAttempts}\n` +
             `⏰ Locked for: ${logEntry.remainingTime} minutes\n\n` +
             `<i>Possible brute force attack detected</i>`;

    case 'adminActions':
      return `🛠️ <b>ADMIN ACTION</b>\n\n` +
             `⚙️ <b>${logEntry.action}</b>\n` +
             `🕐 Time: ${timestamp}\n` +
             `🌐 IP: <code>${logEntry.ip}</code>\n` +
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

// Generate Email subject for different notification types
function generateEmailSubject(type, logEntry) {
  switch (type) {
    case 'loginSuccess':
      return '🔐 Security Alert: Successful Login Detected';
    case 'rateLimited':
      return '🚫 Security Alert: Rate Limited Access Attempt';
    case 'adminActions':
      return '🛠️ Admin Action Notification';
    default:
      return '🔔 Security Notification';
  }
}

// Generate Email HTML content for different notification types
function generateEmailHTML(type, logEntry) {
  const timestamp = new Date(logEntry.timestamp).toLocaleString();
  const deviceInfo = `${logEntry.browser}/${logEntry.os} (${logEntry.device})`;
  const locationInfo = logEntry.location || 'Unknown';

  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, {headerColor}); color: white; padding: 20px; text-align: center;">
        <h1>{headerIcon} Security Alert</h1>
        <h2>{headerTitle}</h2>
      </div>
      <div style="padding: 20px; background: #f8f9fa;">
        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid {borderColor};">
          <h3 style="color: {textColor}; margin-top: 0;">{contentIcon} {contentTitle}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td>${timestamp}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">IP Address:</td><td><code>${logEntry.ip}</code></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Browser:</td><td>${logEntry.browser}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Operating System:</td><td>${logEntry.os}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Device Type:</td><td>${logEntry.device}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Location:</td><td>${locationInfo}</td></tr>
            {additionalRows}
          </table>
          {additionalContent}
        </div>
        {warningSection}
      </div>
      <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
        <p style="margin: 5px 0 0 0;">This is an automated security notification</p>
      </div>
    </div>
  `;

  switch (type) {
    case 'loginSuccess':
      return baseStyle
        .replace('{headerColor}', '#667eea 0%, #764ba2 100%')
        .replace('{headerIcon}', '🔐')
        .replace('{headerTitle}', 'Successful Login Detected')
        .replace('{borderColor}', '#28a745')
        .replace('{textColor}', '#28a745')
        .replace('{contentIcon}', '✅')
        .replace('{contentTitle}', 'Login Successful')
        .replace('{additionalRows}', `<tr><td style="padding: 8px 0; font-weight: bold;">Session ID:</td><td><code>${logEntry.sessionId?.substring(0, 12)}...</code></td></tr>`)
        .replace('{additionalContent}', '')
        .replace('{warningSection}', `
          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>⚠️ Security Notice:</strong> If this login was not authorized by you, please check your system immediately and consider regenerating your authentication secret.</p>
          </div>
        `);

    case 'rateLimited':
      return baseStyle
        .replace('{headerColor}', '#dc3545 0%, #c82333 100%')
        .replace('{headerIcon}', '🚫')
        .replace('{headerTitle}', 'Rate Limited Access Attempt')
        .replace('{borderColor}', '#dc3545')
        .replace('{textColor}', '#dc3545')
        .replace('{contentIcon}', '⚠️')
        .replace('{contentTitle}', 'Suspicious Activity Detected')
        .replace('{additionalRows}', `
          <tr><td style="padding: 8px 0; font-weight: bold;">Failed Attempts:</td><td>${logEntry.totalAttempts}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Locked Duration:</td><td>${logEntry.remainingTime} minutes</td></tr>
        `)
        .replace('{additionalContent}', '<p style="margin-top: 15px; color: #dc3545;"><strong>Possible brute force attack detected!</strong></p>')
        .replace('{warningSection}', '');

    case 'adminActions':
      return baseStyle
        .replace('{headerColor}', '#ffc107 0%, #e0a800 100%')
        .replace('{headerIcon}', '🛠️')
        .replace('{headerTitle}', logEntry.action)
        .replace('{borderColor}', '#ffc107')
        .replace('{textColor}', '#856404')
        .replace('{contentIcon}', '⚙️')
        .replace('{contentTitle}', 'Administrative Action')
        .replace('{additionalRows}', `
          <tr><td style="padding: 8px 0; font-weight: bold;">Action:</td><td>${logEntry.action}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Details:</td><td>${logEntry.details}</td></tr>
        `)
        .replace('{additionalContent}', '')
        .replace('{warningSection}', '');

    default:
      return baseStyle
        .replace('{headerColor}', '#6c757d 0%, #495057 100%')
        .replace('{headerIcon}', '📝')
        .replace('{headerTitle}', 'Security Event')
        .replace('{borderColor}', '#6c757d')
        .replace('{textColor}', '#6c757d')
        .replace('{contentIcon}', '📝')
        .replace('{contentTitle}', 'Security Event')
        .replace('{additionalRows}', '')
        .replace('{additionalContent}', '')
        .replace('{warningSection}', '');
  }
}

// Generate Email text content for different notification types
function generateEmailText(type, logEntry) {
  const timestamp = new Date(logEntry.timestamp).toLocaleString();
  const deviceInfo = `${logEntry.browser}/${logEntry.os} (${logEntry.device})`;
  const locationInfo = logEntry.location || 'Unknown';

  switch (type) {
    case 'loginSuccess':
      return `SECURITY ALERT: Successful Login Detected\n\n` +
             `Time: ${timestamp}\n` +
             `IP Address: ${logEntry.ip}\n` +
             `Device: ${deviceInfo}\n` +
             `Location: ${locationInfo}\n` +
             `Session: ${logEntry.sessionId?.substring(0, 8)}...\n\n` +
             `If this login was not authorized, please check your system immediately.\n\n` +
             `Secure Webpage System - Bibek Sha`;

    case 'rateLimited':
      return `SECURITY ALERT: Rate Limited Access Attempt\n\n` +
             `Possible brute force attack detected!\n\n` +
             `Time: ${timestamp}\n` +
             `IP: ${logEntry.ip}\n` +
             `Device: ${deviceInfo}\n` +
             `Failed Attempts: ${logEntry.totalAttempts}\n` +
             `Locked for: ${logEntry.remainingTime} minutes`;

    case 'adminActions':
      return `ADMIN ACTION: ${logEntry.action}\n\n` +
             `Time: ${timestamp}\n` +
             `IP: ${logEntry.ip}\n` +
             `Device: ${deviceInfo}\n` +
             `Details: ${logEntry.details}`;

    default:
      return `SECURITY EVENT: ${type}\n\n` +
             `Time: ${timestamp}\n` +
             `IP: ${logEntry.ip}\n` +
             `Device: ${deviceInfo}`;
  }
}

module.exports = {
  generateTelegramMessage,
  generateEmailSubject,
  generateEmailHTML,
  generateEmailText
};