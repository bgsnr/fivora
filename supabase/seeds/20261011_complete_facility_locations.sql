-- Lengkapi lokasi lima fasilitas contoh lama setelah pembaruan data fasilitas.
-- Penempatan fakultas/kampus di bawah adalah SIMULASI untuk demo Fivora,
-- sesuai pilihan pengguna. Bukan klaim lokasi asli fasilitas UNDIP.
-- Jalankan seluruh file sekali di SQL Editor proyek Fivora.

BEGIN;

DO $$
DECLARE
  v_target RECORD;
  v_facility public.facilities%ROWTYPE;
BEGIN
  FOR v_target IN
    SELECT *
    FROM (VALUES
      (1::BIGINT, 'Ruang Kelas A101',
       'Gedung A, Lantai 1',
       'Gedung A, Lantai 1, Fakultas Ilmu Budaya UNDIP, Kampus Tembalang, Semarang'),
      (2::BIGINT, 'Laboratorium Komputer 1',
       'Gedung C, Lantai 2',
       'Gedung C, Lantai 2, Fakultas Sains dan Matematika UNDIP, Kampus Tembalang, Semarang'),
      (3::BIGINT, 'Aula Gedung B',
       'Gedung B, Lantai 3',
       'Gedung B, Lantai 3, Fakultas Ekonomika dan Bisnis UNDIP, Kampus Tembalang, Semarang'),
      (4::BIGINT, 'Lapangan Futsal',
       'Area Olahraga Outdoor',
       'Area Olahraga Terbuka, Fakultas Teknik UNDIP, Kampus Tembalang, Semarang'),
      (5::BIGINT, 'Proyektor Portable Unit 1',
       'Ruang Perlengkapan, Lantai 1',
       'Ruang Perlengkapan, Gedung A, Lantai 1, Fakultas Ilmu Budaya UNDIP, Kampus Tembalang, Semarang')
    ) AS target(id, expected_name, old_location, new_location)
    ORDER BY id
  LOOP
    SELECT f.* INTO v_facility
    FROM public.facilities AS f
    WHERE f.id = v_target.id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Fasilitas #% tidak ditemukan. Tidak ada perubahan lokasi yang disimpan.', v_target.id;
    END IF;

    IF v_facility.name IS DISTINCT FROM v_target.expected_name THEN
      RAISE EXCEPTION 'Nama fasilitas #% berbeda dari data contoh. Tidak ada perubahan lokasi yang disimpan.', v_target.id;
    END IF;

    IF btrim(v_facility.location) IS DISTINCT FROM v_target.old_location
       AND btrim(v_facility.location) IS DISTINCT FROM v_target.new_location THEN
      RAISE EXCEPTION 'Lokasi fasilitas #% sudah diubah. Tidak ada perubahan lokasi yang disimpan.', v_target.id;
    END IF;

    -- Tidak menulis ulang updated_at jika file ini dijalankan lagi.
    IF v_facility.location IS DISTINCT FROM v_target.new_location THEN
      UPDATE public.facilities
      SET location = v_target.new_location,
          updated_at = clock_timestamp()
      WHERE id = v_target.id;
    END IF;
  END LOOP;
END;
$$;

COMMIT;

SELECT id, name, location
FROM public.facilities
WHERE id IN (1, 2, 3, 4, 5)
ORDER BY id;
