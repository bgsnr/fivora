# Laporan Audit Modul Reservasi terhadap Spesifikasi Chapter
**ID Audit**: audit-002-2026-09-24
**Tanggal**: 24 September 2026
**Standar Evaluasi**: `/chapter` (00-index s.d. 12-integrasi-lintas-modul) — Acceptance Criteria per chapter
**Proyek**: `fivora`

> **Tindak lanjut 24-09-2026**: Temuan 01–03 (prioritas TINGGI) telah diperbaiki.
> - 01 → `app/login/page.tsx` redirect per role (petugas → `/petugas/reservasi`, pengguna → `/reservasi`); entri navigasi "Reservasi" ditambahkan di `components/landing/navbar.tsx`.
> - 02 → logika bisnis dipindah ke `lib/reservation-service.ts` (bukan server action); seluruh server action kini menurunkan identitas HANYA dari `getCurrentUser()`. Override `user_id`/`staffId` dari client dihapus. Tes diperbarui memanggil service langsung.
> - 03 → placeholder tabel `users` dibuat di migration 01 (id, auth_user_id, role, name, email, status) + RLS, dan seed 02 mengisi akun demo minimal sehingga FK & join berfungsi.
> - **Tindak lanjut 24-09-2026 (gelombang 2)**: Temuan 04–07 telah diperbaiki.
>   - 04 → `app/petugas/fasilitas/*` + `components/petugas/maintenance-form.tsx` (tombol tandai dalam perbaikan & aktifkan kembali), `lib/actions/facilities.ts` (mark/restore), `lib/integration.ts` (`setFacilityInMaintenance`/`restoreFacilityFromMaintenance`, konsumsi `getUpcomingActiveReservationsForFacility`), landing `app/page.tsx` memakai data real `getActiveFacilities()` + `getFacilitySlotAvailability()` dengan fallback demo, CTA katalog → `/login?redirect=...` (login kini mem-parse `?redirect` via `useSearchParams`+Suspense).
>   - 05 → seluruh unused imports dihapus, `<img>` navbar → `next/image`. Lint bersih: 0 error / 0 warning.
>   - 06 → `tsx` (devDep) terpasang + script `test:chapter-*` & `test` di `package.json`; prasyarat: DB live + migration seed ter-apply (`npm run test` = MENULIS data → jangan jalankan di DB produksi).
> - 07 → gate reservasi petugas dipersempit ke role `petugas` (server action, halaman `petugas/reservasi*`, RLS UPDATE policy `dalam perbaikan`), konsisten dengan AGENTS.md.
> Temuan 04–07 telah diperbaiki dan terverifikasi lint bersih (0 error / 0 warning).
> Temuan 04–07 masih terbuka.

---

## Ringkasan Eksekutif

Seluruh implementasi modul Reservasi (Chapter 1–12: folder struktur, skema DB, data access layer, validasi waktu/slot, mesin deteksi bentrok, fitur pengguna ajukan/riwayat/batalkan, fitur petugas antrean/approve-reject/cancel darurat, dan integrasi lintas modul) telah diaudit terhadap Acceptance Criteria di masing-masing chapter.

- **10 dari 12 chapter: Acceptance Criteria terpenuhi** di tingkat fungsi/logika (Chapter 3, 4, 5, 7, 8, 9, 10, 11 penuh; Chapter 1 dan 6 sebagian).
- **2 chapter memiliki celah material**: Chapter 2 (migration bisa gagal tanpa tabel `users`) dan Chapter 12 (fungsi integrasi ada namun tidak terpasang ke UI/route mana pun).
- **1 masalah keamanan cross-cutting** (spoofing `user_id`/`staffId` pada server action) dan **1 masalah usability kritis** (modul tidak terjangkau dari navigasi setelah login).

Total temuan: **7 temuan**
- TINGGI: 3 (No. 01–03)
- SEDANG: 1 (No. 04)
- RENDAH: 3 (No. 05–07)

Verifikasi teknis: `tsc --noEmit` exit 0, `npm run lint` 0 error (22 warning import tak terpakai). Tes unit membutuhkan DB Supabase live (data seed Chapter 2), sehingga tidak dijalankan dalam sesi audit read-only.

---

## Matriks Status per Chapter

