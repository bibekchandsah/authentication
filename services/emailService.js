const { getNotificationConfig, getEmailTransporter } = require('./notificationService');

// Email notification function with retry logic
async function sendEmailNotification(subject, htmlContent, textContent) {
  const config = getNotificationConfig();
  const emailTransporter = getEmailTransporter();
  
  if (!config.email.enabled || !emailTransporter) {
    console.log('⚠️ Email not configured - skipping notification');
    return false;
  }

  const maxRetries = parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3;
  const retryDelay = parseInt(process.env.EMAIL_RETRY_DELAY) || 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending email (attempt ${attempt}/${maxRetries})...`);
      
      const mailOptions = {
        from: config.email.from,
        to: config.email.to,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      await emailTransporter.sendMail(mailOptions);
      console.log('📧 Email notification sent successfully');
      return true;
      
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('❌ All email attempts failed');
        return false;
      }
    }
  }
  
  return false;
}

// Validate Email configuration
function validateEmailConfig() {
  const config = getNotificationConfig();
  const emailTransporter = getEmailTransporter();
  
  const validation = {
    enabled: config.email.enabled,
    userSet: !!config.email.auth.user,
    passSet: !!config.email.auth.pass,
    fromSet: !!config.email.from,
    toSet: !!config.email.to,
    serviceSet: !!config.email.service,
    transporterCreated: !!emailTransporter
  };
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  validation.fromValid = validation.fromSet && emailRegex.test(config.email.from);
  validation.toValid = validation.toSet && emailRegex.test(config.email.to);
  validation.userValid = validation.userSet && emailRegex.test(config.email.auth.user);
  
  validation.allValid = validation.enabled && validation.userSet && validation.passSet && 
                       validation.fromSet && validation.toSet && validation.transporterCreated &&
                       validation.fromValid && validation.toValid && validation.userValid;
  
  // Add configuration details (without sensitive info)
  validation.config = {
    service: config.email.service,
    host: config.email.host || 'Using service default',
    port: config.email.port,
    secure: config.email.secure,
    from: config.email.from,
    to: config.email.to,
    user: config.email.auth.user
  };
  
  return validation;
}

// Test Email notification
async function testEmailNotification(clientIP, deviceInfo) {
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
  
  return await sendEmailNotification(testSubject, testHtml, testText);
}

module.exports = {
  sendEmailNotification,
  validateEmailConfig,
  testEmailNotification
};