const { addSecurityLog } = require('./loggingService');
const { getDeviceFingerprint, getBasicDeviceFingerprint, parseUserAgent, getClientIP } = require('./deviceInfoService');

// Log successful login (async for enhanced location data)
async function logSuccessfulLogin(req, sessionId) {
  const deviceFingerprint = await getDeviceFingerprint(req);
  const authCode = req.body.authCode;

  return addSecurityLog('login_success', {
    ...deviceFingerprint,
    sessionId: sessionId,
    authCode: authCode ? authCode.substring(0, 2) + '****' : 'none', // Partial code for security
    message: 'Successful authentication'
  });
}

// Log failed login attempt
function logFailedLogin(req, attemptNumber, remainingAttempts) {
  const deviceFingerprint = getBasicDeviceFingerprint(req);
  const authCode = req.body.authCode;

  return addSecurityLog('login_failed', {
    ...deviceFingerprint,
    authCode: authCode ? authCode.substring(0, 2) + '****' : 'none',
    reason: 'Invalid authentication code',
    attemptNumber: attemptNumber,
    remainingAttempts: Math.max(0, remainingAttempts)
  });
}

// Log rate limited attempt
function logRateLimited(req, remainingTime, totalAttempts) {
  const deviceFingerprint = getBasicDeviceFingerprint(req);
  const authCode = req.body.authCode;

  return addSecurityLog('rate_limited', {
    ...deviceFingerprint,
    authCode: authCode ? authCode.substring(0, 2) + '****' : 'none',
    reason: 'Too many failed attempts',
    remainingTime: remainingTime,
    totalAttempts: totalAttempts
  });
}

// Log user logout
function logUserLogout(req, sessionDuration) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  return addSecurityLog('logout', {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    sessionId: req.sessionID,
    sessionDuration: `${sessionDuration} minutes`,
    logoutType: 'manual',
    message: 'User initiated logout'
  });
}

// Log session expiry
function logSessionExpired(req, sessionDuration, inactivityTime) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  return addSecurityLog('session_expired', {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    sessionId: req.sessionID,
    sessionDuration: `${sessionDuration} minutes`,
    inactivityTime: `${inactivityTime} minutes`,
    reason: 'Session expired due to inactivity'
  });
}

// Log admin actions
function logAdminAction(req, action, details) {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  return addSecurityLog('admin_action', {
    ip: clientIP,
    action: action,
    details: details,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device
  });
}

// Log security events (generic)
function logSecurityEvent(type, req, details = {}) {
  const deviceFingerprint = getBasicDeviceFingerprint(req);

  return addSecurityLog(type, {
    ...deviceFingerprint,
    ...details
  });
}

module.exports = {
  logSuccessfulLogin,
  logFailedLogin,
  logRateLimited,
  logUserLogout,
  logSessionExpired,
  logAdminAction,
  logSecurityEvent
};