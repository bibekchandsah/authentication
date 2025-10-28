# Google OAuth Setup Guide - Complete Step-by-Step Instructions

## 🎯 **Overview**
This guide will walk you through getting your Google Client ID and Client Secret to enable Google OAuth authentication for your secure webpage system.

## 🔧 **Step-by-Step Guide to Get Google OAuth Credentials**

### **Step 1: Access Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (preferably the same one you want to authorize: `bibeksha48@gmail.com`)

### **Step 2: Create or Select a Project**
1. **If you don't have a project:**
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `Secure Webpage Auth` (or any name you prefer)
   - Click "Create"
   - Wait for project creation to complete

2. **If you have existing projects:**
   - Select an existing project from the dropdown

### **Step 3: Enable Required APIs**
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** and click on it
3. Click **"Enable"** button
4. Also search for **"Google Identity"** or **"OAuth2"** and enable if available

### **Step 4: Configure OAuth Consent Screen**
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `Secure Webpage System`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. **Scopes**: Click "Save and Continue" (default scopes are fine)
7. **Test users**: Add `bibeksha48@gmail.com` as a test user
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

### **Step 5: Create OAuth 2.0 Credentials**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: Select **"Web application"**
4. **Name**: `Secure Webpage OAuth Client`
5. **Authorized JavaScript origins**: Add these URLs:
   ```
   http://localhost:3000
   ```
   (Add your production domain later when deploying)

6. **Authorized redirect URIs**: Add these URLs:
   ```
   http://localhost:3000/auth/google/callback
   ```
   (Add your production callback URL later)

7. Click **"Create"**

### **Step 6: Get Your Credentials**
1. A popup will appear with your credentials:
   - **Client ID**: Something like `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: Something like `GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx`

2. **Copy these values** - you'll need them for your `.env` file

### **Step 7: Update Your .env File**
Replace the placeholder values in your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
AUTHORIZED_EMAIL=bibeksha48@gmail.com

# Authentication Mode
AUTH_MODE=google
```

### **Step 8: Test Your Setup**
1. Save your `.env` file
2. Restart your server: `npm start`
3. Go to `http://localhost:3000/login`
4. Click "Continue with Google"
5. Sign in with `bibeksha48@gmail.com`
6. You should be redirected to the main page

## 🔍 **Visual Guide - What to Look For**

### **In Google Cloud Console:**
- **Project dropdown**: Top left, shows current project name
- **APIs & Services**: Left sidebar menu
- **Credentials page**: Shows your OAuth 2.0 Client IDs
- **Client ID format**: `[numbers]-[random-string].apps.googleusercontent.com`
- **Client Secret format**: `GOCSPX-[random-string]`

### **Important Notes:**
- ⚠️ **Keep Client Secret secure** - never commit it to public repositories
- ⚠️ **Exact URL matching** - Callback URLs must match exactly
- ⚠️ **Test user required** - Add your authorized email as a test user
- ⚠️ **API enablement** - Make sure Google+ API is enabled

## 🚨 **Troubleshooting Common Issues**

### **"OAuth Error" when testing:**
- Double-check Client ID and Secret are copied correctly
- Verify callback URL matches exactly: `http://localhost:3000/auth/google/callback`
- Make sure Google+ API is enabled

### **"App not verified" warning:**
- This is normal for development
- Click "Advanced" → "Go to [App Name] (unsafe)" to continue
- For production, you'll need to verify your app

### **"Access blocked" error:**
- Make sure you added your email as a test user in OAuth consent screen
- Verify the authorized email in `.env` matches exactly

### **"Redirect URI mismatch" error:**
- Check that callback URL in Google Cloud Console matches your `.env` file
- Ensure no trailing slashes or protocol mismatches
- Local: `http://localhost:3000/auth/google/callback`
- Production: `https://your-domain.com/auth/google/callback`

## 🎯 **Quick Checklist**
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] Test user added (`bibeksha48@gmail.com`)
- [ ] OAuth 2.0 Client created
- [ ] Client ID and Secret copied to `.env`
- [ ] Callback URL configured correctly
- [ ] Server restarted with new credentials

## 🚀 **For Production Deployment (Render/Railway/etc.)**

### **Additional Steps for Production:**
1. **Update OAuth Client in Google Cloud Console:**
   - Go back to "APIs & Services" → "Credentials"
   - Edit your OAuth 2.0 Client
   - Add production URLs:
     - **Authorized JavaScript origins**: `https://your-app-name.onrender.com`
     - **Authorized redirect URIs**: `https://your-app-name.onrender.com/auth/google/callback`

2. **Update Environment Variables on Hosting Platform:**
   ```bash
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback
   AUTHORIZED_EMAIL=bibeksha48@gmail.com
   AUTH_MODE=google
   ```

3. **OAuth Consent Screen for Production:**
   - For public use, you'll need to submit your app for verification
   - For personal use, you can keep it in "Testing" mode with test users

## 🔐 **Security Best Practices**

### **Credential Security:**
- ✅ Never commit Client Secret to version control
- ✅ Use environment variables for all sensitive data
- ✅ Regularly rotate Client Secret if compromised
- ✅ Monitor OAuth usage in Google Cloud Console

### **Access Control:**
- ✅ Only add necessary test users
- ✅ Use specific authorized email addresses
- ✅ Regularly review and audit access logs
- ✅ Enable security notifications in Google account

## 📊 **Testing Your Implementation**

### **Successful Login Flow:**
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User signs in with authorized Google account
4. Google redirects back to your app
5. System verifies email matches `AUTHORIZED_EMAIL`
6. User is logged in and redirected to main page
7. Telegram notification sent (if configured)

### **Unauthorized Access Attempt:**
1. User signs in with different Google account
2. System detects email doesn't match authorized email
3. User redirected back to login with error message
4. Attempt logged in security logs
5. No access granted

## 🎉 **Benefits of Google OAuth**

### **User Experience:**
- ✅ **One-click login** - No complex setup required
- ✅ **Familiar interface** - Standard Google sign-in
- ✅ **Cross-device** - Works on any device with Google account
- ✅ **No passwords** - Secure OAuth 2.0 flow

### **Security:**
- ✅ **Enterprise-grade** - Google's security infrastructure
- ✅ **No shared secrets** - No TOTP keys to manage
- ✅ **Automatic updates** - Google handles security patches
- ✅ **Precise control** - Single email authorization

### **Maintenance:**
- ✅ **Easy configuration** - Simple environment variables
- ✅ **No user setup** - No authenticator app required
- ✅ **Scalable** - Easy to change authorized users
- ✅ **Professional** - Modern authentication standard

Once you complete these steps, your Google OAuth authentication will be fully functional! 🚀

## 📞 **Need Help?**
If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all steps were completed correctly
3. Check Google Cloud Console logs for detailed error messages
4. Ensure all URLs match exactly between Google Console and your `.env` file