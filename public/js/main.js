document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    const infoDisplay = document.getElementById('infoDisplay');

    // Logout functionality
    logoutBtn.addEventListener('click', async function() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                
                if (data.success) {
                    window.location.href = '/login';
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('Connection error during logout.');
            }
        }
    });

    // Check authentication status
    window.checkAuthStatus = async function() {
        try {
            const response = await fetch('/auth-status');
            const data = await response.json();
            
            const info = {
                'Authentication Status': data.authenticated ? '✅ Authenticated' : '❌ Not Authenticated',
                'User': data.user || 'Not logged in',
                'Session Active': data.authenticated ? 'Yes' : 'No',
                'Timestamp': new Date().toLocaleString()
            };
            
            displayInfo('Authentication Status', info);
        } catch (error) {
            console.error('Auth status check error:', error);
            displayInfo('Error', { 'Message': 'Failed to check authentication status' });
        }
    };

    // Show session information
    window.showSessionInfo = function() {
        const sessionInfo = {
            'Page': 'Main Dashboard',
            'Access Level': 'Full Access',
            'Security': 'Microsoft Key Authentication',
            'Session Type': 'Server-side Session',
            'Last Activity': new Date().toLocaleString(),
            'Browser': navigator.userAgent.split(' ')[0],
            'Platform': navigator.platform
        };
        
        displayInfo('Session Information', sessionInfo);
    };

    // Show secret key information
    window.showSecretInfo = async function() {
        try {
            const response = await fetch('/admin/secret-info');
            const data = await response.json();
            
            if (data.error) {
                displayInfo('Error', { 'Message': data.error });
                return;
            }
            
            const secretInfo = {
                'Secret Key': data.secret,
                'Service Name': data.serviceName || 'Secure Webpage - Bibek Sha',
                'Created': data.created ? new Date(data.created).toLocaleString() : 'Unknown',
                'Status': data.regenerated ? 'Regenerated' : 'Original',
                'Key Length': data.secret ? data.secret.length + ' characters' : 'Unknown'
            };
            
            displayInfo('Secret Key Information', secretInfo);
        } catch (error) {
            console.error('Secret info error:', error);
            displayInfo('Error', { 'Message': 'Failed to fetch secret key information' });
        }
    };

    // Regenerate secret key
    window.regenerateSecret = async function() {
        const confirmMessage = 'Are you sure you want to regenerate the secret key?\n\n' +
                              'This will:\n' +
                              '• Invalidate your current Microsoft Authenticator setup\n' +
                              '• Require you to reconfigure your authenticator app\n' +
                              '• Generate a completely new secret key\n\n' +
                              'Type "REGENERATE" to confirm:';
        
        const confirmation = prompt(confirmMessage);
        
        if (confirmation !== 'REGENERATE') {
            alert('Secret key regeneration cancelled.');
            return;
        }

        try {
            const response = await fetch('/admin/regenerate-secret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.success) {
                const resultInfo = {
                    'Status': '✅ Success',
                    'Message': data.message,
                    'New Secret Key': data.newSecret,
                    'Previous Key (partial)': data.oldSecret,
                    'Next Steps': 'Visit /setup to reconfigure your Microsoft Authenticator',
                    'Timestamp': new Date().toLocaleString()
                };
                
                displayInfo('Secret Key Regenerated', resultInfo);
                
                // Show additional instructions
                setTimeout(() => {
                    if (confirm('Secret key regenerated successfully!\n\nWould you like to open the setup page to reconfigure your Microsoft Authenticator?')) {
                        window.open('/setup', '_blank');
                    }
                }, 2000);
            } else {
                displayInfo('Regeneration Failed', { 
                    'Error': data.message,
                    'Details': data.error || 'Unknown error'
                });
            }
        } catch (error) {
            console.error('Regeneration error:', error);
            displayInfo('Error', { 'Message': 'Failed to regenerate secret key' });
        }
    };

    // Show rate limit information
    window.showRateLimits = async function() {
        try {
            const response = await fetch('/admin/rate-limits');
            const data = await response.json();
            
            if (data.error) {
                displayInfo('Error', { 'Message': data.error });
                return;
            }
            
            let rateLimitInfo = {
                'Total Monitored IPs': data.totalIPs,
                'Currently Locked IPs': data.lockedIPs,
                'Max Attempts Allowed': data.config.maxAttempts,
                'Lockout Duration': `${data.config.lockoutDuration / 1000 / 60} minutes`,
                'Progressive Lockout': data.config.progressiveLockout ? 'Enabled' : 'Disabled'
            };
            
            if (data.rateLimits.length > 0) {
                rateLimitInfo['--- Recent Activity ---'] = '';
                data.rateLimits.slice(0, 10).forEach((limit, index) => {
                    const status = limit.locked ? `🔒 LOCKED (${limit.remainingTime}min)` : '✅ Active';
                    rateLimitInfo[`${index + 1}. ${limit.ip}`] = `${status} - ${limit.attempts} attempts, ${limit.violations} violations`;
                });
            } else {
                rateLimitInfo['Status'] = '✅ No rate limits active';
            }
            
            displayInfo('Rate Limit Status', rateLimitInfo);
        } catch (error) {
            console.error('Rate limit info error:', error);
            displayInfo('Error', { 'Message': 'Failed to fetch rate limit information' });
        }
    };

    // Clear all rate limits
    window.clearAllRateLimits = async function() {
        const confirmMessage = 'Are you sure you want to clear ALL rate limits?\n\n' +
                              'This will:\n' +
                              '• Remove all IP-based login restrictions\n' +
                              '• Allow previously locked IPs to attempt login\n' +
                              '• Reset all failed attempt counters\n\n' +
                              'Type "CLEAR" to confirm:';
        
        const confirmation = prompt(confirmMessage);
        
        if (confirmation !== 'CLEAR') {
            alert('Rate limit clearing cancelled.');
            return;
        }

        try {
            const response = await fetch('/admin/clear-all-rate-limits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.success) {
                displayInfo('Rate Limits Cleared', {
                    'Status': '✅ Success',
                    'Message': data.message,
                    'Timestamp': new Date().toLocaleString()
                });
            } else {
                displayInfo('Clear Failed', { 
                    'Error': data.message
                });
            }
        } catch (error) {
            console.error('Clear rate limits error:', error);
            displayInfo('Error', { 'Message': 'Failed to clear rate limits' });
        }
    };

    function displayInfo(title, data) {
        let content = `<h4>${title}</h4><pre>`;
        
        for (const [key, value] of Object.entries(data)) {
            content += `${key}: ${value}\n`;
        }
        
        content += '</pre>';
        
        infoDisplay.innerHTML = content;
        infoDisplay.style.display = 'block';
        
        // Scroll to info display
        infoDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Verify authentication on page load
    checkAuthOnLoad();

    async function checkAuthOnLoad() {
        try {
            const response = await fetch('/auth-status');
            const data = await response.json();
            
            if (!data.authenticated) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Redirect to login on error
            window.location.href = '/login';
        }
    }
});