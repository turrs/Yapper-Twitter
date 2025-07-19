-- Test script untuk mengecek Supabase functions
-- Jalankan ini di Supabase SQL Editor

-- 1. Test create_user function
SELECT create_user(
  'test@example.com',
  'testpass123',
  'Test User',
  'testuser'
);

-- 2. Test authenticate_user function
SELECT * FROM authenticate_user('demo@example.com', 'demo123');

-- 3. Test authenticate_user dengan user yang baru dibuat
SELECT * FROM authenticate_user('test@example.com', 'testpass123');

-- 4. Cek apakah user sudah terdaftar
SELECT id, email, full_name, username, is_active, is_verified, role 
FROM users 
WHERE email IN ('demo@example.com', 'test@example.com', 'admin@example.com')
ORDER BY created_at;

-- 5. Test create_session function
DO $$
DECLARE
  user_id UUID;
  session_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM users WHERE email = 'demo@example.com';
  
  -- Create session
  SELECT create_session(
    user_id,
    'test_token_hash_123',
    NOW() + INTERVAL '24 hours',
    'test_user_agent',
    '127.0.0.1'
  ) INTO session_id;
  
  RAISE NOTICE 'Session created with ID: %', session_id;
END $$;

-- 6. Test validate_session function
SELECT * FROM validate_session('test_token_hash_123');

-- 7. Test log_user_activity function
DO $$
DECLARE
  user_id UUID;
  log_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id FROM users WHERE email = 'demo@example.com';
  
  -- Log activity
  SELECT log_user_activity(
    user_id,
    'test_activity',
    'Test activity description',
    '{"test": "data"}'::jsonb
  ) INTO log_id;
  
  RAISE NOTICE 'Activity logged with ID: %', log_id;
END $$;

-- 8. Cek activity log
SELECT 
  u.email,
  ual.activity_type,
  ual.description,
  ual.created_at
FROM user_activity_log ual
JOIN users u ON ual.user_id = u.id
ORDER BY ual.created_at DESC
LIMIT 10;

-- 9. Cek active sessions
SELECT 
  u.email,
  us.created_at,
  us.expires_at,
  us.is_active
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
ORDER BY us.created_at DESC;

-- 10. Test cleanup function
SELECT cleanup_expired_sessions();

-- 11. Cek password hashing
SELECT 
  email,
  LENGTH(password_hash) as hash_length,
  password_hash LIKE '$2b$%' as is_bcrypt
FROM users 
WHERE email IN ('demo@example.com', 'test@example.com')
ORDER BY created_at;

-- 12. Test error cases
-- Test dengan email yang tidak ada
SELECT * FROM authenticate_user('nonexistent@example.com', 'password123');

-- Test dengan password yang salah
SELECT * FROM authenticate_user('demo@example.com', 'wrongpassword');

-- Test create_user dengan email yang sudah ada
SELECT create_user('demo@example.com', 'password123', 'Duplicate User', 'duplicate');

-- 13. Summary report
SELECT 
  'Users' as table_name,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Active Sessions' as table_name,
  COUNT(*) as count
FROM user_sessions
WHERE is_active = true
UNION ALL
SELECT 
  'Activity Logs' as table_name,
  COUNT(*) as count
FROM user_activity_log; 