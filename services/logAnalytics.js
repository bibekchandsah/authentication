const { getSecurityLogs } = require('./loggingService');

// Get security dashboard summary
function getSecurityDashboard() {
  const securityLogs = getSecurityLogs();
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Recent activity
  const recentLogs = securityLogs.filter(log => new Date(log.timestamp) > last24h);
  const weeklyLogs = securityLogs.filter(log => new Date(log.timestamp) > last7d);

  // Top IPs
  const ipCounts = {};
  securityLogs.forEach(log => {
    ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
  });
  const topIPs = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Failed login attempts by IP
  const failedAttempts = {};
  securityLogs
    .filter(log => log.type === 'login_failed')
    .forEach(log => {
      failedAttempts[log.ip] = (failedAttempts[log.ip] || 0) + 1;
    });
  const topFailedIPs = Object.entries(failedAttempts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  // Browser/OS statistics
  const browsers = {};
  const operatingSystems = {};
  securityLogs.forEach(log => {
    if (log.browser) browsers[log.browser] = (browsers[log.browser] || 0) + 1;
    if (log.os) operatingSystems[log.os] = (operatingSystems[log.os] || 0) + 1;
  });

  return {
    summary: {
      totalLogs: securityLogs.length,
      last24Hours: recentLogs.length,
      last7Days: weeklyLogs.length,
      successfulLogins: securityLogs.filter(log => log.type === 'login_success').length,
      failedLogins: securityLogs.filter(log => log.type === 'login_failed').length,
      rateLimitedAttempts: securityLogs.filter(log => log.type === 'rate_limited').length,
      uniqueIPs: Object.keys(ipCounts).length
    },
    recentActivity: recentLogs.slice(0, 10),
    topIPs,
    topFailedIPs,
    browsers: Object.entries(browsers).sort(([, a], [, b]) => b - a).slice(0, 5),
    operatingSystems: Object.entries(operatingSystems).sort(([, a], [, b]) => b - a).slice(0, 5),
    timeline: {
      last24h: recentLogs.length,
      last7d: weeklyLogs.length,
      thisMonth: securityLogs.filter(log =>
        new Date(log.timestamp).getMonth() === now.getMonth() &&
        new Date(log.timestamp).getFullYear() === now.getFullYear()
      ).length
    }
  };
}

// Get filtered security logs with pagination
function getFilteredLogs(filters = {}) {
  const securityLogs = getSecurityLogs();
  const {
    page = 1,
    limit = 50,
    type = 'all',
    startDate,
    endDate
  } = filters;

  let filteredLogs = [...securityLogs];

  // Filter by type
  if (type !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.type === type);
  }

  // Filter by date range
  if (startDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Statistics
  const stats = {
    total: securityLogs.length,
    filtered: filteredLogs.length,
    loginSuccess: securityLogs.filter(log => log.type === 'login_success').length,
    loginFailed: securityLogs.filter(log => log.type === 'login_failed').length,
    rateLimited: securityLogs.filter(log => log.type === 'rate_limited').length,
    logouts: securityLogs.filter(log => log.type === 'logout').length,
    adminActions: securityLogs.filter(log => log.type === 'admin_action').length,
    uniqueIPs: [...new Set(securityLogs.map(log => log.ip))].length,
    last24Hours: securityLogs.filter(log =>
      new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
  };

  return {
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      total: filteredLogs.length,
      pages: Math.ceil(filteredLogs.length / limit)
    },
    filters: { type, startDate, endDate },
    statistics: stats
  };
}

// Export logs in different formats
function exportLogs(format = 'json') {
  const securityLogs = getSecurityLogs();
  
  if (format === 'csv') {
    // CSV export
    const csvHeader = 'Timestamp,Type,IP,Browser,OS,Device,Location,Message\n';
    const csvData = securityLogs.map(log =>
      `"${log.timestamp}","${log.type}","${log.ip}","${log.browser || ''}","${log.os || ''}","${log.device || ''}","${log.location || ''}","${log.message || log.reason || ''}"`
    ).join('\n');
    
    return {
      content: csvHeader + csvData,
      filename: `security-logs-${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv'
    };
  } else {
    // JSON export
    return {
      content: JSON.stringify({
        exportDate: new Date().toISOString(),
        totalEntries: securityLogs.length,
        logs: securityLogs
      }, null, 2),
      filename: `security-logs-${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json'
    };
  }
}

// Get security trends
function getSecurityTrends(days = 7) {
  const securityLogs = getSecurityLogs();
  const now = new Date();
  const trends = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayLogs = securityLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= dayStart && logDate < dayEnd;
    });

    trends.push({
      date: dayStart.toISOString().split('T')[0],
      total: dayLogs.length,
      successful: dayLogs.filter(log => log.type === 'login_success').length,
      failed: dayLogs.filter(log => log.type === 'login_failed').length,
      rateLimited: dayLogs.filter(log => log.type === 'rate_limited').length,
      adminActions: dayLogs.filter(log => log.type === 'admin_action').length
    });
  }

  return trends;
}

module.exports = {
  getSecurityDashboard,
  getFilteredLogs,
  exportLogs,
  getSecurityTrends
};