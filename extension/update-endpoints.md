# Update Extension untuk Supabase

## File yang Perlu Diupdate

### 1. Update login.js
Ganti URL endpoint di `project/extension/login.js`:

```javascript
// Ganti baris ini:
const response = await fetch('https://yapper-twitter.vercel.app/api/login', {

// Menjadi:
const response = await fetch('https://yapper-twitter.vercel.app/api/login-supabase', {
```

### 2. Update popup.js
Ganti URL endpoint di `project/extension/popup.js`:

```javascript
// Ganti baris ini:
const res = await fetch('https://yapper-twitter.vercel.app/api/ai-generate-comment', {

// Menjadi:
const res = await fetch('https://yapper-twitter.vercel.app/api/ai-generate-comment-supabase', {
```

### 3. Update content.js
Ganti URL endpoint di `project/extension/content.js`:

```javascript
// Ganti baris ini:
const backendUrl = 'https://yapper-twitter.vercel.app/api/ai-generate-comment';

// Menjadi:
const backendUrl = 'https://yapper-twitter.vercel.app/api/ai-generate-comment-supabase';
```

### 4. Tambahkan Logout API Call
Update logout handler di `project/extension/popup.js`:

```javascript
// Handle logout
logoutBtn.addEventListener('click', async () => {
  try {
    // Call logout API
    const response = await fetch('https://yapper-twitter.vercel.app/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Clear local storage regardless of API response
    chrome.storage.local.remove(['authToken', 'userEmail', 'userId'], () => {
      window.location.href = 'login.html';
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage and redirect
    chrome.storage.local.remove(['authToken', 'userEmail', 'userId'], () => {
      window.location.href = 'login.html';
    });
  }
});
```

## Fitur Baru yang Tersedia

### 1. User Registration
Tambahkan form registrasi di `login.html`:

```html
<div class="register-form" style="display:none;">
  <h2>📝 Register</h2>
  <form id="registerForm">
    <input type="text" id="regFullName" placeholder="Full Name" />
    <input type="text" id="regUsername" placeholder="Username (optional)" />
    <input type="email" id="regEmail" placeholder="Email" required />
    <input type="password" id="regPassword" placeholder="Password" required />
    <button type="submit" id="registerBtn">Register</button>
  </form>
  <div class="register-link">
    Sudah punya akun? <a href="#" id="showLogin">Login</a>
  </div>
</div>
```

### 2. Enhanced User Info
Update user info display di `popup.html`:

```javascript
// Di popup.js, update user info display:
userInfoDiv.innerHTML = `
  <div>Logged in as: ${userEmail}</div>
  <div style="font-size: 10px; color: #999;">Role: ${userRole || 'user'}</div>
`;
```

## Testing

### 1. Test Login
- Gunakan demo credentials:
  - Email: `demo@example.com` / Password: `demo123`
  - Email: `test@example.com` / Password: `test123`

### 2. Test Comment Generation
- Login terlebih dahulu
- Buka Twitter dan coba generate comment
- Cek apakah comment berhasil di-generate

### 3. Test Logout
- Klik tombol logout
- Pastikan redirect ke login page
- Coba akses fitur tanpa login

### 4. Test Session Expiry
- Tunggu 24 jam atau update expiry time di database
- Coba generate comment dengan token expired
- Pastikan redirect ke login

## Monitoring

### 1. Check Database
Buka Supabase Dashboard dan cek:
- Table `users` - untuk melihat user yang terdaftar
- Table `user_sessions` - untuk melihat session aktif
- Table `user_activity_log` - untuk melihat aktivitas user

### 2. Check API Logs
Monitor API calls di Vercel dashboard atau server logs.

## Troubleshooting

### Error: "Authentication required"
- Pastikan user sudah login
- Cek apakah token masih valid
- Coba logout dan login ulang

### Error: "Session expired"
- Token expired, user perlu login ulang
- Cek expiry time di database

### Error: "Invalid email or password"
- Pastikan credentials benar
- Cek apakah user ada di database
- Cek apakah user sudah verified

### Extension tidak berfungsi
- Refresh extension di Chrome
- Cek console untuk error
- Pastikan semua endpoints sudah diupdate 