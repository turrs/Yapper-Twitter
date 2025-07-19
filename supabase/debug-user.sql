-- Debug script untuk masalah login
-- Jalankan ini di Supabase SQL Editor

-- 1. Cek apakah user demo ada di database
SELECT 
  id,
  email,
  full_name,
  username,
  is_active,
  is_verified,
  role,
  created_at,
  LENGTH(password_hash) as hash_length,
  password_hash LIKE '$2b$%' as is_bcrypt
FROM users 
WHERE email = 'demo@example.com';

-- 2. Cek semua user yang ada
SELECT 
  email,
  full_name,
  is_active,
  is_verified,
  role,
  LENGTH(password_hash) as hash_length
FROM users 
ORDER BY created_at;

-- 3. Test authenticate_user function dengan user yang ada
SELECT * FROM authenticate_user('demo@example.com', 'demo123');

-- 4. Test dengan password yang salah untuk memastikan function bekerja
SELECT * FROM authenticate_user('demo@example.com', 'wrongpassword');

-- 5. Cek apakah password hash bisa diverifikasi manual
SELECT 
  email,
  password_hash,
  crypt('demo123', password_hash) = password_hash as password_match
FROM users 
WHERE email = 'demo@example.com';

-- 6. Jika user tidak ada atau password salah, buat ulang user demo
-- Hapus user lama jika ada
DELETE FROM users WHERE email = 'demo@example.com';

-- Buat user demo baru
SELECT create_user(
  'demo@example.com',
  'demo123',
  'Demo User',
  'demo_user'
);

-- 7. Test lagi setelah membuat user baru
SELECT * FROM authenticate_user('demo@example.com', 'demo123');

-- 8. Cek user yang baru dibuat
SELECT 
  id,
  email,
  full_name,
  username,
  is_active,
  is_verified,
  role,
  LENGTH(password_hash) as hash_length
FROM users 
WHERE email = 'demo@example.com';

-- 9. Test create_user function dengan user lain
SELECT create_user(
  'test@example.com',
  'test123',
  'Test User',
  'test_user'
);

-- 10. Test authenticate_user dengan user test
SELECT * FROM authenticate_user('test@example.com', 'test123');

-- 11. Cek apakah ada error di functions
-- Test hash_password function
SELECT hash_password('test123');

-- Test verify_password function
SELECT verify_password('test123', hash_password('test123'));

-- 12. Summary - semua user yang ada
SELECT 
  email,
  full_name,
  is_active,
  is_verified,
  role,
  created_at
FROM users 
ORDER BY created_at; 