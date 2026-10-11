# Fivora - Sistem Reservasi dan Pelaporan Fasilitas Kampus

Fivora adalah aplikasi web berbasis Next.js untuk membantu civitas akademika Universitas Diponegoro dalam melihat ketersediaan fasilitas kampus, mengajukan reservasi, melaporkan kerusakan fasilitas, serta memantau proses perbaikan. Aplikasi ini juga menyediakan fitur pengelolaan fasilitas dan rekap okupansi serta frekuensi laporan kerusakan bagi admin.

## Fitur Utama

### 1. Pengunjung
- Melihat daftar dan detail fasilitas kampus tanpa login.
- Mencari fasilitas berdasarkan nama, tipe, lokasi, dan kapasitas.
- Melihat ketersediaan fasilitas berdasarkan slot waktu.
- Melihat informasi status fasilitas tanpa menampilkan identitas pemesan atau tujuan penggunaan reservasi.

### 2. Pengguna
Pengguna terdiri dari mahasiswa, dosen, dan staf yang telah memiliki akun aktif.

- Registrasi menggunakan email kampus sesuai ketentuan aplikasi.
- Login dan logout.
- Melihat pesan apabila akun masih menunggu verifikasi atau telah ditolak.
- Mengajukan reservasi dengan memilih fasilitas, tanggal, waktu mulai, waktu selesai, dan tujuan penggunaan.
- Melihat detail, status, dan riwayat reservasi sendiri.
- Membatalkan reservasi sendiri sesuai batas waktu yang berlaku.
- Melaporkan kerusakan fasilitas dengan kategori, deskripsi, dan foto.
- Melihat detail dan perkembangan status laporan kerusakan sendiri.

### 3. Petugas
- Melihat antrean reservasi dan laporan kerusakan.
- Menyetujui atau menolak pengajuan reservasi.
- Memberikan alasan penolakan atau pembatalan reservasi dalam kondisi mendesak.
- Melihat detail laporan dan foto kerusakan.
- Mengubah status laporan menjadi diproses, selesai, atau ditolak.
- Memberikan catatan penanganan dan resolusi laporan.
- Menandai laporan duplikat.
- Menetapkan fasilitas dalam perbaikan dan mengaktifkannya kembali setelah dinyatakan layak digunakan.

### 4. Admin
- Melihat daftar akun dan pendaftaran pengguna yang menunggu verifikasi.
- Menyetujui atau menolak registrasi mandiri pengguna.
- Membuat akun pengguna dan petugas secara langsung.
- Melihat daftar akun.
- Menambah, mengedit, dan menonaktifkan fasilitas.
- Melihat reservasi yang harus diselesaikan sebelum fasilitas dinonaktifkan.
- Melihat rekap okupansi fasilitas dan frekuensi laporan kerusakan.
- Memfilter rekap berdasarkan rentang tanggal, fasilitas, dan lokasi.
- Mengekspor hasil rekap ke format CSV, Excel, dan PDF.

## Teknologi yang Digunakan

- **Frontend dan server:** Next.js dengan App Router, React, TypeScript.
- **Styling:** Tailwind CSS dan CSS Modules.
- **Database:** Supabase PostgreSQL.
- **Autentikasi:** Supabase Auth.
- **Penyimpanan foto:** Supabase Storage.
- **Keamanan data:** Row Level Security (RLS) dan validasi sisi server.
- **Validasi input:** Zod dan validasi tambahan pada server.
- **Ekspor laporan:** XLSX dan jsPDF.

## Persyaratan Sistem

Sebelum menjalankan aplikasi, pastikan perangkat memiliki:

- Node.js versi 20.9 atau lebih baru.
- npm.
- Git.
- Proyek Supabase yang telah dikonfigurasi.
- Supabase CLI apabila diperlukan untuk mengelola migrasi database.

## Cara Menjalankan Aplikasi

### 1. Mengambil Source Code

Clone repository berikut:

```bash
git clone https://github.com/bgsnr/fivora.git
cd fivora
```

Apabila menggunakan branch pengembangan tertentu, pindah ke branch yang sesuai sebelum melanjutkan.

### 2. Menginstal Dependency

Jalankan perintah:

```bash
npm install
```

Perintah ini menginstal dependency yang dibutuhkan oleh aplikasi sesuai konfigurasi `package.json`.

### 3. Konfigurasi Environment Variable

Buat file `.env.local` di direktori utama proyek.

Isi dengan variabel berikut menggunakan nilai dari proyek Supabase yang digunakan:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
```

Keterangan:

| Variabel | Kegunaan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci publik yang digunakan untuk koneksi Supabase sesuai kebijakan akses. |
| `SUPABASE_SECRET_KEY` | Kunci rahasia untuk operasi administratif di server. |

Ganti seluruh nilai placeholder dengan konfigurasi proyek Supabase yang benar.

**Penting:** jangan mengunggah `.env.local`, password database, secret key, atau kredensial rahasia ke GitHub. Gunakan `.env.example` tanpa kredensial asli apabila ingin mendokumentasikan variabel yang dibutuhkan.

### 4. Menyiapkan Database Supabase

Aplikasi membutuhkan tabel, fungsi, trigger, constraint, dan kebijakan RLS yang didefinisikan dalam direktori `supabase/migrations/`.

Untuk menyiapkan database, periksa seluruh file migrasi dan pastikan urutannya benar. Jika diperlukan, tautkan proyek lokal dengan Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
```

