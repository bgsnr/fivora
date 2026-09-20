# AGENTS.md

Panduan untuk AI coding assistant (Claude Code, Cursor, Copilot, dll) saat bekerja di repo ini.

## Tentang Project

**Fivora** — Sistem Reservasi & Pelaporan Fasilitas Kampus. Aplikasi web untuk mengelola penggunaan fasilitas kampus (ruang kelas, aula, laboratorium, alat, lapangan). Pengguna bisa mengecek ketersediaan, mengajukan reservasi, dan melaporkan kerusakan fasilitas. Petugas & admin memproses kedua alur secara terpusat.

Tugas mata kuliah PPK — struktur & framework dibebaskan oleh dosen selama requirement fungsional terpenuhi.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (Postgres + Auth + Storage + RLS)
- **Validasi**: lakukan di server (Server Actions/Route Handler) DAN client — jangan andalkan client saja.

## Struktur Folder

```
/app                    → routing & pages (App Router)
  /(auth)/login
  /(auth)/register
  /dashboard
  /facilities
  /reservations
  /reports
  /api                   → route handler bila diperlukan
/components              → UI components (tampilan)
/lib
  /supabase              → client init (server & client)
  /actions                → Server Actions (logika proses)
  /validations            → skema validasi (mis. Zod), dipakai server & client
/types                   → TypeScript types (Facility, Reservation, Report, User)
/middleware.ts           → proteksi route berdasarkan role
```

Prinsip: koneksi DB, tampilan, dan logika proses harus tetap terpisah jelas — ini yang dinilai, bukan nama foldernya.

## Aktor & Role

| Role | Akses |
|---|---|
| Pengunjung | Lihat daftar fasilitas & ketersediaan (tanpa login, tanpa detail) |
| Pengguna | Login; ajukan/batalkan reservasi; lapor kerusakan; lihat riwayat sendiri |
| Petugas | Approve/reject/cancel reservasi; proses laporan; ubah status fasilitas |
| Admin | CRUD fasilitas; kelola akun petugas & pengguna; verifikasi registrasi mandiri; rekap & export |

Implementasikan otorisasi ini via **Supabase RLS**, bukan hanya pengecekan di UI.

## Aturan Bisnis — FIX dari Dosen

- Jam operasional: **07.00–20.00**, berlaku setiap hari termasuk Sabtu & Minggu (belum ada kalender hari libur khusus).
- Slot reservasi tetap **30 menit**, `start_time`/`end_time` wajib kelipatan slot dan dalam jam operasional — **validasi di server**, bukan hanya di tampilan kalender.
- Reservasi yang sudah **disetujui** tidak boleh bentrok jadwal pada fasilitas yang sama.
- Akun **petugas** hanya boleh dibuat oleh admin (tidak ada self-registration untuk petugas).

## Aturan Bisnis — Asumsi Tambahan (Sistem Fivora)

### Waktu & Durasi Reservasi
- Semua waktu di sistem pakai **WIB**.
- Reservasi boleh diajukan untuk hari yang sama atau tanggal mendatang.
- Jika reservasi di hari yang sama dengan pengajuan, `start_time` harus **lebih besar** dari waktu saat pengajuan, dibulatkan ke kelipatan 30 menit ke atas (mis. ajukan jam 10.10 → slot paling awal yang bisa dipilih 10.30).
- Reservasi harus mulai & selesai pada **tanggal yang sama** (tidak lintas hari; reservasi multi-hari = pengajuan terpisah per hari).
- Durasi minimal 30 menit, kelipatan 30 menit; satu pengajuan bisa mencakup beberapa slot berurutan (mis. 2 jam = 4 slot dalam 1 pengajuan).
- Durasi maksimal mengikuti sisa jam operasional pada tanggal tersebut.
- Tidak ada batas jumlah total reservasi per pengguna per hari.

### Fasilitas yang Dapat Dipesan
- Hanya fasilitas berstatus **aktif** dan **tidak dalam perbaikan** yang bisa direservasi.
- Satu fasilitas hanya bisa dipakai oleh **satu reservasi disetujui** pada satu waktu.
- Kapasitas fasilitas = info & kriteria pencarian saja, bukan jumlah reservasi paralel.
- Alat yang bisa dipinjam per-unit dicatat sebagai fasilitas tersendiri per unit.

