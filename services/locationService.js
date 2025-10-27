const { IPinfoWrapper } = require('node-ipinfo');

// IPInfo configuration
const IPINFO_CONFIG = {
  enabled: process.env.IPINFO_ENABLED === 'true' || false,
  token: process.env.IPINFO_TOKEN || '',
  timeout: 5000, // 5 second timeout
  cache: new Map(), // Simple in-memory cache
  cacheExpiry: 24 * 60 * 60 * 1000 // 24 hours
};

// Initialize IPInfo client
let ipinfoClient = null;
if (IPINFO_CONFIG.enabled && IPINFO_CONFIG.token && IPINFO_CONFIG.token !== 'your-ipinfo-token-here') {
  try {
    ipinfoClient = new IPinfoWrapper(IPINFO_CONFIG.token);
    console.log('🌍 IPInfo service initialized');
  } catch (error) {
    console.error('❌ IPInfo initialization error:', error.message);
  }
} else {
  console.log('⚠️ IPInfo service disabled or not configured');
}

// Function to check if IP is local/private
function isLocalIP(ip) {
  if (!ip || typeof ip !== 'string') return true;
  
  // Clean the IP (remove any extra whitespace)
  ip = ip.trim();
  
  // Check for invalid IP format
  if (ip.includes(',') || ip.length === 0) return true;
  
  // Local/private IP ranges
  const localPatterns = [
    /^127\./, // 127.0.0.0/8 (localhost)
    /^10\./, // 10.0.0.0/8 (private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 (private)
    /^192\.168\./, // 192.168.0.0/16 (private)
    /^169\.254\./, // 169.254.0.0/16 (link-local)
    /^::1$/, // IPv6 localhost
    /^fe80::/i, // IPv6 link-local
    /^fc00::/i, // IPv6 unique local
    /^fd00::/i // IPv6 unique local
  ];
  
  return localPatterns.some(pattern => pattern.test(ip)) || ip === '::1';
}

// Basic fallback location info
function getBasicLocationInfo(ip) {
  if (isLocalIP(ip)) {
    return {
      ip: ip,
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
      source: 'basic'
    };
  }
  
  return {
    ip: ip,
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    countryCode: 'XX',
    location: 'External',
    timezone: 'Unknown',
    isp: 'Unknown',
    org: 'Unknown',
    postal: 'Unknown',
    latitude: null,
    longitude: null,
    source: 'basic'
  };
}

// Get location info from cache
function getCachedLocation(ip) {
  const cached = IPINFO_CONFIG.cache.get(ip);
  if (cached && (Date.now() - cached.timestamp) < IPINFO_CONFIG.cacheExpiry) {
    return cached.data;
  }
  return null;
}

// Cache location info
function cacheLocation(ip, data) {
  IPINFO_CONFIG.cache.set(ip, {
    data: data,
    timestamp: Date.now()
  });
  
  // Clean old cache entries periodically
  if (IPINFO_CONFIG.cache.size > 1000) {
    const cutoff = Date.now() - IPINFO_CONFIG.cacheExpiry;
    for (const [key, value] of IPINFO_CONFIG.cache.entries()) {
      if (value.timestamp < cutoff) {
        IPINFO_CONFIG.cache.delete(key);
      }
    }
  }
}

