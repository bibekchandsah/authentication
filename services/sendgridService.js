const sgMail = require('@sendgrid/mail');

// SendGrid configuration
const SENDGRID_CONFIG = {
  enabled: process.env.SENDGRID_ENABLED === 'true' || false,
  apiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || '',
  toEmail: process.env.SENDGRID_TO_EMAIL || process.env.EMAIL_TO || '',
  fromName: process.env.SENDGRID_FROM_NAME || 'Secure Webpage System'
};

// Initialize SendGrid
if (SENDGRID_CONFIG.enabled && SENDGRID_CONFIG.apiKey) {
  try {
    sgMail.setApiKey(SENDGRID_CONFIG.apiKey);
    console.log('📧 SendGrid email service initialized');
  } catch (error) {
    console.error('❌ SendGrid initialization error:', error.message);
  }
} else {
  console.log('⚠️ SendGrid not configured - using fallback email service');
}

// Send email via SendGrid
async function sendSendGridEmail(subject, htmlContent, textContent) {
  if (!SENDGRID_CONFIG.enabled || !SENDGRID_CONFIG.apiKey) {
    console.log('⚠️ SendGrid not configured - skipping');
    return false;
  }

  try {
    const msg = {
      to: SENDGRID_CONFIG.toEmail,
      from: {
        email: SENDGRID_CONFIG.fromEmail,
        name: SENDGRID_CONFIG.fromName
      },
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    console.log('📧 Sending email via SendGrid...');
    await sgMail.send(msg);
    console.log('📧 SendGrid email sent successfully');
    return true;
    
  } catch (error) {
    console.error('❌ SendGrid email error:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return false;
  }
}

// Validate SendGrid configuration
function validateSendGridConfig() {
  return {
    enabled: SENDGRID_CONFIG.enabled,
    apiKeySet: !!SENDGRID_CONFIG.apiKey,
    fromEmailSet: !!SENDGRID_CONFIG.fromEmail,
    toEmailSet: !!SENDGRID_CONFIG.toEmail,
    fromNameSet: !!SENDGRID_CONFIG.fromName,
    allValid: SENDGRID_CONFIG.enabled && SENDGRID_CONFIG.apiKey && 
              SENDGRID_CONFIG.fromEmail && SENDGRID_CONFIG.toEmail,
    config: {
      fromEmail: SENDGRID_CONFIG.fromEmail,
      toEmail: SENDGRID_CONFIG.toEmail,
      fromName: SENDGRID_CONFIG.fromName
    }
  };
}

// Test SendGrid email
async function testSendGridEmail(clientIP, deviceInfo) {
  const testSubject = '🧪 SendGrid Test - Secure Webpage System';
  const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a82e2 0%, #0d47a1 100%); color: white; padding: 20px; text-align: center;">
        <h1>🧪 SendGrid Test</h1>
        <h2>Email Service Working!</h2>
      </div>
      <div style="padding: 20px; background: #f8f9fa;">
        <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #1a82e2;">
          <h3 style="color: #1a82e2; margin-top: 0;">✅ SendGrid Integration Successful</h3>
          <p>Your SendGrid email service is working correctly on Render!</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Test Time:</td><td>${new Date().toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">From IP:</td><td><code>${clientIP}</code></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Device:</td><td>${deviceInfo.browser}/${deviceInfo.os}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Service:</td><td>SendGrid API</td></tr>
          </table>
          <p style="margin-top: 15px; color: #1a82e2;"><strong>Gmail SMTP issues resolved!</strong></p>
        </div>
      </div>
      <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">Secure Webpage System - Built by Bibek Sha</p>
        <p style="margin: 5px 0 0 0;">Powered by SendGrid</p>
      </div>
    </div>
  `;
  const testText = `SENDGRID TEST - Secure Webpage System\n\n` +
                  `Your SendGrid email service is working correctly!\n` +
                  `Test Time: ${new Date().toLocaleString()}\n` +
                  `Gmail SMTP issues resolved with SendGrid API!`;
  
  return await sendSendGridEmail(testSubject, testHtml, testText);
}

module.exports = {
  sendSendGridEmail,
  validateSendGridConfig,
  testSendGridEmail,
  SENDGRID_CONFIG
};