Ganti `YOUR_PROJECT_REF` dengan project reference Supabase yang digunakan.

**Perhatian:** database yang sudah dipakai atau telah dimodifikasi secara manual harus diperiksa dan diselaraskan dengan riwayat migrasi sebelum menjalankan migrasi melalui CLI. Jangan langsung menjalankan `npx supabase db push` pada database yang sudah berisi data sebelum memastikan migrasi yang tertunda aman diterapkan.

### 5. Menyiapkan Supabase Storage

Fitur pelaporan kerusakan membutuhkan penyimpanan foto laporan.

Pastikan bucket bernama `report-photos` tersedia di Supabase Storage dan dikonfigurasi sebagai bucket privat. Akses foto harus mengikuti pemeriksaan autentikasi dan kewenangan yang diterapkan oleh aplikasi.

### 6. Menyiapkan Akun Pengguna, Petugas, dan Admin

Registrasi mandiri ditujukan untuk pengguna mahasiswa, dosen, dan staf. Akun hasil registrasi memiliki status menunggu verifikasi sebelum dapat digunakan.

Pendaftaran publik menentukan jenis pengguna berdasarkan domain email:

- `@students.undip.ac.id` untuk mahasiswa.
- `@lecturer.undip.ac.id` untuk dosen.
- `@staff.undip.ac.id` untuk staf.

Admin dapat menyetujui atau menolak pendaftaran pengguna. Admin juga dapat membuat akun pengguna dan petugas secara langsung sesuai kewenangannya.

Akun admin awal harus disiapkan melalui mekanisme administratif yang tepercaya, bukan melalui registrasi publik.

Kredensial akun demo untuk pengguna, petugas, dan admin disediakan secara terpisah dalam dokumentasi pengujian kelompok. Jangan menyimpan password asli dalam repository.

### 7. Menjalankan Aplikasi

Setelah dependency dan environment variable siap, jalankan server pengembangan:

```bash
npm run dev
```

Buka URL yang muncul di terminal, biasanya:

http://localhost:3000

Jika port tersebut sedang digunakan, Next.js dapat menggunakan port lain. Gunakan URL yang ditampilkan pada terminal.

## Perintah Pengembangan

Menjalankan server pengembangan:

```bash
npm run dev
```

Membuat build production:

```bash
npm run build
```

Menjalankan aplikasi dalam mode production setelah build:

```bash
npm run start
```

Menjalankan pemeriksaan ESLint:

```bash
npm run lint
```

Project juga menyediakan skrip pengujian per bab melalui perintah `npm run test:chapter-02` hingga `npm run test:chapter-12`, serta perintah `npm test` untuk menjalankan rangkaian yang didefinisikan dalam `package.json`. Pengujian membutuhkan konfigurasi environment dan database pengujian yang sesuai.

## Struktur Direktori

```text
fivora/
├── app/                 # Halaman, route, dan API aplikasi
├── components/          # Komponen antarmuka
├── lib/                 # Logika bisnis, koneksi, dan utilitas
│   ├── actions/         # Server actions
│   ├── supabase/        # Client Supabase
│   └── validations/     # Validasi input
├── public/              # Logo, gambar, dan aset statis
├── types/               # Definisi tipe TypeScript
├── supabase/
│   ├── migrations/      # Migrasi database
│   ├── functions/       # Supabase Edge Functions
│   ├── retention/       # Skrip terkait kebijakan retensi
│   ├── seeds/           # Data pendukung
│   ├── seed.sql         # Data awal
│   └── config.toml      # Konfigurasi Supabase
├── tests/               # Skrip pengujian
├── package.json         # Dependency dan perintah npm
├── package-lock.json    # Lockfile dependency
└── README.md            # Dokumentasi proyek
```

## Informasi Pengujian dan Data Demo

Data contoh digunakan untuk membantu pengujian alur reservasi, pemrosesan petugas, pelaporan kerusakan, pengelolaan fasilitas, dan rekap.

Sebelum melakukan demonstrasi atau mengatur database baru, pastikan:

- Seluruh migrasi yang diperlukan telah diterapkan dengan urutan yang benar.
- Akun demo memiliki akun Supabase Auth dan profil yang saling terhubung.
- Data contoh memenuhi constraint database.
- Foto contoh tersedia pada bucket Storage yang sesuai.
- Akun dengan role berbeda telah diuji untuk memastikan pembatasan akses berjalan benar.

Data awal dalam `supabase/seed.sql` perlu diperiksa kesesuaiannya dengan konfigurasi akun Auth serta struktur database target sebelum digunakan.

## Tujuan Pengembangan

Fivora dikembangkan sebagai proyek akademik untuk menyediakan sistem reservasi dan pelaporan fasilitas kampus yang terintegrasi. Sistem ini diharapkan membantu pengguna memperoleh informasi ketersediaan fasilitas, mempermudah proses reservasi, mendukung pelaporan kerusakan, serta membantu pengelola dalam memantau kondisi fasilitas dan penggunaan layanan.
