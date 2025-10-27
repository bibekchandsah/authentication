const fs = require('fs');
const path = require('path');

// File paths
const LOGS_FILE = path.join(__dirname, '..', '.security-logs.json');

// Security logging configuration
const LOGGING_CONFIG = {
  maxLogEntries: 1000,        // Maximum log entries to keep
  logRetentionDays: 30,       // Keep logs for 30 days
  cleanupInterval: 24 * 60 * 60 * 1000  // Cleanup every 24 hours
};

// In-memory logs (backed by file)
let securityLogs = [];

// Function to load existing logs
function loadSecurityLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      const logsData = JSON.parse(data);
      securityLogs = logsData.logs || [];
      console.log(`📋 Loaded ${securityLogs.length} security log entries`);
    }
  } catch (error) {
    console.log('⚠️ Could not load existing logs, starting fresh');
    securityLogs = [];
  }
}

// Function to save logs to file
function saveSecurityLogs() {
  try {
    const logsData = {
      logs: securityLogs,
      lastUpdated: new Date().toISOString(),
      totalEntries: securityLogs.length
    };
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logsData, null, 2));
  } catch (error) {
    console.error('❌ Failed to save security logs:', error.message);
  }
}

// Function to add security log entry
function addSecurityLog(type, details) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    type: type, // 'login_success', 'login_failed', 'logout', 'session_expired', 'rate_limited', 'admin_action'
    ...details
  };

  securityLogs.unshift(logEntry); // Add to beginning

  // Limit log entries
  if (securityLogs.length > LOGGING_CONFIG.maxLogEntries) {
    securityLogs = securityLogs.slice(0, LOGGING_CONFIG.maxLogEntries);
  }

  // Save to file
  saveSecurityLogs();

  return logEntry;
}

// Cleanup old logs
function cleanupOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOGGING_CONFIG.logRetentionDays);

  const initialCount = securityLogs.length;
  securityLogs = securityLogs.filter(log => new Date(log.timestamp) > cutoffDate);

  if (securityLogs.length !== initialCount) {
    console.log(`🧹 Cleaned up ${initialCount - securityLogs.length} old log entries`);
    saveSecurityLogs();
  }
}

// Get all security logs
function getSecurityLogs() {
  return securityLogs;
}

// Get logging configuration
function getLoggingConfig() {
  return LOGGING_CONFIG;
}

// Initialize logging system
function initializeLogging() {
  loadSecurityLogs();
  
  // Setup cleanup interval
  setInterval(cleanupOldLogs, LOGGING_CONFIG.cleanupInterval);
  
  console.log('📋 Security logging system initialized');
}

module.exports = {
  addSecurityLog,
  getSecurityLogs,
  getLoggingConfig,
  cleanupOldLogs,
  initializeLogging,
  loadSecurityLogs,
  saveSecurityLogs
};