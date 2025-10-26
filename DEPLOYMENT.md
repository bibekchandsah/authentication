# 🚀 Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended) ⭐
**Best for: Full functionality with persistent storage**

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js and deploys
   - Your app will be live at: `https://your-app-name.up.railway.app`

3. **Environment Variables (Optional):**
   - In Railway dashboard, go to Variables tab
   - Add `NODE_ENV=production` if needed

### 2. Render
**Good alternative with persistent storage**

1. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment:** Node
   - Click "Create Web Service"

### 3. Cyclic
**Node.js specialized hosting**

1. **Deploy on Cyclic:**
   - Go to [cyclic.sh](https://cyclic.sh)
   - Sign up with GitHub
   - Click "Deploy Now"
   - Select your repository
   - Automatic deployment starts

## 🔧 Pre-Deployment Checklist

- ✅ `package.json` has correct start script
- ✅ `PORT` environment variable is used
- ✅ `.gitignore` excludes `node_modules` and `.secret-key.json`
- ✅ All dependencies are in `package.json`
- ✅ Code is pushed to GitHub

## 🔒 Post-Deployment Setup

### First Time Setup:
1. **Visit your deployed URL**
2. **Go to `/setup` page**
3. **Configure Microsoft Authenticator:**
   - Scan QR code or enter secret key manually
   - Test the setup using the test feature
4. **Login with 6-digit codes**

### Admin Access:
- All admin features work the same as localhost
- Secret key persists across deployments
- Use regenerate feature if needed

## 🌐 Custom Domain (Optional)

### Railway:
- Go to Settings → Domains
- Add custom domain
- Update DNS records as instructed

### Render:
- Go to Settings → Custom Domains
- Add domain and configure DNS

## 🔍 Troubleshooting

### Common Issues:

**App not starting:**
- Check logs in hosting platform dashboard
- Ensure `npm start` script exists
- Verify Node.js version compatibility

**Secret key resets:**
- Some platforms may reset files on redeploy
- Use Railway or Render for persistent storage
- Avoid Vercel/Netlify for this app

**Sessions not working:**
- Ensure platform supports persistent processes
- Check if platform restarts app frequently
- Consider using database for sessions in production

**HTTPS Issues:**
- Most platforms provide HTTPS automatically
- Update session config for production:
  ```javascript
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 
  }
  ```

## 📊 Platform Comparison

| Platform | Free Tier | Persistent Storage | Sessions | Custom Domain |
|----------|-----------|-------------------|----------|---------------|
| Railway  | $5/month credit | ✅ | ✅ | ✅ |
| Render   | 750 hours/month | ✅ | ✅ | ✅ |
| Cyclic   | Unlimited | ✅ | ✅ | ✅ |
| Vercel   | Unlimited | ❌ | ❌ | ✅ |
| Netlify  | 100GB/month | ❌ | ❌ | ✅ |

## 🎯 Recommended: Railway

Railway is the best choice because:
- ✅ Perfect Node.js support
- ✅ Persistent file storage for `.secret-key.json`
- ✅ Session support
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ✅ Good free tier
- ✅ No sleep/wake delays

Your Microsoft Authenticator integration will work flawlessly on Railway!