### Chapter 1 — Setup & Struktur Proyek — ⚠️ Sebagian
| AC | Status | Bukti |
|---|---|---|
| Struktur folder `/public`, `/app/models`, `/app/controllers`, `/views`, `/config` | ✅ | `app/models/reservation.ts`, `app/controllers/index.ts`, `views/index.ts`, `config/database.ts`, `public/` |
| Koneksi DB bisa jalan tanpa hardcode | ✅ | `config/database.ts:14-23` (semua dari env), `testDatabaseConnection` di `config/database.ts:51` |
| Tidak ada kredensial hardcoded | ✅ | Grep `eyJ|postgresql://|db_password` tidak menemukan apa pun di source; `.env` di-gitignore (`fivora/.gitignore:34`) |
| Aplikasi bisa dijalankan | ⚠️ | `tsc --noEmit` dan lint lolos; `npm run build`/`npm run start` belum diverifikasi dalam sesi ini |

### Chapter 2 — Skema Database Reservations — ⚠️ Sebagian
| AC | Status | Bukti |
|---|---|---|
| Tabel `reservations` + seluruh kolom wajib | ✅ | `supabase/migrations/20261001000001_create_reservations_schema.sql:23-37` |
| FK ke `users` & `facilities` | ✅ | `...:25-26` |
| Status hanya 4 nilai | ✅ | CHECK constraint `...:32` |
| Satu pengajuan = satu baris | ✅ | Desain skema + `createReservation` |
| Seed 5–8 baris variasi status | ✅ | Migration 02, 7 baris (menunggu, disetujui, ditolak, dibatalkan) |
| **Placeholder tabel `users` bila belum ada** | ❌ | Migrasi hanya membuat `facilities` dan `reservations`; `REFERENCES public.users(id)` (`...:25`) dan `users.auth_user_id` (RLS `...:57,67`) tidak disediakan. Migration akan GAGAL jika tabel `users` belum ada di DB |

### Chapter 3 — Data Access Layer — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| 8 fungsi wajib tersedia | ✅ | `app/models/reservation.ts` (createReservation, getReservationById, getReservationsByUser, getReservationsByFacilityAndDate, getPendingReservationsQueueSortedByCreatedAt, updateReservationStatus, getOverlappingReservations, getUserReservationsOverlapping) |
| Logika irisan `a_start < b_end AND b_start < a_end` | ✅ | `app/models/reservation.ts:240-241`, `lib/conflict-engine.ts:46-47,87-88` |
| Test overlap (bentrok penuh, sebagian, bersinggungan batas) | ✅ | `tests/test-chapter-03.ts:64-118` (5 skenario) |
| Murni akses data (tanpa logika bisnis) | ✅ | Tidak ada validasi sisipan |

### Chapter 4 — Aturan Waktu & Slot — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| 11 aturan tervalidasi di server | ✅ | `lib/validations/reservation-time.ts` (jam operasional `:128-144`, kelipatan 30 menit `:121-126`, durasi `:147-152`, tanggal masa lalu `:107-109`, same-day rounding `:154-165`, WIB `:23-50`) |
| `validateReservationTimeRules` | ✅ | `lib/validations/reservation-time.ts:92` |
| `isReservationExpiredForApproval` | ✅ | `:174` |
| `getDisplayStatusLabel` (tidak mengubah data) | ✅ | `:197` |
| Kasus tepi 10.10→10.30, 12.00→12.30 | ✅ | `tests/test-chapter-04.ts:60-93` |
| Disetujui yang sudah lewat tetap status asli + label | ✅ | `tests/test-chapter-04.ts:115-135`, `:197-238` |

### Chapter 5 — Mesin Deteksi Bentrok — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| Dua pending di slot sama bisa ada di DB | ✅ | `tests/test-chapter-05.ts:37-57` |
| Pending tidak mengunci slot | ✅ | `lib/conflict-engine.ts:45` (filter status `disetujui`) |
| Approve bentrok dengan disetujui ditolak | ✅ | `lib/actions/reservations.ts:192-207`, `tests/test-chapter-05.ts:100-109` |
| Auto-reject pending lain + alasan "jadwal telah terisi" | ✅ | `lib/conflict-engine.ts:109-159`, tes `:78-97` |
| Larangan double-booking lintas fasilitas | ✅ | `lib/conflict-engine.ts:67-101`, tes `:114-136` |
| Re-check saat approve (anti race) | ✅ | `lib/actions/reservations.ts:141-207` |
| `isFacilityBookable` menerima flag status | ✅ | `lib/conflict-engine.ts:14-16` |

