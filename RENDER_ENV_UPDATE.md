# Render Environment Variables Update Guide

## Important: TOTP Secret Migration

The TOTP secret has been moved from `.secret-key.json` to environment variables to prevent regeneration on every deployment.

## Steps to Update Render Deployment:

### 1. Go to your Render Dashboard
- Navigate to your web service
- Go to the "Environment" tab

### 2. Add the TOTP Secret Environment Variable
Add this new environment variable:

```
TOTP_SECRET=HB6SUKD5JZCUIN2TKU6FCVSPJI3WKKLRPFHXMRSTOROUS6R7HY3Q
```

### 3. Complete Environment Variables List
Make sure you have all these environment variables set in Render:

```bash
# Telegram Configuration
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=8391723349:AAHqEsjPoOEbyBfItiRv5l7L9eySCB-yiu
TELEGRAM_CHAT_ID=721000599

# Email Configuration
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=bibekchandsah@gmail.com
EMAIL_PASS=otky yowb kada rete
EMAIL_FROM=bibekchandsah@gmail.com
EMAIL_TO=bibeksha48@gmail.com
EMAIL_PORT=587

# IPInfo API Configuration
IPINFO_ENABLED=true
IPINFO_TOKEN=ccb3ba52662baa

# TOTP Secret Configuration (NEW!)
TOTP_SECRET=HB6SUKD5JZCUIN2TKU6FCVSPJI3WKKLRPFHXMRSTOROUS6R7HY23
```

### 4. Deploy
After adding the environment variable, trigger a new deployment.

## Benefits:
- ✅ **Persistent Secret**: Your Microsoft Authenticator setup won't break on deployments
- ✅ **Centralized Config**: All secrets in one place
- ✅ **Platform Agnostic**: Works on Render, Railway, Heroku, etc.
- ✅ **Security**: Environment variables are more secure than files

## Important Notes:
- **DO NOT** commit the `.env` file to Git (it's already in `.gitignore`)
- **DO** set the environment variables in your deployment platform
- **BACKUP** your TOTP secret somewhere safe
- If you regenerate the secret, you'll need to:
  1. Update the environment variable on Render
  2. Re-setup Microsoft Authenticator with the new QR code

## Testing:
After deployment, your Microsoft Authenticator should continue working with the same 6-digit codes without needing to re-setup.