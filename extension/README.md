# Twitter Comment Helper Extension

Extension untuk membantu generate komentar Twitter secara otomatis dengan sistem login.

## Fitur

- 🔐 Sistem login untuk keamanan
- 🤖 Generate komentar otomatis menggunakan AI
- 📝 Auto-fill komentar ke kolom reply Twitter
- 🎨 UI yang modern dan user-friendly

## Cara Penggunaan

### 1. Login
- Klik icon extension di browser
- Masukkan email dan password
- Email demo: `demo@example.com` / Password: `demo123`
- Email demo: `test@example.com` / Password: `test123`

### 2. Generate Comment
- Buka Twitter (x.com)
- Buka tweet yang ingin di-reply
- Klik tombol "Generate Comment" yang muncul di kolom reply
- Atau gunakan popup extension untuk generate comment

### 3. Auto-fill
- Setelah comment di-generate, klik "Isi ke Kolom Komentar"
- Comment akan otomatis terisi di kolom reply

## Instalasi

1. Download atau clone repository ini
2. Buka Chrome Extensions (chrome://extensions/)
3. Aktifkan "Developer mode"
4. Klik "Load unpacked"
5. Pilih folder `extension` dari project ini

## Keamanan

- Extension memerlukan login sebelum dapat digunakan
- Token authentication untuk setiap request ke backend
- Session timeout setelah 24 jam
- Logout otomatis jika token expired

## Backend API

Extension menggunakan backend API yang terpisah:
- Login: `POST /api/login`
- Generate Comment: `POST /api/ai-generate-comment`

## Troubleshooting

- Jika extension tidak muncul di Twitter, refresh halaman
- Jika login gagal, pastikan backend API berjalan
- Jika comment tidak ter-generate, cek koneksi internet

## Development

Untuk development, pastikan backend API berjalan di `https://yapper-twitter.vercel.app/` 