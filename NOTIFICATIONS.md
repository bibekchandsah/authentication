# 🔔 Instant Notification Setup Guide

Configure instant notifications for login alerts via Telegram and Email.

## 📱 Telegram Setup

### Step 1: Create a Telegram Bot
1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send command**: `/newbot`
4. **Choose a name** for your bot (e.g., "Secure Webpage Alert Bot")
5. **Choose a username** (must end with 'bot', e.g., "secure_webpage_alert_bot")
6. **Copy the Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID
1. **Start a chat** with your new bot
2. **Send any message** to the bot
3. **Visit this URL** in your browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. **Find your Chat ID** in the response (looks like: `"id": 123456789`)

### Step 3: Set Environment Variables
Add these to your environment or create a `.env` file:
```bash
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

## 📧 Email Setup

### Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

### Step 1: Set Environment Variables
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=admin@yourdomain.com
```

### Other Email Providers
For other providers, use these settings:

**Outlook/Hotmail:**
```bash
EMAIL_SERVICE=outlook
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Yahoo:**
```bash
EMAIL_SERVICE=yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP:**
```bash
EMAIL_SERVICE=
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## 🚀 Deployment Configuration

### Railway
1. **Go to your Railway project**
2. **Click on Variables tab**
3. **Add environment variables**:
   ```
   TELEGRAM_ENABLED=true
   TELEGRAM_BOT_TOKEN=your-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   EMAIL_ENABLED=true
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_TO=admin@yourdomain.com
   ```

### Render
1. **Go to your Render service**
2. **Click Environment tab**
3. **Add environment variables** (same as above)

### Local Development
Create a `.env` file in your project root:
```bash
# Telegram Configuration
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=admin@yourdomain.com
```

## 🧪 Testing Notifications

### From Admin Dashboard:
1. **Login to your secure webpage**
2. **Go to main dashboard**
3. **Click "🧪 Test Notifications"**
4. **Choose**: telegram, email, or both
5. **Check your Telegram/Email** for test messages

### Manual Testing:
```bash
# Test Telegram
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id": "<YOUR_CHAT_ID>", "text": "Test message"}'
```

## 🔔 Notification Types

### Automatic Notifications:
- ✅ **Successful Logins**: Every successful authentication
- 🚫 **Rate Limited Attempts**: Brute force attack detection
- 🛠️ **Admin Actions**: Secret regeneration, rate limit clearing

### Optional Notifications:
- ❌ **Failed Logins**: Can be enabled (may be noisy)
- ⏰ **Session Expired**: Can be enabled

## 📋 Notification Content

### Telegram Messages:
```
🔐 SECURE LOGIN ALERT

✅ Successful Login
🕐 Time: Jan 15, 2024 10:30 AM
🌐 IP: 192.168.1.100
💻 Device: Chrome/Windows (Desktop)
📍 Location: Local Network
🔑 Session: abc12345...

Secure Webpage - Bibek Sha
```

### Email Messages:
- **Professional HTML format** with styling
- **Complete device and location information**
- **Security warnings** and recommendations
- **Branded with your system name**

## 🔧 Customization

### Modify Notification Settings:
Edit `NOTIFICATION_CONFIG` in `server.js`:
```javascript
notifications: {
  loginSuccess: true,     // ✅ Successful logins
  loginFailed: false,     // ❌ Failed attempts
  rateLimited: true,      // 🚫 Rate limiting
  adminActions: true,     // 🛠️ Admin actions
  sessionExpired: false   // ⏰ Session timeouts
}
```

### Custom Message Templates:
Modify the `sendSecurityNotification` function in `server.js` to customize:
- Message content and formatting
- Email HTML templates
- Notification triggers
- Additional information included

## 🛡️ Security Considerations

### Best Practices:
- **Use App Passwords** for email (never your main password)
- **Secure Bot Token** - treat it like a password
- **Private Chat ID** - don't share publicly
- **Environment Variables** - never commit credentials to code
- **Test Regularly** - ensure notifications are working

### Privacy:
- **IP Addresses** are logged and sent in notifications
- **Device Information** is included for security context
- **Session IDs** are partially masked for security
- **Authentication Codes** are never logged or sent

## 🚨 Troubleshooting

### Telegram Issues:
- **Bot not responding**: Check bot token is correct
- **No messages received**: Verify chat ID is correct
- **"Forbidden" error**: Start a chat with your bot first

### Email Issues:
- **Authentication failed**: Use app password, not regular password
- **Connection timeout**: Check SMTP settings and firewall
- **Emails in spam**: Add sender to whitelist

### General Issues:
- **No notifications**: Check environment variables are set
- **Partial failures**: Check logs for specific error messages
- **Rate limiting**: Some providers limit notification frequency

## 📊 Monitoring

### Admin Dashboard:
- **View notification settings** and status
- **Test notifications** on demand
- **Check configuration** without revealing credentials

### Logs:
- All notification attempts are logged
- Success/failure status tracked
- Error messages for troubleshooting

---

**🎉 Once configured, you'll receive instant notifications for every login attempt, providing real-time security monitoring for your secure webpage system!**