### Status Reservasi & Antrean
- Status: `menunggu` → `disetujui` / `ditolak` / `dibatalkan`.
- Pengajuan `menunggu` **belum mengunci slot** — beberapa pengguna boleh mengajukan untuk fasilitas & waktu yang sama selama belum ada yang disetujui di waktu itu.
- Saat satu pengajuan disetujui, pengajuan lain yang masih `menunggu` dan waktunya bertabrakan **otomatis ditolak** (alasan: "jadwal telah terisi").
- Sistem cek ulang bentrok jadwal saat petugas approve (bukan hanya saat submit).
- Bentrok = rentang waktu **beririsan** pada fasilitas sama (08.00–10.00 bentrok dgn 09.00–11.00; 08.00–10.00 **tidak** bentrok dgn 10.00–11.00). Tidak ada jeda persiapan/pembersihan antar slot.
- Prioritas approval: **FIFO** berdasarkan waktu pengajuan — bukan berdasarkan role (mahasiswa/dosen/staf), dan tidak otomatis approve.
- Pengajuan `menunggu` yang `start_time`-nya sudah lewat **otomatis ditolak** (alasan: "waktu mulai reservasi telah terlewati").
- Berakhirnya waktu reservasi **tidak** otomatis mengubah status `disetujui` → `selesai`; cukup tampilkan label tambahan "sudah berlalu" berdasarkan tanggal/waktu.
- Reservasi `ditolak`/`dibatalkan` tetap simpan status itu meski jadwalnya sudah lewat (tidak dihapus/diubah).
- Satu pengguna tidak bisa mengajukan reservasi baru pada fasilitas & waktu yang bertabrakan dengan reservasi miliknya sendiri yang masih `menunggu`/`disetujui`.

### Pembatalan & Perubahan
- Pengguna hanya bisa membatalkan reservasi miliknya sendiri berstatus `menunggu` atau `disetujui`.
- Batas pembatalan: **paling lambat 3 jam sebelum** `start_time` (tepat 3 jam masih boleh). Tampilkan ketentuan ini sebelum submit.
- Reservasi tidak bisa **diedit** — perubahan = batalkan reservasi lama (sesuai batas di atas) lalu buat pengajuan baru (masuk antrean baru).
- Reservasi yang dibatalkan tetap tersimpan sebagai riwayat; slotnya kembali tersedia.

### Fasilitas Dalam Perbaikan (oleh Petugas)
- Ditetapkan petugas berdasarkan laporan kerusakan yang ditangani; berlaku sampai petugas mengaktifkan kembali (tidak ada estimasi tanggal selesai).
- Selama perbaikan: tidak menerima pengajuan/approval baru.
- Pengajuan `menunggu` untuk waktu mendatang → ditolak (alasan: "fasilitas dalam perbaikan").
- Reservasi `disetujui` yang sedang berlangsung/belum mulai → **dibatalkan petugas** dengan alasan. Riwayat reservasi yang sudah lewat tidak diubah.

### Fasilitas Dinonaktifkan (oleh Admin)
- Untuk menarik fasilitas dari layanan (bukan rusak, mis. tidak disewakan lagi). Tidak menghapus data terkait.
- Fasilitas nonaktif tidak menerima pengajuan/approval baru, dan tidak tampil di daftar publik (tetap terlihat lewat riwayat).
- Hanya bisa dinonaktifkan jika tidak ada reservasi mendatang berstatus `menunggu`/`disetujui` (kalau ada, tampilkan daftar untuk diselesaikan petugas dulu).
- Status aktif/nonaktif (admin) berbeda dari status perbaikan (petugas) — keduanya independen, tidak saling meng-otomatis-kan.

### Laporan Kerusakan
- Semua pengguna login (mahasiswa/dosen/staf) bisa lapor kerusakan pada fasilitas apapun, **tanpa harus pernah reservasi** fasilitas tsb.
- Field: fasilitas, kategori (peralatan/listrik/kebersihan/bangunan/lainnya), deskripsi, foto.
- Laporan **tidak bisa diedit/dihapus** oleh pengguna setelah dikirim.
- Foto: **wajib 1 foto**, format JPG/JPEG/PNG, maks **2 MB**, divalidasi client & server; hanya diakses oleh pemilik laporan + petugas/admin berwenang.
- Status: `baru` → `diproses` → `selesai` / `ditolak`. Status `selesai`/`ditolak` wajib disertai catatan petugas. Laporan yang ditutup **tidak dibuka lagi** (masalah muncul lagi = laporan baru).
- Laporan kerusakan **tidak otomatis** membuat fasilitas berstatus "dalam perbaikan" — petugas yang menentukan.
- Laporan duplikat (kejadian sama): petugas pilih 1 laporan utama diproses, sisanya ditolak dengan catatan merujuk ke laporan utama. Selesainya satu laporan tidak otomatis mengakhiri status perbaikan jika masih ada kerusakan lain yang menghambat.

