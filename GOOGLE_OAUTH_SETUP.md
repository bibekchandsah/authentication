# Google OAuth Authentication Setup Guide

## 🎯 **Overview**

Your secure authentication system now supports **Google OAuth 2.0** authentication, allowing users to sign in with their Google account. Only the specified authorized email address will be granted access.

## 🔧 **Google Cloud Console Setup**

### **Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select existing project
3. Name your project (e.g., "Secure Webpage Auth")
4. Click "Create"

### **Step 2: Enable Google+ API**
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" 
3. Click on it and press "Enable"
4. Also enable "Google OAuth2 API" if available

### **Step 3: Create OAuth 2.0 Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in app name: "Secure Webpage System"
   - Add your email as developer contact
   - Add authorized domain if deploying to production

### **Step 4: Configure OAuth Client**
1. Application type: "Web application"
2. Name: "Secure Webpage Auth Client"
3. **Authorized JavaScript origins:**
   - `http://localhost:3000` (for local development)
   - `https://your-domain.com` (for production)
4. **Authorized redirect URIs:**
   - `http://localhost:3000/auth/google/callback` (local)
   - `https://your-domain.com/auth/google/callback` (production)
5. Click "Create"

### **Step 5: Get Credentials**
1. Copy the **Client ID** (starts with numbers, ends with `.apps.googleusercontent.com`)
2. Copy the **Client Secret** (random string)
3. Keep these secure - you'll add them to your `.env` file

## 🔐 **Environment Configuration**

### **Update your `.env` file:**

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
AUTHORIZED_EMAIL=bibeksha48@gmail.com

# Authentication Mode
AUTH_MODE=google
```

### **Environment Variables Explained:**

- **`GOOGLE_CLIENT_ID`**: Your OAuth 2.0 Client ID from Google Cloud Console
- **`GOOGLE_CLIENT_SECRET`**: Your OAuth 2.0 Client Secret (keep this secure!)
- **`GOOGLE_CALLBACK_URL`**: Where Google redirects after authentication
- **`AUTHORIZED_EMAIL`**: The ONLY email address allowed to access the system
- **`AUTH_MODE`**: Set to `google` for Google OAuth, `totp` for TOTP, or `both` for dual mode

## 🚀 **Deployment Configuration**

### **For Render Deployment:**

Add these environment variables in your Render dashboard:

```bash
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback
AUTHORIZED_EMAIL=bibeksha48@gmail.com
AUTH_MODE=google
```

### **Update OAuth Settings for Production:**
1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client
3. Add production URLs:
   - **Authorized JavaScript origins**: `https://your-app-name.onrender.com`
   - **Authorized redirect URIs**: `https://your-app-name.onrender.com/auth/google/callback`

## 🔍 **Authentication Flow**

### **User Experience:**
1. **Visit Login Page**: User goes to `/login`
2. **Click "Continue with Google"**: Redirects to Google OAuth
3. **Google Authentication**: User signs in with Google account
4. **Email Verification**: System checks if email matches `AUTHORIZED_EMAIL`
5. **Access Granted/Denied**: 
   - ✅ **Authorized email**: Redirect to `/main` with session
   - ❌ **Unauthorized email**: Redirect to login with error message

### **Security Features:**
- **Single Email Authorization**: Only the specified email can access
- **Session Management**: Secure session with timeout and activity tracking
- **Security Logging**: All login attempts logged with IP and device info
- **Telegram Notifications**: Instant alerts for successful logins
- **Rate Limiting**: Protection against brute force attempts

## 🛡️ **Security Benefits**

### **Advantages over TOTP:**
- ✅ **User Friendly**: No app setup required, just Google account
- ✅ **Secure**: Google's OAuth 2.0 security infrastructure
- ✅ **No Shared Secrets**: No TOTP keys to manage or lose
- ✅ **Device Independent**: Works on any device with Google account
- ✅ **Automatic Updates**: Google handles security updates

### **Maintained Security:**
- ✅ **Single User Access**: Only authorized email allowed
- ✅ **Session Protection**: Same timeout and activity tracking
- ✅ **Security Monitoring**: All attempts logged and monitored
- ✅ **Instant Notifications**: Telegram alerts for all logins
- ✅ **Rate Limiting**: Protection against automated attacks

## 🔄 **Dual Authentication Mode**

### **Enable Both Google and TOTP:**
Set `AUTH_MODE=both` in your `.env` file to allow users to choose:

```bash
AUTH_MODE=both
```

This provides:
- **Primary**: Google OAuth (recommended)
- **Fallback**: TOTP authentication (if Google is unavailable)
- **User Choice**: Toggle between methods on login page

## 🧪 **Testing**

### **Local Testing:**
1. **Start server**: `npm start`
2. **Visit**: `http://localhost:3000/login`
3. **Click**: "Continue with Google"
4. **Sign in**: With the authorized Google account
5. **Verify**: Successful redirect to main page

### **Test Unauthorized Access:**
1. **Sign in**: With a different Google account
2. **Verify**: Redirected back to login with error message
3. **Check logs**: Unauthorized attempt should be logged

## 📊 **Admin Dashboard Integration**

### **New Admin Features:**
- **🔐 Auth Method Info**: Shows current authentication mode
- **📊 Google OAuth Status**: Displays configuration status
- **📋 Login Analytics**: Tracks Google vs TOTP usage
- **🔍 Security Logs**: Shows OAuth attempts and results

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **"OAuth Error" on Login:**
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify callback URL matches exactly in Google Cloud Console
- Ensure Google+ API is enabled

#### **"Unauthorized Email" Error:**
- Verify `AUTHORIZED_EMAIL` matches exactly (case-sensitive)
- Check the email address in your Google account

#### **Redirect URI Mismatch:**
- Ensure `GOOGLE_CALLBACK_URL` in `.env` matches Google Cloud Console
- Check for trailing slashes or protocol mismatches

#### **Google Cloud Console Access:**
- Make sure you have owner/editor permissions on the project
- Verify the OAuth consent screen is configured

## 🎉 **Benefits Achieved**

### **User Experience:**
- ✅ **One-Click Login**: Simple "Continue with Google" button
- ✅ **No Setup Required**: No authenticator app configuration
- ✅ **Familiar Interface**: Standard Google OAuth flow
- ✅ **Cross-Device**: Works on any device with Google account

### **Security:**
- ✅ **Enterprise-Grade**: Google's OAuth 2.0 infrastructure
- ✅ **Single Email Control**: Precise access control
- ✅ **Complete Monitoring**: All attempts logged and tracked
- ✅ **Instant Alerts**: Telegram notifications for all activity

### **Maintenance:**
- ✅ **No Secret Management**: No TOTP keys to rotate
- ✅ **Automatic Security**: Google handles security updates
- ✅ **Easy Configuration**: Simple environment variable setup
- ✅ **Scalable**: Easy to change authorized email

Your secure authentication system is now modernized with Google OAuth while maintaining all security features! 🚀