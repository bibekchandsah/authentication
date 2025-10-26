# 📧 Email Notification Troubleshooting

## ✅ Fixed: "nodemailer.createTransporter is not a function"

This error has been fixed! The correct method is `createTransport` (not `createTransporter`).

## 🔧 Email Setup Guide

### Gmail Setup (Recommended)

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** → **2-Step Verification**
3. Follow the setup process

**Step 2: Generate App Password**
1. In Google Account Settings → **Security**
2. Click **2-Step Verification** → **App passwords**
3. Select **Mail** as the app
4. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)

**Step 3: Update .env File**
```bash
# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=admin@yourdomain.com
```

### Other Email Providers

**Outlook/Hotmail:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
EMAIL_FROM=your-email@outlook.com
EMAIL_TO=admin@yourdomain.com
```

**Yahoo:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@yahoo.com
EMAIL_TO=admin@yourdomain.com
```

**Custom SMTP:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM=your-email@yourprovider.com
EMAIL_TO=admin@yourdomain.com
```

## 🔍 Troubleshooting Steps

### Step 1: Validate Your Setup
1. **Login to admin dashboard**
2. **Click "📧 Validate Email"** button
3. **Check all validation results**

### Step 2: Common Issues & Fixes

**❌ "Authentication failed"**
- **For Gmail**: Use **app password**, not your regular password
- **Enable 2FA first**, then generate app password
- **Check username/password** are correct

**❌ "Invalid email format"**
```bash
# WRONG
EMAIL_USER=myemail
EMAIL_FROM=invalid-email

# CORRECT
EMAIL_USER=myemail@gmail.com
EMAIL_FROM=myemail@gmail.com
```

**❌ "Connection timeout"**
- **Check firewall settings**
- **Try different ports**: 587, 465, 25
- **Check SMTP server address**

**❌ "Self signed certificate"**
```bash
# Add this for custom SMTP
EMAIL_SECURE=false
```

### Step 3: Test Your Configuration

**Server Console Check:**
Look for these messages when server starts:
```
🔍 Email Debug Info:
- Service: gmail
- User: your-email@gmail.com
- From: your-email@gmail.com
- To: admin@yourdomain.com
📧 Email notifications configured successfully
✅ Email server connection verified
```

**Admin Dashboard Test:**
1. **Click "📧 Validate Email"** - should show all ✅
2. **Click "🧪 Test Notifications"** → choose "email"
3. **Check your inbox** (and spam folder)

## 📋 Complete .env Example

```bash
# Telegram Configuration (working)
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=admin@yourdomain.com
```

## 🚨 Common Mistakes

**❌ Using regular password instead of app password:**
```bash
# WRONG (for Gmail)
EMAIL_PASS=your-regular-password

# CORRECT (for Gmail)
EMAIL_PASS=abcdefghijklmnop
```

**❌ Missing EMAIL_FROM or EMAIL_TO:**
```bash
# INCOMPLETE
EMAIL_USER=test@gmail.com
EMAIL_PASS=password

# COMPLETE
EMAIL_USER=test@gmail.com
EMAIL_PASS=password
EMAIL_FROM=test@gmail.com
EMAIL_TO=admin@yourdomain.com
```

**❌ Wrong service name:**
```bash
# WRONG
EMAIL_SERVICE=Google

# CORRECT
EMAIL_SERVICE=gmail
```

## 🔧 Advanced Configuration

### Custom SMTP Settings
If your provider isn't supported by default:
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=
EMAIL_HOST=mail.yourprovider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_FROM=noreply@yourprovider.com
EMAIL_TO=admin@yourprovider.com
```

### SSL/TLS Settings
```bash
# For secure connections (port 465)
EMAIL_PORT=465
EMAIL_SECURE=true

# For STARTTLS (port 587)
EMAIL_PORT=587
EMAIL_SECURE=false
```

## ✅ Success Checklist

- [ ] 2-Factor Authentication enabled (for Gmail)
- [ ] App password generated (for Gmail)
- [ ] All email addresses in valid format
- [ ] .env file updated with correct values
- [ ] Server restarted after changes
- [ ] Email validation shows all ✅
- [ ] Connection test passes
- [ ] Test email received

## 🆘 Still Having Issues?

### Check Server Logs
Look for detailed error messages in your console:
```
❌ Email configuration error: [specific error]
❌ Email connection test failed: [specific error]
```

### Manual SMTP Test
Test your SMTP settings with a simple script:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'admin@yourdomain.com',
  subject: 'Test Email',
  text: 'This is a test email'
}, (error, info) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
```

Once your email validation shows all ✅, both Telegram and Email notifications will work perfectly! 🎉