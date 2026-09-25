-- ========================================================
-- FIVORA SEED DATA (Demo: Facilities, Users, Reservations)
-- ========================================================

-- 1. Insert facilities demo data
INSERT INTO public.facilities (id, name, type, location, capacity, description, status)
VALUES 
  (1, 'Ruang Kelas A101', 'ruang_kelas', 'Gedung A Lt. 1', 40, 'Ruang kelas ber-AC dengan proyektor dan papan tulis.', 'aktif'),
  (2, 'Laboratorium Komputer 1', 'laboratorium', 'Gedung C Lt. 2', 30, 'Laboratorium komputer lengkap dengan 30 PC workstation.', 'aktif'),
  (3, 'Aula Gedung B', 'aula', 'Gedung B Lt. 3', 200, 'Aula serbaguna dengan panggung dan sound system.', 'aktif'),
  (4, 'Lapangan Futsal', 'lapangan', 'Area Olahraga Outdoor', 20, 'Lapangan futsal rumput sintetis.', 'dalam_perbaikan'),
  (5, 'Proyektor Portable Unit 1', 'alat', 'Ruang Perlengkapan Lt. 1', 1, 'Proyektor portable Epson 3600 lumens beserta kabel HDMI.', 'aktif')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  status = EXCLUDED.status;

-- Reset sequence for facilities
SELECT setval(pg_get_serial_sequence('public.facilities', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.facilities));

-- 2. Insert minimal demo users (placeholder)
INSERT INTO public.users (id, auth_user_id, name, email, role, status)
VALUES
  (1, NULL, 'Administrator Fivora', 'admin@fivora.test', 'admin', 'aktif'),
  (5, NULL, 'Arini Mahasiswa', 'arini@fivora.test', 'pengguna', 'aktif'),
  (6, NULL, 'Bagas Mahasiswa', 'bagas@fivora.test', 'pengguna', 'aktif'),
  (7, NULL, 'Cindy Mahasiswa', 'cindy@fivora.test', 'pengguna', 'aktif'),
  (8, NULL, 'Petugas Budi', 'petugas1@fivora.test', 'petugas', 'aktif'),
  (10, NULL, 'Petugas Sari', 'petugas2@fivora.test', 'petugas', 'aktif')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users
SELECT setval(pg_get_serial_sequence('public.users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.users));

-- 3. Insert demo reservations (variasi status: menunggu, disetujui, ditolak, dibatalkan)
INSERT INTO public.reservations (
  user_id, facility_id, reservation_date, start_time, end_time, purpose, status, rejection_reason, processed_by, processed_at, created_at
) VALUES
  (6, 1, '2026-10-01', '08:00:00', '10:00:00', 'Kuliah Pengganti Pemrograman Perangkat Keras', 'menunggu', NULL, NULL, NULL, now() - interval '2 hours'),
  (5, 1, '2026-10-01', '09:00:00', '11:00:00', 'Rapat Koordinasi Himpunan Mahasiswa', 'menunggu', NULL, NULL, NULL, now() - interval '1 hour'),
  (6, 2, '2026-10-02', '10:00:00', '12:00:00', 'Praktikum Pemrograman Web', 'disetujui', NULL, 8, now() - interval '1 day', now() - interval '2 days'),
  (7, 2, '2026-10-02', '13:00:00', '15:00:00', 'Workshop Pengenalan Data Science', 'disetujui', NULL, 8, now() - interval '1 day', now() - interval '2 days'),
  (10, 2, '2026-10-02', '11:00:00', '14:00:00', 'Latihan Mandiri Lab Komputer', 'ditolak', 'jadwal telah terisi', 8, now() - interval '1 day', now() - interval '2 days'),
  (6, 3, '2026-10-03', '08:00:00', '12:00:00', 'Seminar Nasional Teknologi Informasi', 'dibatalkan', 'Dibatalkan oleh pemesan: perubahan jadwal pembicara', NULL, NULL, now() - interval '3 days'),
  (7, 3, '2026-10-05', '14:00:00', '16:00:00', 'Gladi Bersih Wisuda Jurusan', 'menunggu', NULL, NULL, NULL, now() - interval '30 minutes');
