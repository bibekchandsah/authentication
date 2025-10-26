document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = loginForm.querySelector('.login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    // Get all digit input elements
    const digitInputs = document.querySelectorAll('.code-digit');

    // Initialize digit input functionality
    initializeDigitInputs();

    loginForm.addEventListener('submit', async function(e) {
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
                setTimeout(() => {
                    window.location.href = '/main';
                }, 500);
            } else {
                // Show error message
                showError(data.message || 'Authentication failed');
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
            input.addEventListener('input', function(e) {
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
            input.addEventListener('keydown', function(e) {
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
            input.addEventListener('paste', function(e) {
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
            input.addEventListener('focus', function() {
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

    // Focus on first input field when page loads
    digitInputs[0].focus();

    // Add double-click to clear all inputs
    digitInputs.forEach(input => {
        input.addEventListener('dblclick', clearInputs);
    });
});