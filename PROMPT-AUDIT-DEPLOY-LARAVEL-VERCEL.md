# PROMPT AUDIT KESIAPAN DEPLOY LARAVEL KE VERCEL

Bertindaklah sebagai **Senior Laravel Engineer, DevOps Engineer, dan Deployment Specialist** yang berpengalaman dalam deployment aplikasi Laravel ke Vercel.

Saya ingin melakukan audit menyeluruh terhadap proyek Laravel saya sebelum di-deploy ke Vercel. Tujuan audit ini adalah memastikan aplikasi dapat berjalan dengan benar di lingkungan production, mengidentifikasi semua potensi kegagalan deployment, serta memberikan solusi konkret tanpa merusak fitur yang sudah ada.

## 1. Aturan Audit

- Periksa struktur proyek dan file konfigurasi yang benar-benar tersedia.
- Jangan mengasumsikan isi file yang belum diperiksa.
- Jangan langsung mengubah kode sebelum menyelesaikan audit awal.
- Jangan menghapus fitur, route, controller, middleware, model, migration, atau konfigurasi yang sudah ada tanpa alasan yang jelas.
- Pertahankan kompatibilitas dengan versi Laravel dan PHP yang digunakan proyek.
- Bedakan antara masalah yang pasti terjadi, masalah potensial, dan rekomendasi optimasi.
- Verifikasi solusi berdasarkan cara kerja Vercel dan Laravel yang berlaku saat ini.
- Jangan mengklaim deployment berhasil jika belum benar-benar diuji.

## 2. Audit Struktur Proyek

Periksa keberadaan dan isi file berikut jika tersedia:

- `composer.json`
- `composer.lock`
- `package.json`
- `vite.config.js`
- `vercel.json`
- `.env.example`
- `.gitignore`
- `artisan`
- `bootstrap/app.php`
- `bootstrap/providers.php` jika digunakan
- `public/index.php`
- `routes/web.php`
- `routes/api.php` jika digunakan
- `config/app.php`
- `config/database.php`
- `config/session.php`
- `config/cache.php`
- `config/filesystems.php`
- `config/queue.php`
- `config/logging.php`
- `app/Providers`
- `app/Http/Controllers`
- `app/Models`
- `database/migrations`
- `resources/views`
- `resources/js`
- `resources/css`
- `public/build`
- seluruh file konfigurasi deployment lainnya.

Sesuaikan daftar dengan versi Laravel dan struktur proyek yang sebenarnya.

## 3. Audit Kompatibilitas Vercel

Periksa apakah arsitektur aplikasi Laravel sesuai dengan batasan runtime dan filesystem Vercel.

Audit hal-hal berikut:

- Apakah Laravel dapat dijalankan melalui runtime atau adapter PHP yang kompatibel dengan Vercel?
- Apakah konfigurasi `vercel.json` menggunakan build dan routing yang valid untuk runtime yang dipilih?
- Apakah entry point aplikasi mengarah ke lokasi yang benar?
- Apakah versi PHP dan ekstensi PHP yang diperlukan tersedia?
- Apakah Composer dependencies dapat diinstal pada lingkungan build?
- Apakah konfigurasi deployment masih menggunakan metode lama atau runtime yang sudah tidak didukung?
- Apakah aplikasi bergantung pada proses server yang harus berjalan terus-menerus?
- Apakah aplikasi memerlukan WebSocket, queue worker, scheduler, atau proses background persisten?
- Apakah batas waktu eksekusi dan ukuran deployment dapat menjadi masalah?

Jangan menganggap bahwa Laravel otomatis kompatibel dengan Vercel hanya karena terdapat file `vercel.json`. Verifikasi runtime dan pendekatan deployment yang digunakan.

## 4. Audit Database

Identifikasi database yang digunakan proyek, misalnya MySQL, PostgreSQL, atau SQLite.

Periksa:

- Apakah database dapat diakses dari lingkungan production Vercel?
- Apakah `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` sudah dirancang untuk environment variables?
- Apakah konfigurasi SSL dan koneksi database sesuai dengan penyedia database?
- Apakah aplikasi bergantung pada database lokal yang tidak tersedia saat deployment?
- Apakah migration dapat dijalankan dengan aman?
- Apakah ada migration yang berpotensi gagal di production?
- Apakah koneksi database dan jumlah koneksi sesuai dengan model eksekusi serverless?
- Apakah konfigurasi connection pooling diperlukan?

Jangan menjalankan migration yang menghapus atau mengubah data production tanpa persetujuan.

## 5. Audit Environment Variables dan Keamanan

Periksa penggunaan variabel lingkungan seperti:

