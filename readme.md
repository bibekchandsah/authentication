# 🔐 Secure Webpage with Microsoft Authenticator Integration

## 📖 Description
This project is a secure webpage system that integrates with **Microsoft Authenticator** using TOTP (Time-based One-Time Password) authentication. The system generates a persistent secret key that users can add to their Microsoft Authenticator app to generate 6-digit codes for secure login access.

---

## ⚙️ Features

### 1. Microsoft Authenticator Integration
- **TOTP Authentication**: Uses industry-standard Time-based One-Time Password protocol
- **QR Code Setup**: Easy setup by scanning QR code with Microsoft Authenticator app
- **Manual Entry**: Backup setup method using secret key manual entry
- **Persistent Secret**: Secret key remains consistent across server restarts
- **6-Digit Codes**: Standard authenticator codes that refresh every 30 seconds

### 2. Professional Login Interface
- **6-Digit Input System**: Separate input boxes for each digit (like banking apps)
- **Auto-Advance**: Automatically moves to next input when typing
- **Paste Support**: Paste 6-digit codes and auto-fill all inputs
- **Auto-Submit**: Automatically submits when all digits are entered
- **Visual Feedback**: Green/red states for success/error with animations
- **Mobile Responsive**: Optimized for both desktop and mobile devices

### 3. Session Management & Security
- **Server-side Sessions**: Secure session handling with Express.js
- **Route Protection**: All protected pages validate authentication status
- **Auto-Redirect**: Unauthenticated users redirected to login page
- **Session Timeout**: 24-hour session expiration for security
- **CSRF Protection**: Session-based authentication prevents CSRF attacks

### 4. Admin Controls
- **Secret Key Management**: View current secret key information
- **Key Regeneration**: Admin can regenerate secret key when needed
- **Setup Page Access**: Direct link to authenticator setup page
- **Authentication Testing**: Built-in code testing functionality
- **Audit Trail**: Track when keys were created/regenerated

### 5. Setup & Configuration
- **One-Time Setup**: Configure Microsoft Authenticator once
- **QR Code Generation**: Dynamic QR code for easy app setup
- **Test Functionality**: Test authenticator codes before using for login
- **Setup Instructions**: Step-by-step guide for app configuration
- **Cross-Platform**: Works with any TOTP-compatible authenticator app

---

## 🛠️ Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Authentication:** Speakeasy (TOTP), QRCode generation
- **Session Management:** Express-session
- **Security:** TOTP with 60-second time window tolerance

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation Steps
1. **Clone/Download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
4. **Access the application:**
   - Open browser to `http://localhost:3000`
   - You'll be redirected to the login page

### First-Time Setup
1. **Visit Setup Page:** Go to `http://localhost:3000/setup`
2. **Configure Microsoft Authenticator:**
   - Open Microsoft Authenticator app on your phone
   - Tap "Add account" → "Other (Google, Facebook, etc.)"
   - Scan the QR code OR manually enter the secret key
3. **Test Your Setup:** Use the test feature to verify codes work
4. **Login:** Use 6-digit codes from your app to access the secure area

---

## 🔒 Security Features

### Authentication Flow
1. User visits login page with 6-digit input interface
2. User enters current code from Microsoft Authenticator app
3. Server validates TOTP code against stored secret key
4. Upon success, secure session is created and user redirected to main dashboard
5. All protected routes verify session before granting access
6. Invalid/expired sessions automatically redirect to login

### Security Measures
- **Time-based Codes**: Codes expire every 30 seconds
- **Replay Protection**: Each code can only be used once
- **Time Window**: 60-second tolerance for clock drift
- **Session Security**: Server-side session storage
- **Secret Protection**: Secret key stored in gitignored file
- **Input Validation**: Strict 6-digit numeric code validation

---

## 🛠️ Admin Features

### Secret Key Management
- **View Secret Info**: Check current secret key details and creation date
- **Regenerate Secret**: Generate new secret key when needed (requires "REGENERATE" confirmation)
- **Setup Access**: Direct links to setup page for reconfiguration
- **Test Codes**: Built-in testing to verify authenticator functionality

### Admin Access
All admin features are accessible through the main dashboard after authentication:
- 🔍 Check Auth Status
- 📊 Session Information  
- 🔑 Secret Key Info
- 🔄 Regenerate Secret Key
- 📱 View Setup Page

---

## 📁 Project Structure
```
project/
├── package.json              # Dependencies and scripts
├── server.js                 # Main Express server
├── .secret-key.json         # Persistent TOTP secret (auto-generated)
├── .gitignore               # Git ignore rules
├── public/                  # Static assets
│   ├── css/
│   │   ├── login.css       # Login page styles
│   │   ├── main.css        # Dashboard styles
│   │   └── setup.css       # Setup page styles
│   ├── js/
│   │   ├── login.js        # 6-digit input logic
│   │   ├── main.js         # Dashboard functionality
│   │   └── setup.js        # Setup page logic
│   └── index.html          # Landing page redirect
└── views/                   # HTML templates
    ├── login.html          # Login page with 6-digit inputs
    ├── main.html           # Protected dashboard
    └── setup.html          # Authenticator setup page
```

---

## 🔧 Configuration

### Environment Variables (Optional)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

### Secret Key Storage
- Secret keys are stored in `.secret-key.json`
- File is automatically created on first run
- File persists across server restarts
- File is gitignored for security

---

## 🚀 Usage Examples

### Regular Login
1. Open `http://localhost:3000`
2. Enter 6-digit code from Microsoft Authenticator
3. Access granted to secure dashboard

### Admin Tasks
1. **View Secret Key:** Click "🔑 Secret Key Info" on dashboard
2. **Regenerate Key:** Click "🔄 Regenerate Secret Key" → Type "REGENERATE"
3. **Reconfigure App:** Visit setup page and scan new QR code

### Troubleshooting
- **Codes not working:** Check phone time synchronization
- **Lost secret key:** Delete `.secret-key.json` and restart server
- **Setup issues:** Use manual entry method instead of QR code

---

## 🔮 Future Enhancements
- **Multiple Users**: Support for multiple TOTP secrets
- **Backup Codes**: One-time backup codes for emergency access
- **Rate Limiting**: Prevent brute force attacks
- **Audit Logging**: Detailed access and admin action logs
- **Email Notifications**: Alerts for admin actions
- **API Integration**: RESTful API for external integrations

---

## 👤 Author
**Bibek Sha**

A professional-grade secure authentication system with Microsoft Authenticator integration, featuring modern UX design and comprehensive admin controls for personal and small business use.