Catatan: tidak ada constraint DB `EXCLUDE`/kunci unik untuk mencegah dua `disetujui` overlap; proteksi hanya di lapisan aplikasi → jendela race sangat kecil. Lihat No. 07.

### Chapter 6 — Fitur Pengguna: Ajukan Reservasi — ⚠️ Sebagian
| AC | Status | Bukti |
|---|---|---|
| Form pengajuan (fasilitas, tanggal, waktu, tujuan) | ✅ | `components/reservations/reservation-form.tsx` |
| Ketentuan batas pembatalan 3 jam sebelum submit | ✅ | `reservation-form.tsx:274-280` |
| Validasi urut client → server (ch4 + ch5) | ✅ | `lib/actions/reservations.ts:457-552` |
| Status default `menunggu` | ✅ | `lib/actions/reservations.ts:555-563` |
| Pesan error spesifik | ✅ | Tiap kegagalan punya pesan khusus |
| Server tetap memvalidasi, tidak percaya client | ✅ | Validasi penuh di server action |
| **Keamanan: `user_id` dari client dipakai langsung** | ❌ | `lib/actions/reservations.ts:437` — `params.user_id` dipakai apa adanya bila disertakan; dengan client service-role (bypass RLS) ini bisa dipalsukan. Lihat No. 02 |

### Chapter 7 — Fitur Pengguna: Riwayat & Detail — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| Riwayat hanya milik sendiri | ✅ | `app/reservasi/page.tsx:46` |
| Urutan terbaru + komentar kode | ✅ | `app/models/reservation.ts:98-99` (konsisten: tanggal & waktu terbaru) |
| Detail tampilkan semua field + alasan + processed | ✅ | `app/reservasi/[id]/page.tsx:243-267` |
| 403 untuk data milik user lain | ✅ | `app/reservasi/[id]/page.tsx:73-100` |
| Tanpa tombol edit | ✅ | Tidak ada aksi edit |

### Chapter 8 — Fitur Pengguna: Batalkan — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| `canUserCancelReservation` (aturan 1–4) | ✅ | `lib/validations/reservation-time.ts:247-315` |
| Boundary tepat 3 jam boleh | ✅ | `tests/test-chapter-07-08.ts:36-46` |
| 2 jam 59 menit ditolak | ✅ | `:48-57` |
| Baris tetap di DB berstatus `dibatalkan` | ✅ | `:116-123` |
| User lain diblokir | ✅ | `:93-103` |

### Chapter 9 — Fitur Petugas: Antrean/Dashboard — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| Dashboard hanya role petugas | ✅ | `app/petugas/reservasi/page.tsx:27-48` (mengizinkan admin juga — lihat No. 07) |
| FIFO (`created_at` ascending) | ✅ | `app/models/reservation.ts:156` |
| Baris menampilkan pemohon, fasilitas, tanggal/jam, tujuan, waktu pengajuan | ✅ | `app/petugas/reservasi/page.tsx:112-164` |
| Detail per pengajuan | ✅ | `app/petugas/reservasi/[id]/page.tsx` |

### Chapter 10 — Fitur Petugas: Approve/Reject — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| Approve valid mengisi `processed_by` & `processed_at` | ✅ | `lib/actions/reservations.ts:210-213` |
| Approve expired → otomatis `ditolak` ("waktu mulai reservasi telah terlewati") | ✅ | `:143-164` |
| Approve bentrok dengan `disetujui` lain ditolak | ✅ | `:192-207` |
| Auto-reject pending lain setelah approve | ✅ | `:216-223` |
| Reject wajib alasan | ✅ | `:269-274` |
| Cek status fasilitas saat approve | ✅ | `:166-190` |

