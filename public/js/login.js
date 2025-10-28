document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const rateLimitMessage = document.getElementById('rateLimitMessage');
    const loginBtn = loginForm.querySelector('.login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');

    // Google OAuth elements
    const oauthSection = document.getElementById('oauthSection');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    // Get all digit input elements
    const digitInputs = document.querySelectorAll('.code-digit');

    let rateLimitCountdown = null;

    // Check authentication mode and show/hide OAuth section
    checkAuthMode();

    // Google login button click tracking
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function () {
            console.log('🌐 Initiating Google OAuth login...');
            hideError();
            hideRateLimit();
        });
    }

    // Initialize digit input functionality
    initializeDigitInputs();

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const authCode = getAuthCode();

        if (!authCode) {
            showError('Please enter your 6-digit authentication code');
            showInputError();
            return;
        }

        if (authCode.length !== 6 || !/^\d{6}$/.test(authCode)) {
            showError('Please enter a valid 6-digit code');
            showInputError();
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideError();
        clearInputStyles();

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ authCode })
            });

            const data = await response.json();

            if (data.success) {
                // Success - show success state and redirect
                showInputSuccess();
                hideRateLimit();
                console.log('Login successful, redirecting to /main');
                setTimeout(() => {
                    window.location.href = '/main';
                }, 500);
            } else if (data.rateLimited) {
                // Rate limited - show lockout message
                showRateLimit(data.message, data.remainingTime, data.lockedUntil);
                showInputError();
                setLoadingState(false);
                disableForm(true);
            } else {
                // Regular error - show error message
                showError(data.message || 'Authentication failed');
                if (data.remainingAttempts !== undefined) {
                    showAttemptsRemaining(data.remainingAttempts);
                }
                showInputError();
                setLoadingState(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Connection error. Please try again.');
            showInputError();
            setLoadingState(false);
        }
    });

    function initializeDigitInputs() {
        digitInputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', function (e) {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                e.target.value = value;

                hideError();
                clearInputStyles();

                if (value) {
                    e.target.classList.add('filled');
                    // Auto-advance to next input
                    if (index < digitInputs.length - 1) {
                        digitInputs[index + 1].focus();
                    }
                } else {
                    e.target.classList.remove('filled');
                }

                // Auto-submit when all digits are filled
                if (getAuthCode().length === 6) {
                    setTimeout(() => {
                        loginForm.dispatchEvent(new Event('submit'));
                    }, 100);
                }
            });

            // Handle backspace
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    digitInputs[index - 1].focus();
                    digitInputs[index - 1].value = '';
                    digitInputs[index - 1].classList.remove('filled');
                }

                // Handle arrow keys
                if (e.key === 'ArrowLeft' && index > 0) {
                    digitInputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < digitInputs.length - 1) {
                    digitInputs[index + 1].focus();
                }
            });

            // Handle paste
            input.addEventListener('paste', function (e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

                if (pastedData.length === 6) {
                    // Fill all inputs with pasted data
                    for (let i = 0; i < 6; i++) {
                        if (digitInputs[i]) {
                            digitInputs[i].value = pastedData[i];
                            digitInputs[i].classList.add('filled');
                        }
                    }

                    // Focus last input and auto-submit
                    digitInputs[5].focus();
                    setTimeout(() => {
                        loginForm.dispatchEvent(new Event('submit'));
                    }, 100);
                }
            });

            // Handle focus
            input.addEventListener('focus', function () {
                clearInputStyles();
                hideError();
            });
        });
    }

    function getAuthCode() {
        return Array.from(digitInputs).map(input => input.value).join('');
    }

    function clearInputs() {
        digitInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        digitInputs[0].focus();
    }

    function showInputError() {
        digitInputs.forEach(input => {
            input.classList.add('error');
            input.classList.remove('filled');
        });

        setTimeout(() => {
            clearInputStyles();
            digitInputs[0].focus();
        }, 1000);
    }

    function showInputSuccess() {
        digitInputs.forEach(input => {
            input.classList.remove('error');
            input.classList.add('filled');
            input.style.borderColor = '#28a745';
            input.style.background = '#d4edda';
        });
    }

    function clearInputStyles() {
        digitInputs.forEach(input => {
            input.classList.remove('error');
            input.style.borderColor = '';
            input.style.background = '';
        });
    }

    function setLoadingState(loading) {
        loginBtn.disabled = loading;
        digitInputs.forEach(input => input.disabled = loading);

        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function showRateLimit(message, remainingMinutes, lockedUntil) {
        rateLimitMessage.innerHTML = `
            <div class="rate-limit-countdown">🔒 Account Temporarily Locked</div>
            <div>${message}</div>
            <div id="countdown" class="rate-limit-countdown"></div>
            <small>Too many failed login attempts detected. Please wait before trying again.</small>
        `;
        rateLimitMessage.className = 'rate-limit-message severe';
        rateLimitMessage.style.display = 'block';

        // Start countdown timer
        if (remainingMinutes > 0) {
            startCountdown(remainingMinutes);
        }
    }

    function hideRateLimit() {
        rateLimitMessage.style.display = 'none';
        if (rateLimitCountdown) {
            clearInterval(rateLimitCountdown);
            rateLimitCountdown = null;
        }
    }

    function showAttemptsRemaining(remaining) {
        if (remaining > 0) {
            const attemptsDiv = document.createElement('div');
            attemptsDiv.className = 'attempts-remaining';
            attemptsDiv.innerHTML = `⚠️ ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout`;
            errorMessage.appendChild(attemptsDiv);
        }
    }

    function startCountdown(minutes) {
        let totalSeconds = minutes * 60;
        const countdownElement = document.getElementById('countdown');

        rateLimitCountdown = setInterval(() => {
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;

            if (countdownElement) {
                countdownElement.textContent = `Time remaining: ${mins}:${secs.toString().padStart(2, '0')}`;
            }

            totalSeconds--;

            if (totalSeconds < 0) {
                clearInterval(rateLimitCountdown);
                rateLimitCountdown = null;
                // Refresh page to allow login attempts again
                window.location.reload();
            }
        }, 1000);
    }

    function disableForm(disabled) {
        digitInputs.forEach(input => input.disabled = disabled);
        loginBtn.disabled = disabled;

        if (disabled) {
            loginBtn.style.opacity = '0.5';
            loginBtn.style.cursor = 'not-allowed';
        } else {
            loginBtn.style.opacity = '';
            loginBtn.style.cursor = '';
        }
    }

    // Check rate limit status on page load
    async function checkRateLimitStatus() {
        try {
            const response = await fetch('/rate-limit-status');
            const data = await response.json();

            if (data.rateLimited && data.remainingTime > 0) {
                showRateLimit(
                    `Too many failed attempts. Account locked for ${data.remainingTime} more minutes.`,
                    data.remainingTime,
                    data.lockedUntil
                );
                disableForm(true);
            }
        } catch (error) {
            console.error('Rate limit check error:', error);
        }
    }

    // Check rate limit status on page load
    checkRateLimitStatus();

    // Focus on first input field when page loads (if not rate limited)
    setTimeout(() => {
        if (!digitInputs[0].disabled) {
            digitInputs[0].focus();
        }
    }, 100);

    // Add double-click to clear all inputs
    digitInputs.forEach(input => {
        input.addEventListener('dblclick', clearInputs);
    });

    // Clear rate limit message when user starts typing (if not locked)
    digitInputs.forEach(input => {
        input.addEventListener('input', function () {
            if (!input.disabled) {
                hideRateLimit();
                hideError();
            }
        });
    });

    // Check authentication mode and configure UI accordingly
    async function checkAuthMode() {
        try {
            const response = await fetch('/admin/auth-mode');
            const data = await response.json();

            // Show OAuth section if Google is enabled
            if (data.googleEnabled && oauthSection) {
                oauthSection.classList.remove('hidden');
                console.log('🌐 Google OAuth enabled');
            } else if (oauthSection) {
                oauthSection.classList.add('hidden');
                console.log('📱 TOTP-only mode');
            }
        } catch (error) {
            console.error('Auth mode check error:', error);
            // Hide OAuth section on error (fallback to TOTP only)
            if (oauthSection) {
                oauthSection.classList.add('hidden');
            }
        }
    }

    // Check for Google OAuth errors in URL parameters
    function checkOAuthErrors() {
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const message = urlParams.get('message');

        if (error) {
            if (error === 'unauthorized') {
                showError(message || 'Unauthorized email address. Only the authorized Google account can access this system.');
            } else if (error === 'oauth_error') {
                showError(message || 'Google authentication failed. Please try again.');
            } else {
                showError('Authentication error occurred. Please try again.');
            }

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Initialize OAuth error checking
    checkOAuthErrors();
});