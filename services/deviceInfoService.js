// Function to get device info from user agent
function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

  // Simple user agent parsing
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Device detection
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) device = 'Mobile';
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
}

// Import enhanced location service
const { getLocationInfo } = require('./locationService');

// Function to get client IP address
function getClientIP(req) {
  let ip = req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.ip ||
    '127.0.0.1';

  // Handle comma-separated IPs (common with proxies/load balancers)
  if (typeof ip === 'string' && ip.includes(',')) {
    // Take the first IP (original client IP)
    ip = ip.split(',')[0].trim();
  }

  return ip;
}

// Enhanced device fingerprinting with async location lookup
async function getDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const clientIP = getClientIP(req);
  const deviceInfo = parseUserAgent(userAgent);

  // Get enhanced location info (async)
  const locationInfo = await getLocationInfo(clientIP);

  return {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    // Enhanced location data from IPInfo
    city: locationInfo.city,
    region: locationInfo.region,
    country: locationInfo.country,
    countryCode: locationInfo.countryCode,
    location: locationInfo.location,
    timezone: locationInfo.timezone,
    isp: locationInfo.isp,
    org: locationInfo.org,
    postal: locationInfo.postal,
    latitude: locationInfo.latitude,
    longitude: locationInfo.longitude,
    // Additional data
    acceptLanguage: acceptLanguage,
    acceptEncoding: acceptEncoding,
    timestamp: new Date().toISOString(),
    locationSource: locationInfo.source
  };
}

// Synchronous version for backward compatibility
function getBasicDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const clientIP = getClientIP(req);
  const deviceInfo = parseUserAgent(userAgent);

  return {
    ip: clientIP,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device: deviceInfo.device,
    acceptLanguage: acceptLanguage,
    // Basic location info for local IPs
    city: 'Local',
    region: 'Local Network',
    country: 'Local',
    countryCode: 'LOCAL',
    location: 'Local Network',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isp: 'Local Network',
    org: 'Private Network',
    postal: 'N/A',
    latitude: null,
    longitude: null,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  parseUserAgent,
  getClientIP,
  getDeviceFingerprint,
  getBasicDeviceFingerprint
};