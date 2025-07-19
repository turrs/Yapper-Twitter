// Login and Register functionality for the extension
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const messageDiv = document.getElementById('message');
const showRegisterLink = document.getElementById('showRegister');

// Register form elements
const registerForm = document.getElementById('registerForm');
const regFullNameInput = document.getElementById('regFullName');
const regUsernameInput = document.getElementById('regUsername');
const regEmailInput = document.getElementById('regEmail');
const regPasswordInput = document.getElementById('regPassword');
const regConfirmPasswordInput = document.getElementById('regConfirmPassword');
const registerBtn = document.getElementById('registerBtn');
const registerMessageDiv = document.getElementById('registerMessage');
const showLoginLink = document.getElementById('showLogin');

// Form containers
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');

// Check if user is already logged in
function checkLoginStatus() {
  chrome.storage.local.get(['authToken', 'userEmail'], (result) => {
    if (result.authToken && result.userEmail) {
      // User is already logged in, redirect to main popup
      window.location.href = 'popup.html';
    }
  });
}

// Show message to user
function showMessage(text, type = 'error', targetDiv = messageDiv) {
  targetDiv.textContent = text;
  targetDiv.className = type;
  targetDiv.style.display = 'block';
}

// Toggle between login and register forms
function showLoginForm() {
  loginFormContainer.style.display = 'block';
  registerFormContainer.style.display = 'none';
  messageDiv.style.display = 'none';
  registerMessageDiv.style.display = 'none';
}

function showRegisterForm() {
  loginFormContainer.style.display = 'none';
  registerFormContainer.style.display = 'block';
  messageDiv.style.display = 'none';
  registerMessageDiv.style.display = 'none';
}

// Password strength checker
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 8) strength++;
  else feedback.push('At least 8 characters');
  
  if (/[a-z]/.test(password)) strength++;
  else feedback.push('Include lowercase letter');
  
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('Include uppercase letter');
  
  if (/[0-9]/.test(password)) strength++;
  else feedback.push('Include number');
  
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  else feedback.push('Include special character');
  
  return { strength, feedback };
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  if (!email || !password) {
    showMessage('Email dan password harus diisi!');
    return;
  }
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  loginFormContainer.classList.add('loading');
  showMessage('', '');
  
  try {
    // Use Supabase login endpoint
    const response = await fetch('https://yapper-twitter.vercel.app/api/login-supabase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      // Store authentication data
      chrome.storage.local.set({
        authToken: data.token,
        userEmail: email,
        userId: data.userId || null,
        userRole: data.role || 'user'
      }, () => {
        showMessage('Login berhasil! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'popup.html';
        }, 1000);
      });
    } else {
      showMessage(data.message || data.error || 'Login gagal. Periksa email dan password Anda.');
    }
  } catch (error) {
    showMessage('Error: ' + error.message);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
    loginFormContainer.classList.remove('loading');
  }
});

// Handle register form submission
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullName = regFullNameInput.value.trim();
  const username = regUsernameInput.value.trim();
  const email = regEmailInput.value.trim();
  const password = regPasswordInput.value;
  const confirmPassword = regConfirmPasswordInput.value;
  
  // Validation
  if (!fullName || !email || !password || !confirmPassword) {
    showMessage('Semua field wajib diisi!', 'error', registerMessageDiv);
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('Password dan konfirmasi password tidak cocok!', 'error', registerMessageDiv);
    return;
  }
  
  const passwordCheck = checkPasswordStrength(password);
  if (passwordCheck.strength < 3) {
    showMessage('Password terlalu lemah. ' + passwordCheck.feedback.join(', '), 'error', registerMessageDiv);
    return;
  }
  
  registerBtn.disabled = true;
  registerBtn.textContent = 'Registering...';
  registerFormContainer.classList.add('loading');
  showMessage('', '', registerMessageDiv);
  
  try {
    const response = await fetch('https://yapper-twitter.vercel.app/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        fullName: fullName,
        username: username || null
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('Registrasi berhasil! Silakan login.', 'success', registerMessageDiv);
      // Clear form
      registerForm.reset();
      // Switch to login form after 2 seconds
      setTimeout(() => {
        showLoginForm();
      }, 2000);
    } else {
      showMessage(data.message || data.error || 'Registrasi gagal. Coba lagi.', 'error', registerMessageDiv);
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error', registerMessageDiv);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Register';
    registerFormContainer.classList.remove('loading');
  }
});

// Handle form toggle links
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  showRegisterForm();
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  showLoginForm();
});

// Password strength indicator
regPasswordInput.addEventListener('input', (e) => {
  const password = e.target.value;
  const strength = checkPasswordStrength(password);
  
  // Remove existing strength indicator
  const existingIndicator = document.querySelector('.password-strength');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  if (password.length > 0) {
    const indicator = document.createElement('div');
    indicator.className = 'password-strength';
    
    let strengthText = '';
    let strengthClass = '';
    
    if (strength.strength <= 2) {
      strengthText = 'Lemah';
      strengthClass = 'strength-weak';
    } else if (strength.strength <= 3) {
      strengthText = 'Sedang';
      strengthClass = 'strength-medium';
    } else {
      strengthText = 'Kuat';
      strengthClass = 'strength-strong';
    }
    
    indicator.textContent = `Password strength: ${strengthText}`;
    indicator.classList.add(strengthClass);
    
    regPasswordInput.parentNode.appendChild(indicator);
  }
});

// Check login status when page loads
document.addEventListener('DOMContentLoaded', checkLoginStatus); 