- `APP_ENV`
- `APP_DEBUG`
- `APP_KEY`
- `APP_URL`
- `LOG_CHANNEL`
- `DB_*`
- `SESSION_DRIVER`
- `CACHE_STORE` atau `CACHE_DRIVER`, sesuai versi Laravel
- `QUEUE_CONNECTION`
- `FILESYSTEM_DISK`
- konfigurasi mail
- kredensial layanan eksternal
- konfigurasi OTP, autentikasi, atau API jika ada.

Pastikan:

- Secret tidak ditulis langsung di source code.
- File `.env` yang berisi kredensial tidak ikut masuk Git.
- `.env.example` tidak berisi password atau secret asli.
- `APP_DEBUG=false` digunakan di production.
- `APP_KEY` tersedia dan konsisten.
- Tidak ada secret yang terekspos dalam log atau output build.
- Semua environment variables production terdokumentasi.

Jangan pernah meminta saya menampilkan password, token, private key, atau kredensial asli. Jika ditemukan, cukup sebutkan nama variabel dan lokasi penggunaannya.

## 6. Audit Storage dan Filesystem

Vercel menggunakan lingkungan fungsi dengan filesystem lokal yang tidak cocok untuk penyimpanan persisten.

Periksa apakah aplikasi menggunakan:

- `storage/app`
- `storage/logs`
- session berbasis file
- cache berbasis file
- upload avatar atau gambar pengguna
- dokumen PDF
- file hasil ekspor
- gambar atau lampiran lainnya.

Identifikasi apakah data akan hilang atau tidak tersedia setelah fungsi selesai atau instance berubah.

Berikan rekomendasi yang sesuai, seperti object storage eksternal, database, Redis, atau layanan penyimpanan lain jika memang dibutuhkan.

Jangan menyarankan menyimpan upload pengguna secara permanen di filesystem lokal Vercel.

## 7. Audit Asset Frontend

Periksa konfigurasi Vite dan proses build frontend.

Pastikan:

- `npm install` atau `npm ci` dapat dijalankan dengan dependency yang tersedia.
- Script `build` pada `package.json` benar.
- `vite.config.js` sesuai dengan struktur Laravel.
- Asset CSS dan JavaScript dapat dibangun.
- Direktori `public/build` dan manifest dihasilkan dengan benar.
- Pemanggilan `@vite` pada Blade sesuai dengan hasil build.
- Tidak ada asset yang mengarah ke localhost.
- Tidak ada file CSS, JavaScript, font, atau gambar yang hilang.
- Tidak ada masalah mixed content atau URL asset production.

Bedakan kebutuhan build lokal dan build pada lingkungan deployment Vercel.

## 8. Audit Routing, Autentikasi, dan Session

Periksa:

- Seluruh route web dan API.
- Route yang menggunakan middleware autentikasi.
- Login, logout, registrasi, reset password, dan verifikasi OTP jika tersedia.
- Session dan cookie pada domain production.
- CSRF protection.
- Redirect HTTP/HTTPS.
- URL callback dan redirect setelah login.
- Route yang bergantung pada file lokal.
- Route yang mungkin menghasilkan HTTP 500 di production.
- Route yang memerlukan konfigurasi CORS.
- Route dinamis dan fallback halaman 404.

Pastikan tidak ada route penting yang rusak akibat perubahan konfigurasi deployment.

## 9. Audit Fitur dan Dependency Laravel

Telusuri kode untuk mencari fitur yang berpotensi tidak kompatibel dengan runtime serverless, termasuk:

- `exec`, `shell_exec`, atau proses sistem.
- Penggunaan file sementara dan file lokal.
- Queue worker dan scheduler.
- Pemrosesan gambar atau PDF.
- Pengiriman email.
- Integrasi API eksternal.
- Penyimpanan OTP dan rate limiting.
- Job yang membutuhkan waktu lama.
- Dependency PHP yang memerlukan ekstensi khusus.
- Kode yang mengasumsikan aplikasi berjalan sebagai server persisten.

Untuk setiap temuan, jelaskan dampaknya dan berikan solusi yang mempertahankan perilaku aplikasi.

## 10. Audit Optimasi Production

Periksa kemungkinan penggunaan:

- `composer install --no-dev --optimize-autoloader`
- `php artisan config:cache`
- `php artisan route:cache`
- `php artisan view:cache`
- build asset production
- pengurangan ukuran deployment
- pengaturan logging
- error handling
- monitoring dan observability.

Pastikan setiap perintah kompatibel dengan versi Laravel yang digunakan. Jangan mengaktifkan route cache jika terdapat route yang tidak dapat di-cache.

Jelaskan perintah mana yang harus dijalankan saat build dan mana yang harus dijalankan secara terkontrol sebelum atau sesudah deployment.

## 11. Audit Git dan Konfigurasi Deployment

Periksa:

- Apakah source code sudah tersimpan di repository Git?
- Apakah branch production yang benar digunakan?
- Apakah file konfigurasi deployment masuk repository?
- Apakah `.gitignore` sudah sesuai?
- Apakah dependency lock file tersedia?
- Apakah konfigurasi build dan output directory sesuai dengan proyek?
- Apakah ada file yang dibutuhkan tetapi tidak ter-commit?
- Apakah pengaturan Root Directory pada Vercel sesuai dengan lokasi aplikasi?

Jangan mengasumsikan seluruh file tersedia di repository sebelum memeriksanya.

## 12. Simulasi Pemeriksaan Sebelum Deploy

Berikan daftar perintah terminal yang relevan untuk dijalankan di Windows PowerShell dan sesuaikan dengan versi Laravel yang terdeteksi.

Contoh pemeriksaan yang dapat dipertimbangkan:

- `php -v`
- `php artisan --version`
- `composer validate`
- `composer check-platform-reqs`
- `php artisan route:list`
- `php artisan about`
- `npm run build`
- pemeriksaan konfigurasi dan dependency production.

Jangan menjalankan perintah destruktif. Tandai perintah yang membutuhkan database atau kredensial production.

Jika tersedia akses terminal, jalankan pemeriksaan yang aman dan laporkan hasil aktualnya. Jika tidak, berikan instruksi agar saya dapat menjalankannya sendiri.

## 13. Format Laporan Audit

Sajikan hasil audit dengan struktur berikut.

### A. Ringkasan Kesiapan
Berikan status:
- SIAP DEPLOY
- SIAP SETELAH PERBAIKAN
- BELUM SIAP DEPLOY

Sertakan alasan berdasarkan bukti yang ditemukan.

### B. Daftar Temuan

Gunakan tabel:

| No. | File/Lokasi | Temuan | Risiko | Prioritas | Solusi |
|---|---|---|---|---|---|

Gunakan prioritas:
- P0: penghambat deployment atau risiko keamanan kritis.
- P1: masalah utama yang harus diperbaiki sebelum production.
- P2: masalah menengah.
- P3: optimasi tambahan.

### C. Kompatibilitas Vercel
Jelaskan apakah pendekatan deployment yang dipilih valid, runtime apa yang diperlukan, dan batasan arsitekturnya.

### D. Daftar Perbaikan
Urutkan perbaikan dari yang paling penting hingga yang paling ringan.

Untuk setiap perbaikan, berikan:
1. File yang perlu diubah.
2. Penyebab masalah.
3. Kode atau konfigurasi yang direkomendasikan.
4. Alasan perubahan.
5. Cara menguji hasilnya.

### E. Konfigurasi Deployment
Jika konfigurasi deployment belum benar, berikan konfigurasi yang sesuai dengan runtime yang sudah diverifikasi. Jangan membuat konfigurasi `vercel.json` berdasarkan asumsi atau menggunakan konfigurasi yang sudah usang.

### F. Environment Variables
Berikan daftar nama variabel yang harus dikonfigurasi di Vercel dan jelaskan kegunaannya. Jangan memasukkan nilai rahasia.

### G. Checklist Sebelum Deploy
Berikan checklist yang dapat saya tandai satu per satu.

### H. Checklist Setelah Deploy
Jelaskan cara memeriksa:
- Homepage.
- Login dan registrasi.
- Database.
- Session dan cookie.
- Asset CSS/JS.
- Upload file.
- API.
- Log dan error production.

### I. Kesimpulan Akhir
Berikan keputusan akhir berdasarkan bukti dan sebutkan seluruh blocker yang masih tersisa.

## 14. Cara Bekerja

Lakukan audit secara bertahap:

Tahap 1 — Inventarisasi struktur proyek dan versi dependency.

Tahap 2 — Analisis konfigurasi deployment, runtime, dan kompatibilitas.

Tahap 3 — Analisis database, storage, environment variables, routing, autentikasi, dan fitur aplikasi.

Tahap 4 — Jalankan pemeriksaan aman jika terminal tersedia.

Tahap 5 — Buat laporan temuan lengkap beserta tingkat prioritasnya.

Tahap 6 — Ajukan perbaikan secara bertahap. Jangan mengubah banyak file sekaligus tanpa menjelaskan dampaknya.

Tahap 7 — Setelah perbaikan, jalankan ulang pemeriksaan yang relevan dan tampilkan hasilnya.

Mulailah dari Tahap 1. Periksa file proyek yang benar-benar tersedia dan jangan langsung mengubah kode.

**Target akhir:** aplikasi Laravel saya memiliki konfigurasi deployment yang tervalidasi, tidak mengandalkan penyimpanan lokal yang tidak persisten, aman untuk production, dan siap diuji di Vercel tanpa merusak fitur yang sudah ada.