// Enhanced location info using IPInfo API
async function getEnhancedLocationInfo(ip) {
  // Check if IP is local first
  if (isLocalIP(ip)) {
    return getBasicLocationInfo(ip);
  }
  
  // Validate IP format
  if (!ip || typeof ip !== 'string' || ip.includes(',')) {
    console.log(`⚠️ Invalid IP format: ${ip}`);
    return getBasicLocationInfo(ip);
  }
  
  // Check cache first
  const cached = getCachedLocation(ip);
  if (cached) {
    return { ...cached, source: 'cache' };
  }
  
  // If IPInfo is not available, return basic info
  if (!ipinfoClient) {
    return getBasicLocationInfo(ip);
  }
  
  try {
    // Get location data from IPInfo
    const locationData = await Promise.race([
      ipinfoClient.lookupIp(ip),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), IPINFO_CONFIG.timeout)
      )
    ]);
    
    // Parse and format the response
    const enhancedInfo = {
      ip: ip,
      city: locationData.city || 'Unknown',
      region: locationData.region || 'Unknown',
      country: locationData.country || 'Unknown',
      countryCode: locationData.country || 'XX',
      location: locationData.city && locationData.region 
        ? `${locationData.city}, ${locationData.region}, ${locationData.country}`
        : locationData.country || 'External',
      timezone: locationData.timezone || 'Unknown',
      isp: locationData.org || 'Unknown',
      org: locationData.org || 'Unknown',
      postal: locationData.postal || 'Unknown',
      latitude: locationData.loc ? parseFloat(locationData.loc.split(',')[0]) : null,
      longitude: locationData.loc ? parseFloat(locationData.loc.split(',')[1]) : null,
      source: 'ipinfo'
    };
    
    // Cache the result
    cacheLocation(ip, enhancedInfo);
    
    return enhancedInfo;
    
  } catch (error) {
    console.error(`⚠️ IPInfo lookup failed for ${ip}:`, error.message);
    
    // Return basic info as fallback
    const basicInfo = getBasicLocationInfo(ip);
    cacheLocation(ip, basicInfo); // Cache the fallback too
    return basicInfo;
  }
}

// Get location info (with fallback)
async function getLocationInfo(ip) {
  try {
    return await getEnhancedLocationInfo(ip);
  } catch (error) {
    console.error('Location service error:', error.message);
    return getBasicLocationInfo(ip);
  }
}

// Batch location lookup for multiple IPs
async function getBatchLocationInfo(ips) {
  const results = {};
  const promises = ips.map(async (ip) => {
    try {
      results[ip] = await getLocationInfo(ip);
    } catch (error) {
      results[ip] = getBasicLocationInfo(ip);
    }
  });
  
  await Promise.all(promises);
  return results;
}

// Get location statistics from cache
function getLocationStats() {
  const stats = {
    totalCached: IPINFO_CONFIG.cache.size,
    cacheHits: 0,
    apiCalls: 0,
    countries: {},
    cities: {},
    isps: {}
  };
  
  for (const [ip, cached] of IPINFO_CONFIG.cache.entries()) {
    const data = cached.data;
    
    // Count by source
    if (data.source === 'cache') stats.cacheHits++;
    if (data.source === 'ipinfo') stats.apiCalls++;
    
    // Count by country
    if (data.country && data.country !== 'Unknown') {
      stats.countries[data.country] = (stats.countries[data.country] || 0) + 1;
    }
    
    // Count by city
    if (data.city && data.city !== 'Unknown') {
      stats.cities[data.city] = (stats.cities[data.city] || 0) + 1;
    }
    
    // Count by ISP
    if (data.isp && data.isp !== 'Unknown') {
      stats.isps[data.isp] = (stats.isps[data.isp] || 0) + 1;
    }
  }
  
  return stats;
}

// Clear location cache
function clearLocationCache() {
  const size = IPINFO_CONFIG.cache.size;
  IPINFO_CONFIG.cache.clear();
  console.log(`🧹 Cleared ${size} location cache entries`);
  return size;
}

// Get IPInfo configuration status
function getIPInfoStatus() {
  return {
    enabled: IPINFO_CONFIG.enabled,
    configured: !!(IPINFO_CONFIG.token && IPINFO_CONFIG.token !== 'your-ipinfo-token-here'),
    clientInitialized: !!ipinfoClient,
    cacheSize: IPINFO_CONFIG.cache.size,
    cacheExpiry: IPINFO_CONFIG.cacheExpiry / 1000 / 60 / 60, // hours
    timeout: IPINFO_CONFIG.timeout / 1000 // seconds
  };
}

module.exports = {
  getLocationInfo,
  getEnhancedLocationInfo,
  getBasicLocationInfo,
  getBatchLocationInfo,
  getLocationStats,
  clearLocationCache,
  getIPInfoStatus,
  isLocalIP
};