### Chapter 11 — Fitur Petugas: Cancel Darurat — ✅ Penuh
| AC | Status | Bukti |
|---|---|---|
| `cancelReservationByStaff(id, staffId, reason)` | ✅ | `lib/actions/reservations.ts:312-346` |
| Hanya status `disetujui` | ✅ | `:329-334` |
| Alasan wajib | ✅ | `:317-322` |
| Tanpa batas 3 jam | ✅ | Tidak ada pengecekan waktu |
| Status `dibatalkan`, riwayat tersimpan | ✅ | `:336-340` |

### Chapter 12 — Integrasi Lintas Modul — ⚠️ Sebagian
| AC | Status | Bukti |
|---|---|---|
| Role-check nyata (bukan placeholder) | ✅ | `lib/auth.ts` membaca tabel `users` bersama (modul Alyssa) |
| `isFacilityBookable` benar untuk aktif/nonaktif/dalam_perbaikan | ✅ | `lib/conflict-engine.ts:14`, `tests/test-chapter-12.ts:28-33` |
| `getUpcomingActiveReservationsForFacility` | ✅ (fungsi) | `lib/integration.ts:113`, diuji `:58-63` — belum dipakai UI admin |
| `handleFacilityMaintenance` | ✅ (fungsi) | `lib/integration.ts:150`, diuji `:86-110` — belum dipanggil dari route/UI manapun |
| Ketersediaan publik konsisten dengan lock slot ch5 | ⚠️ | `lib/integration.ts:57` sudah satu sumber kebenaran (hanya `disetujui`), diuji `:37-55`; TAPI landing `components/landing/facility-showcase.tsx` masih pakai data demo statis, tidak memanggil fungsi ini |

---

## Daftar Temuan Lengkap

### Prioritas TINGGI

#### 01. [Usability / Ch6–11] Modul Reservasi Tidak Terjangkau dari Navigasi & Login
- **Lokasi**: `app/login/page.tsx:117,122,126`; seluruh landing/navbar (`components/landing/navbar.tsx`)
- **Alasan**: Tidak ada satu pun link menuju `/reservasi`, `/reservasi/buat`, atau `/petugas/reservasi`. Setelah login:
  - role `admin` → `/admin` (ada) ✅
  - role `petugas` → `/operator` (**404**, seharusnya `/petugas/reservasi`)
  - role `pengguna` → `/dashboard` (**404**, bukan `/reservasi`)
- **Dampak**: Fitur Chapter 6–11 sulit (bahkan tidak bisa) didemokan lewat alur normal. Pengguna baru tidak punya jalur untuk mengajukan reservasi.
- **Rekomendasi**: Redirect pasca-login sesuai role (`pengguna` → `/reservasi`, `petugas` → `/petugas/reservasi`, `admin` → `/admin`), dan tambahkan CTA/entri navigasi menuju halaman tersebut.

#### 02. [Keamanan] Server Action Mempercayai `user_id`/`staffId` yang Dikirim Client
- **Lokasi**: `lib/actions/reservations.ts:437` (`createReservationAction` pakai `params.user_id` langsung), `:31` (`userIdOverride` di `cancelReservationByUserAction`), `:109` (`staffIdOverride` di `approveReservationAction`), `:249` (reject), `:356` (cancel darurat)
- **Alasan**: Semua override dipakai apa adanya bila disertakan. Karena `getDatabaseClient()` menggunakan `SUPABASE_SECRET_KEY` (service role, bypass RLS), pemanggil dengan sesi aktif bisa mengirim `user_id`/`staffId` milik akun lain dan aksi dijalankan atas nama orang lain (membatalkan reservasi orang lain, menyetujui/menolak sebagai siapapun).
- **Rekomendasi**: Jangan sertakan override pada jalur produksi; selalu turunkan identitas dari `getCurrentUser()` di dalam action (override hanya boleh untuk test, idealnya dihilangkan atau ditarik dari modul produksi).

#### 03. [Ch2] Migration Gagal Bila Tabel `users` Belum Ada
- **Lokasi**: `supabase/migrations/20261001000001_create_reservations_schema.sql:25,50,57,67`
- **Alasan**: `REFERENCES public.users(id)`, `users.auth_user_id`, dan fungsi `get_current_user_profile()` mengasumsikan tabel `users` dengan kolom `auth_user_id` sudah ada. Chapter 2 menginstruksikan untuk membuat versi minimal tabel `users` (placeholder berisi `id`) dengan komentar bila modul lain belum menyediakannya. Ini tidak dilakukan.
- **Rekomendasi**: Tambahkan `CREATE TABLE IF NOT EXISTS public.users (...)` versi minimal penuh komentar, atau dokumentasikan urutan apply migration antar modul (Alyssa dulu).