### Registrasi & Otorisasi
- Self-registration hanya untuk role **pengguna** (mahasiswa/dosen/staf); publik tidak bisa pilih role petugas/admin.
- Akun hasil self-registration: status `menunggu verifikasi`, belum bisa login; admin approve/reject.
- Akun yang dibuat langsung oleh admin (petugas & pengguna): langsung `aktif`.
- Akun admin awal disiapkan via data awal sistem (seed), bukan registrasi publik.
- Satu email = satu akun.
- **Batas kewenangan**: admin **tidak** bisa approve reservasi/proses laporan (khusus petugas); petugas **tidak** bisa kelola akun atau ubah data master fasilitas (khusus admin); pengguna hanya akses reservasi/laporan miliknya sendiri.

### Rekap & Ekspor (Admin)
- **Okupansi** = (jumlah slot reservasi `disetujui` ÷ jumlah slot operasional standar) × 100%, dihitung per rentang tanggal pilihan admin. 1 hari = **26 slot** (30 menit/slot, 07.00–20.00). Reservasi `menunggu`/`ditolak`/`dibatalkan` tidak dihitung. Jika tidak ada slot operasional pada periode → tampil "tidak ada data"; 0% hanya jika slot tersedia tapi tidak ada reservasi disetujui.
- **Frekuensi kerusakan** = jumlah laporan valid berstatus `diproses`/`selesai` (bukan `baru`/`ditolak`), dikelompokkan per fasilitas & lokasi, berdasar tanggal pengajuan dalam periode rekap.
- Ekspor format: **CSV/Excel/PDF**, mengikuti filter & periode yang dipilih admin.

### Penyimpanan Riwayat
- Reservasi & laporan yang sudah diproses **tidak dihapus**.
- Sistem simpan: waktu pengajuan, petugas yang memproses, alasan penolakan/pembatalan, atau catatan resolusi.
- Siapkan **data contoh & akun demo** untuk tiap role agar seluruh alur bisa didemokan saat presentasi.

## Skema Data (Diperluas)

- `facilities`: nama, tipe, lokasi, kapasitas, deskripsi, `status` (`aktif` / `nonaktif` / `dalam_perbaikan`)
- `users`: nama, email (unik), password, `role` (`pengguna` / `petugas` / `admin`), `status_akun` (`menunggu_verifikasi` / `aktif` / `ditolak`)
- `reservations`: pemesan (user), fasilitas, tanggal, `start_time`, `end_time`, tujuan, `status` (`menunggu` / `disetujui` / `ditolak` / `dibatalkan`), alasan (jika ditolak/dibatalkan), waktu pengajuan, petugas yang memproses
- `reports`: pelapor (user), fasilitas, kategori, deskripsi, foto_url, `status` (`baru` / `diproses` / `selesai` / `ditolak`), catatan_petugas, laporan_utama_id (untuk duplikat), waktu pengajuan, petugas yang memproses

> Pertimbangkan constraint `EXCLUDE` (Postgres, via ekstensi `btree_gist`) di `reservations` untuk mencegah overlap slot pada fasilitas yang sama secara langsung di level DB, sebagai lapisan tambahan selain validasi di Server Action.

## Konvensi Kode

- Bahasa: TypeScript.
- Commit message jelas & deskriptif — semua anggota tim wajib commit sendiri (dinilai per kontribusi).
- Jangan taruh logic query Supabase langsung di komponen UI — lewat `/lib/actions`.

## Deliverable

- Deadline: **11 Oktober 2026, 12.00 WIB**, via Kulon.
- Satu file Word berisi: identitas tim, pembagian tugas, link Google Drive (source code + SQL), panduan setting, kredensial login tiap role, screenshot + penjelasan fitur.
- Presentasi UTS: 10 menit presentasi + 10–15 menit tanya jawab.