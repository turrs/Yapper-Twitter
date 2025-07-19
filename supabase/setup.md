# Setup Supabase untuk Extension Authentication

## Langkah-langkah Setup

### 1. Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Buat project baru
3. Catat URL project dan Service Role Key

### 2. Jalankan SQL Schema
1. Buka Supabase Dashboard
2. Pergi ke SQL Editor
3. Copy dan paste seluruh isi file `schema.sql`
4. Jalankan query

### 3. Konfigurasi Environment Variables
Tambahkan environment variables berikut di file `.env.local`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 5. Update API Endpoints
Ganti endpoint di extension dengan yang baru:

**Login:**
- Old: `https://yapper-twitter.vercel.app/api/login`
- New: `https://yapper-twitter.vercel.app/api/login-supabase`

**Generate Comment:**
- Old: `https://yapper-twitter.vercel.app/api/ai-generate-comment`
- New: `https://yapper-twitter.vercel.app/api/ai-generate-comment-supabase`

**Logout:**
- New: `https://yapper-twitter.vercel.app/api/logout`

**Register:**
- New: `https://yapper-twitter.vercel.app/api/register`

## Struktur Database

### Tables:
1. **users** - Data user utama
2. **user_sessions** - Session management
3. **user_activity_log** - Activity tracking

### Functions:
1. **create_user()** - Membuat user baru
2. **authenticate_user()** - Validasi login
3. **create_session()** - Membuat session
4. **validate_session()** - Validasi token
5. **log_user_activity()** - Log aktivitas
6. **cleanup_expired_sessions()** - Cleanup session

## Demo Users
Setelah menjalankan schema, user demo akan tersedia:
- Email: `demo@example.com` / Password: `demo123`
- Email: `test@example.com` / Password: `test123`
- Email: `admin@example.com` / Password: `admin123`

## Security Features

✅ **Password Hashing** - Menggunakan bcrypt
✅ **Session Management** - Token dengan expiry
✅ **Activity Logging** - Track semua aktivitas
✅ **Token Validation** - Validasi setiap request
✅ **SQL Injection Protection** - Menggunakan functions
✅ **CORS Protection** - Headers yang aman

## Monitoring

### View User Activity:
```sql
SELECT 
    u.email,
    ual.activity_type,
    ual.description,
    ual.created_at
FROM user_activity_log ual
JOIN users u ON ual.user_id = u.id
ORDER BY ual.created_at DESC;
```

### View Active Sessions:
```sql
SELECT 
    u.email,
    us.created_at,
    us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
ORDER BY us.created_at DESC;
```

### Cleanup Expired Sessions:
```sql
SELECT cleanup_expired_sessions();
```

## Troubleshooting

### Error: "function does not exist"
- Pastikan semua functions di schema.sql sudah dijalankan
- Cek apakah ada error saat menjalankan SQL

### Error: "authentication failed"
- Pastikan SUPABASE_SERVICE_ROLE_KEY benar
- Cek apakah user sudah terdaftar di database

### Error: "session expired"
- Token expired setelah 24 jam
- User perlu login ulang

## Production Considerations

1. **Enable Row Level Security (RLS)** untuk keamanan tambahan
2. **Setup automated backups**
3. **Monitor database performance**
4. **Setup alerts untuk suspicious activities**
5. **Regular cleanup expired sessions** 