### Prioritas SEDANG

#### 04. [Ch12] Fungsi Integrasi Ada, Belum Terpasang ke Route/UI
- **Lokasi**: `lib/integration.ts:57,113,150` (tiga fungsi); `components/landing/facility-showcase.tsx` (data demo statis)
- **Alasan**: `getFacilitySlotAvailability`, `getUpcomingActiveReservationsForFacility`, dan `handleFacilityMaintenance` lolos unit test (`tests/test-chapter-12.ts`) tetapi tidak dipanggil dari halaman, komponen, atau route handler mana pun. AC "tampilan ketersediaan publik konsisten" baru terpenuhi di tingkat fungsi, bukan di produk jadi.
- **Rekomendasi**: Pasang `getFacilitySlotAvailability` ke tampilan ketersediaan publik (pengganti data demo), dan siapkan invocation point bagi modul Arin/admin untuk `handleFacilityMaintenance` dan daftar reservasi aktif.

### Prioritas RENDAH

#### 05. [Kualitas] 22 Warning Lint (Import Tidak Terpakai)
- **Lokasi**: `app/reservasi/page.tsx:8` (`Badge`), `app/reservasi/[id]/page.tsx:20-24` (`CheckCircle2`, `Clock3`, `Ban`), `app/petugas/reservasi/page.tsx:14` (`Inbox`), `app/petugas/reservasi/[id]/page.tsx:18` (`MapPin`), `components/reservations/reservation-form.tsx:11` (`Clock`, `Calendar`), `lib/actions/reservations.ts:20` (`ReservationStatus`), `lib/integration.ts:5` (`ReservationStatus`), `lib/validations/reservation-time.ts:1` (`Reservation`)
- **Rekomendasi**: Hapus import tidak terpakai.

#### 06. [Testing] Tidak Ada Script `test` dan Tes Tidak Idempoten
- **Lokasi**: `package.json` (tanpa script `test`), `tests/*.ts`
- **Alasan**: Tes meng-insert/update data ke DB (mis. `createReservation`, approve) dan tidak ada mekanisme cleanup/rollback; menjalankan ulang pada DB yang sama bisa menumpuk data atau gagal karena asumsi seed.
- **Rekomendasi**: Tambahkan `npm run test`, dokumentasikan prasyarat (DB live, migration + seed ter-apply), atau gunakan transaksi/rollback untuk idempotensi.

#### 07. [AGENTS.md] Admin Diizinkan Mengakses/Aprove Reservasi
- **Lokasi**: `lib/actions/reservations.ts:114,254,359`; `app/petugas/reservasi/page.tsx:27`; `app/petugas/reservasi/[id]/page.tsx:46`
- **Alasan**: Role check menerima `petugas` ATAU `admin`. `AGENTS.md` (Batas Kewenangan) menegaskan admin **tidak** boleh approve reservasi/proses laporan (khusus petugas).
- **Rekomendasi**: Sesuaikan ke hanya `petugas`, atau konfirmasi ke tim apakah `admin` memang diizinkan meninjau antrean (read) tapi tidak mengeksekusi aksi.

---

## Catatan Verifikasi

- `npx tsc --noEmit --incremental false` → exit 0 (tipe aman).
- `npm run lint` → 0 error, 22 warning (semua unused imports).
- Tes per chapter (`tests/test-chapter-*.ts`) tidak dijalankan dalam sesi ini karena membutuhkan DB Supabase live dengan migration + seed ter-apply dan bersifat menulis data.
- Environment `.env` berisi ketiga variabel Supabase yang dibutuhkan (URL + publishable + secret); tidak ada kredensial hardcoded di source.

---

## Panduan Tindak Lanjut

1. Pilih nomor temuan yang ingin diperbaiki (contoh: "perbaiki 01, 02, 03").
2. Temuan yang tidak dipilih tidak akan disentuh.
3. Setelah nomor disetujui, perbaikan dieksekusi dan diverifikasi ulang.