document.addEventListener('DOMContentLoaded', function() {
    const qrCodeElement = document.getElementById('qrCode');
    const secretKeyInput = document.getElementById('secretKey');
    const serviceNameInput = document.getElementById('serviceName');
    const copyBtn = document.getElementById('copyBtn');
    const testBtn = document.getElementById('testBtn');
    const testModal = document.getElementById('testModal');
    const cancelTest = document.getElementById('cancelTest');
    const verifyTest = document.getElementById('verifyTest');
    const testCode = document.getElementById('testCode');
    const testResult = document.getElementById('testResult');

    // Load setup information
    loadSetupInfo();

    async function loadSetupInfo() {
        try {
            const response = await fetch('/api/setup');
            const data = await response.json();
            
            // Display QR code
            qrCodeElement.innerHTML = `<img src="${data.qrCode}" alt="QR Code for Microsoft Authenticator">`;
            
            // Fill in manual entry fields
            secretKeyInput.value = data.secret;
            serviceNameInput.value = data.serviceName;
            
        } catch (error) {
            console.error('Failed to load setup info:', error);
            qrCodeElement.innerHTML = '<div class="error">Failed to load QR code</div>';
        }
    }

    // Copy secret key to clipboard
    copyBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(secretKeyInput.value);
            copyBtn.textContent = '✅ Copied!';
            copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
                copyBtn.style.background = '#28a745';
            }, 2000);
        } catch (error) {
            // Fallback for older browsers
            secretKeyInput.select();
            document.execCommand('copy');
            copyBtn.textContent = '✅ Copied!';
            
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        }
    });

    const testDigits = document.querySelectorAll('.test-digit');

    // Initialize test digit inputs
    function initializeTestDigits() {
        testDigits.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value;
                
                if (value) {
                    e.target.classList.add('filled');
                    if (index < testDigits.length - 1) {
                        testDigits[index + 1].focus();
                    }
                } else {
                    e.target.classList.remove('filled');
                }
                
                // Auto-verify when all digits filled
                if (getTestCode().length === 6) {
                    setTimeout(() => verifyTest.click(), 100);
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    testDigits[index - 1].focus();
                    testDigits[index - 1].value = '';
                    testDigits[index - 1].classList.remove('filled');
                }
            });

            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
                
                if (pastedData.length === 6) {
                    for (let i = 0; i < 6; i++) {
                        if (testDigits[i]) {
                            testDigits[i].value = pastedData[i];
                            testDigits[i].classList.add('filled');
                        }
                    }
                    setTimeout(() => verifyTest.click(), 100);
                }
            });
        });
    }

    function getTestCode() {
        return Array.from(testDigits).map(input => input.value).join('');
    }

    function clearTestInputs() {
        testDigits.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
        testDigits[0].focus();
    }

    // Test authenticator code
    testBtn.addEventListener('click', function() {
        testModal.style.display = 'flex';
        clearTestInputs();
        testResult.innerHTML = '';
        testResult.className = 'test-result';
        initializeTestDigits();
    });

    cancelTest.addEventListener('click', function() {
        testModal.style.display = 'none';
        clearTestInputs();
        testResult.innerHTML = '';
    });

    // Close modal when clicking outside
    testModal.addEventListener('click', function(e) {
        if (e.target === testModal) {
            testModal.style.display = 'none';
            clearTestInputs();
            testResult.innerHTML = '';
        }
    });

    // Verify test code
    verifyTest.addEventListener('click', async function() {
        const code = getTestCode();
        
        if (!code || !/^\d{6}$/.test(code)) {
            showTestResult('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ authCode: code })
            });

            const data = await response.json();
            
            if (data.success) {
                showTestResult('✅ Code verified successfully! Your authenticator is working correctly.', 'success');
            } else {
                showTestResult('❌ Invalid code. Please check your authenticator app and try again.', 'error');
            }
        } catch (error) {
            console.error('Test verification error:', error);
            showTestResult('❌ Connection error. Please try again.', 'error');
        }
    });

    function showTestResult(message, type) {
        testResult.innerHTML = message;
        testResult.className = `test-result ${type}`;
    }
});