# Penyimpanan laporan dan reservasi

Laporan Selesai atau Ditolak disimpan sampai tiga bulan kalender setelah ditutup. Laporan Baru dan Diproses tetap disimpan. Reservasi disimpan sampai tiga bulan kalender setelah tanggal dan jam berakhir pada jadwalnya, termasuk reservasi yang ditolak atau dibatalkan. Semua tanggal dihitung dalam WIB.

Contoh: laporan ditutup 10 Oktober 2026 pukul 20.00 WIB kedaluwarsa 10 Januari 2027 pukul 20.00 WIB. Jadwal reservasi berakhir 12 Oktober 2026 pukul 15.00 WIB kedaluwarsa 12 Januari 2027 pukul 15.00 WIB. Jika tanggal tujuan tidak ada, dipakai hari terakhir bulan itu: 30 November menjadi 28 Februari, atau 29 Februari pada tahun kabisat.

Penghapusan mencakup laporan, foto, catatan perkembangan, kegiatan perbaikan yang sudah selesai, serta catatan pemeriksaannya. Akun dan daftar fasilitas tidak dihapus. Laporan duplikat yang belum kedaluwarsa tetap ada; referensi ke laporan utama yang telah dihapus menjadi kosong.

## Pemasangan

Jalankan semua perintah PowerShell dari D:\Pemrograman\PPK\fivora. Paket tidak melakukan commit atau push dan tidak mengubah data Supabase saat pasang.ps1 dijalankan.

1. Buat branch dari pekerjaan terakhir yang sudah disimpan:

```powershell
git switch -c feat/data-retention
```

2. Unduh fivora-retensi-data.zip ke Downloads, lalu ekstrak:

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\fivora-retensi-data.zip" -DestinationPath "$env:TEMP\fivora-retensi-data" -Force
```

3. Pasang file proyek:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\fivora-retensi-data\pasang.ps1"
```

4. Buka migration baru:

```powershell
notepad 'supabase\migrations\20261010000002_three_month_data_retention.sql'
```

Di Notepad tekan Ctrl+A lalu Ctrl+C. Buka proyek Supabase yang dipakai Fivora, pilih SQL Editor, buat query baru bernama **Retensi Data 3 Bulan**, tempel seluruh SQL, lalu klik Run. Ini menyiapkan tenggat dan antrean; penghapusan otomatis masih dinonaktifkan. Jika muncul error relasi tambahan, kirim teks errornya. Jangan menghapus constraint lain untuk melewatinya.

5. Masuk ke akun Supabase yang punya akses proyek:

```powershell
npx supabase login
```

Ikuti login yang dibuka CLI. Jika akunmu tidak punya akses, pemilik proyek menjalankan langkah deploy ini.

6. Pasang worker dan buat SQL aktivasi:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File '.\scripts\setup-retention.ps1'
```

Script membaca URL proyek dari .env.local, memasang satu secret dan Edge Function bernama cleanup-retention, lalu mengecek jumlah data melalui dry-run. Tidak memerlukan Docker. File activate-retention.sql akan terbuka di Notepad. File ini dibuat di folder TEMP, bukan di repo, karena berisi token.

7. Di Notepad tekan Ctrl+A lalu Ctrl+C. Di Supabase SQL Editor buat query baru bernama **Aktifkan Retensi Data 3 Bulan**, tempel isinya, lalu Run. Hasilnya harus menunjukkan enabled: true dan job fivora-retention-cleanup dengan active: true. Data lama yang sudah melewati tenggat akan ikut dihapus pada jadwal berikutnya.

8. Setelah lima menit, buka query pemeriksaan:

```powershell
notepad 'supabase\retention\check-retention.sql'
```

Salin seluruh isinya ke query Supabase bernama **Cek Retensi Data 3 Bulan**, lalu Run. Periksa HTTP status_code 200 selain status cron succeeded. Jika ada data yang belum dibersihkan, jumlah reports_due/reservations_due/photos_waiting akan turun pada pemanggilan berikutnya. blocked_open_maintenance harus 0; angka lebih dari 0 berarti ada data lama yang tidak konsisten dan perlu diperiksa.

9. Verifikasi build lokal:

```powershell
npm run build
```

## Cara kerja dan batas praktis

Supabase Cron memanggil worker setiap lima menit. SELECT dengan akun biasa tidak menampilkan data yang kedaluwarsa sejak tenggatnya. Penghapusan fisik mengikuti jadwal; foto yang gagal dihapus dicoba lagi. Rekap admin tidak lagi menghitung data setelah penghapusan, sehingga rekap bukan arsip permanen.

Tidak ada penghapusan dari browser pengguna. Worker memerlukan token khusus, sedangkan fungsi database hanya dapat dipanggil oleh service_role. Foto diproses melalui Supabase Storage API. Antrean foto dicatat dalam transaksi penghapusan laporan, sehingga kegagalan jaringan tidak membuat lokasi foto terlupakan. Batch membatasi beban; jika ada banyak data lama, beberapa pemanggilan mungkin diperlukan.

Kebijakan ini mencakup database dan Storage aktif. Jadwal yang tidak berjalan, proyek yang sedang dipause, serta kegagalan layanan dapat menunda penghapusan fisik. Backup yang dikelola Supabase mengikuti masa simpan layanan tersebut.

Untuk menghentikan penghapusan berikutnya, jalankan supabase/retention/pause-retention.sql melalui SQL Editor. Ini tidak mengembalikan data yang sudah dihapus dan tidak mengubah filter visibilitas.

## File SQL

- Migration: supabase/migrations/20261010000002_three_month_data_retention.sql
- Templat aktivasi tanpa token: supabase/retention/activate-retention.template.sql (jangan dijalankan mentah)
- Aktivasi siap dijalankan: %TEMP%/fivora-retention-setup/activate-retention.sql, dibuat script setup
- Pemeriksaan: supabase/retention/check-retention.sql
- Penghentian: supabase/retention/pause-retention.sql

## Pemeriksaan pengembangan

SQL sudah diuji dalam PostgreSQL terisolasi: hitungan kalender/WIB/akhir bulan/tahun kabisat, pencatatan waktu penutupan, akses RLS, data aktif yang tetap disimpan, penghapusan catatan terkait, pelepasan referensi duplikat, antrean foto dan percobaan ulang, serta pengulangan migration dan cleanup. Handler diuji untuk token, dry-run, konfigurasi nonaktif, kegagalan database/Storage, dan urutan penghapusan foto sebelum konfirmasi antrean. Build Next.js juga diperiksa dengan data tiruan, bukan database produksi.

Aktivasi Cron dan Edge Function di proyek Supabase sebenarnya tetap harus diverifikasi dengan query pemeriksaan setelah deployment.

Referensi:
- https://supabase.com/docs/guides/functions/schedule-functions
- https://supabase.com/docs/guides/storage/management/delete-objects
- https://supabase.com/docs/guides/database/vault
- https://supabase.com/docs/reference/cli/supabase-functions-deploy
