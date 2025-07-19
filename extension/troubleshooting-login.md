# 🔧 Troubleshooting Login Extension

## 🚨 **Masalah: Tidak Bisa Login**

### **Langkah Debugging:**

#### **1. Cek Console Browser**
1. Buka extension popup
2. Klik kanan → Inspect Element
3. Buka tab Console
4. Coba login dan lihat error messages

#### **2. Test dengan Debug Tools**
Copy dan paste script ini ke console browser:

```javascript
// Test login dengan credentials yang sudah terdaftar
debugLogin('demo@example.com', 'demo123');

// Cek storage
debugStorage();

// Test koneksi Supabase
debugSupabaseConnection();
```

#### **3. Cek Database Supabase**
Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek apakah user ada di database
SELECT id, email, full_name, is_active, is_verified, role 
FROM users 
WHERE email = 'demo@example.com';

-- Cek password hash
SELECT email, LENGTH(password_hash) as hash_length
FROM users 
WHERE email = 'demo@example.com';
```

## 🔍 **Kemungkinan Penyebab Masalah**

### **1. Environment Variables Tidak Set**
```bash
# Cek di Vercel dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **2. Supabase Functions Tidak Terinstall**
Jalankan `schema.sql` di Supabase SQL Editor.

### **3. User Tidak Terdaftar dengan Benar**
Cek apakah user ada di database dengan password yang benar.

### **4. CORS Issues**
Extension tidak bisa akses API karena CORS.

### **5. Network Issues**
Koneksi internet atau API endpoint down.

## 🛠️ **Solusi Step by Step**

### **Step 1: Verifikasi Database**
```sql
-- Jalankan di Supabase SQL Editor
SELECT * FROM users WHERE email = 'demo@example.com';
```

**Expected Result:**
```
id | email | full_name | is_active | is_verified | role
---|-------|-----------|-----------|-------------|-----
xxx| demo@example.com | Demo User | true | true | user
```

### **Step 2: Test API Endpoint**
```bash
# Test dengan curl
curl -X POST https://yapper-twitter.vercel.app/api/login-supabase \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "abc123...",
  "userId": "uuid",
  "email": "demo@example.com",
  "role": "user"
}
```

### **Step 3: Cek Extension Storage**
```javascript
// Di console browser
chrome.storage.local.get(null, (result) => {
  console.log('Storage:', result);
});
```

### **Step 4: Test Supabase Connection**
```javascript
// Test koneksi langsung ke Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.rpc('authenticate_user', {
  p_email: 'demo@example.com',
  p_password: 'demo123'
});

console.log('Auth result:', { data, error });
```

## 🐛 **Common Error Messages**

### **"Invalid email or password"**
- **Cause**: User tidak ada atau password salah
- **Solution**: Cek database dan credentials

### **"Account is deactivated"**
- **Cause**: `is_active = false` di database
- **Solution**: Update user status di database

### **"Account not verified"**
- **Cause**: `is_verified = false` di database
- **Solution**: Update user verification status

### **"Internal server error"**
- **Cause**: Supabase connection atau function error
- **Solution**: Cek environment variables dan Supabase setup

### **"Network error"**
- **Cause**: CORS atau koneksi internet
- **Solution**: Cek network dan CORS settings

## 🔧 **Quick Fixes**

### **Fix 1: Reset User Password**
```sql
-- Update password untuk demo user
UPDATE users 
SET password_hash = crypt('demo123', gen_salt('bf'))
WHERE email = 'demo@example.com';
```

### **Fix 2: Activate User**
```sql
-- Activate dan verify user
UPDATE users 
SET is_active = true, is_verified = true
WHERE email = 'demo@example.com';
```

### **Fix 3: Clear Extension Storage**
```javascript
// Di console browser
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

### **Fix 4: Reinstall Extension**
1. Hapus extension dari Chrome
2. Load ulang extension dari folder
3. Test login lagi

## 📊 **Debug Checklist**

- [ ] Environment variables set di Vercel
- [ ] Supabase schema.sql sudah dijalankan
- [ ] User ada di database
- [ ] Password hash menggunakan bcrypt
- [ ] User is_active = true
- [ ] User is_verified = true
- [ ] API endpoint bisa diakses
- [ ] CORS headers sudah benar
- [ ] Extension storage berfungsi
- [ ] Console tidak ada error

## 🆘 **Jika Masih Bermasalah**

### **1. Cek Vercel Logs**
- Buka Vercel dashboard
- Cek function logs untuk error

### **2. Cek Supabase Logs**
- Buka Supabase dashboard
- Cek database logs

### **3. Test dengan Postman**
- Test API endpoint dengan Postman
- Bandingkan dengan extension

### **4. Create New Test User**
```sql
-- Buat user test baru
SELECT create_user(
  'test@example.com',
  'test123',
  'Test User',
  'testuser'
);
```

## 📞 **Support**

Jika masih bermasalah, siapkan informasi berikut:
1. Error message dari console
2. Response dari API test
3. Database query results
4. Environment variables (tanpa sensitive data)
5. Extension version dan Chrome version 