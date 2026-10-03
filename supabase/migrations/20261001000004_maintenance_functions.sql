BEGIN;

CREATE FUNCTION public.start_facility_maintenance(
  p_report_id BIGINT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staff_id BIGINT;
  v_facility_id BIGINT;
  v_facility_status TEXT;
  v_report public.reports%ROWTYPE;
  v_maintenance_id BIGINT;
  v_now TIMESTAMPTZ;
  v_wib TIMESTAMP;
  v_rejected INTEGER := 0;
  v_cancelled INTEGER := 0;
BEGIN
  SELECT u.id INTO v_staff_id
  FROM public.users AS u
  WHERE u.auth_user_id = auth.uid()
    AND u.role = 'petugas'
    AND u.status = 'aktif'
  FOR SHARE;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Hanya petugas aktif yang dapat memulai perbaikan.';
  END IF;

  IF p_reason IS NULL
     OR length(trim(p_reason)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Alasan perbaikan wajib diisi, maksimal 5000 karakter.';
  END IF;

  SELECT r.facility_id INTO v_facility_id
  FROM public.reports AS r
  WHERE r.id = p_report_id;

  IF v_facility_id IS NULL THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan.';
  END IF;

  SELECT f.status INTO v_facility_status
  FROM public.facilities AS f
  WHERE f.id = v_facility_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fasilitas tidak ditemukan.';
  END IF;

  SELECT r.* INTO v_report
  FROM public.reports AS r
  WHERE r.id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Laporan tidak ditemukan.';
  END IF;

  IF v_report.facility_id <> v_facility_id THEN
    RAISE EXCEPTION 'Data fasilitas berubah. Muat ulang halaman.';
  END IF;

  IF v_report.status <> 'diproses' THEN
    RAISE EXCEPTION 'Perbaikan hanya dapat dimulai dari laporan berstatus Diproses.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.facility_maintenance AS m
    WHERE m.facility_id = v_facility_id
      AND m.completed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Fasilitas masih memiliki kegiatan perbaikan yang belum selesai.';
  END IF;

  IF v_facility_status = 'dalam_perbaikan' THEN
    RAISE EXCEPTION 'Fasilitas sudah dalam perbaikan tetapi belum memiliki riwayat pada tabel baru. Periksa data sebelum melanjutkan.';
  END IF;

  IF v_facility_status IS NULL
     OR v_facility_status NOT IN ('aktif', 'nonaktif') THEN
    RAISE EXCEPTION 'Status fasilitas tidak dikenali.';
  END IF;

  v_now := clock_timestamp();
  v_wib := v_now AT TIME ZONE 'Asia/Jakarta';

  INSERT INTO public.facility_maintenance (
    facility_id,
    report_id,
    reason,
    started_by,
    started_at
  )
  VALUES (
    v_facility_id,
    p_report_id,
    trim(p_reason),
    v_staff_id,
    v_now
  )
  RETURNING id INTO v_maintenance_id;

  -- Fasilitas nonaktif tetap nonaktif.
  -- Kegiatan perbaikannya tercatat secara terpisah.
  UPDATE public.facilities
  SET status = CASE
        WHEN status = 'nonaktif' THEN 'nonaktif'
        ELSE 'dalam_perbaikan'
      END,
      updated_at = v_now
  WHERE id = v_facility_id;

  UPDATE public.reservations
  SET status = 'ditolak',
      rejection_reason =
        'Fasilitas dalam perbaikan berdasarkan laporan #'
        || p_report_id::TEXT || ': ' || trim(p_reason),
      processed_by = v_staff_id,
      processed_at = v_now
  WHERE facility_id = v_facility_id
    AND status = 'menunggu'
    AND reservation_date + start_time > v_wib;

  GET DIAGNOSTICS v_rejected = ROW_COUNT;

  UPDATE public.reservations
  SET status = 'dibatalkan',
      rejection_reason =
        'Fasilitas dalam perbaikan berdasarkan laporan #'
        || p_report_id::TEXT || ': ' || trim(p_reason),
      processed_by = v_staff_id,
      processed_at = v_now
  WHERE facility_id = v_facility_id
    AND status = 'disetujui'
    AND reservation_date + end_time > v_wib;

  GET DIAGNOSTICS v_cancelled = ROW_COUNT;

  RETURN jsonb_build_object(
    'maintenance_id', v_maintenance_id::TEXT,
    'rejected_pending_count', v_rejected,
    'cancelled_approved_count', v_cancelled
  );
END;
$$;

CREATE FUNCTION public.finish_facility_maintenance(
  p_maintenance_id BIGINT,
  p_completion_note TEXT,
  p_confirmed_usable BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_staff_id BIGINT;
  v_facility_id BIGINT;
  v_facility_status TEXT;
  v_maintenance public.facility_maintenance%ROWTYPE;
  v_now TIMESTAMPTZ;
BEGIN
  SELECT u.id INTO v_staff_id
  FROM public.users AS u
  WHERE u.auth_user_id = auth.uid()
    AND u.role = 'petugas'
    AND u.status = 'aktif'
  FOR SHARE;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Hanya petugas aktif yang dapat menyelesaikan perbaikan.';
  END IF;

  IF p_completion_note IS NULL
     OR length(trim(p_completion_note)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Catatan penyelesaian wajib diisi, maksimal 5000 karakter.';
  END IF;

  IF p_confirmed_usable IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Pastikan fasilitas layak digunakan dan tidak ada kerusakan lain yang menghambat.';
  END IF;

  SELECT m.facility_id INTO v_facility_id
  FROM public.facility_maintenance AS m
  WHERE m.id = p_maintenance_id;

  IF v_facility_id IS NULL THEN
    RAISE EXCEPTION 'Riwayat perbaikan tidak ditemukan.';
  END IF;

  SELECT f.status INTO v_facility_status
  FROM public.facilities AS f
  WHERE f.id = v_facility_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fasilitas tidak ditemukan.';
  END IF;

  SELECT m.* INTO v_maintenance
  FROM public.facility_maintenance AS m
  WHERE m.id = p_maintenance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Riwayat perbaikan tidak ditemukan.';
  END IF;

  IF v_maintenance.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Perbaikan ini sudah selesai.';
  END IF;

  IF v_facility_status IS NULL
     OR v_facility_status NOT IN ('dalam_perbaikan', 'nonaktif') THEN
    RAISE EXCEPTION 'Status fasilitas tidak sesuai dengan kegiatan perbaikan.';
  END IF;

  v_now := clock_timestamp();

  UPDATE public.facility_maintenance
  SET completed_by = v_staff_id,
      completed_at = v_now,
      completion_note = trim(p_completion_note)
  WHERE id = p_maintenance_id;

  UPDATE public.facilities
  SET status = CASE
        WHEN status = 'nonaktif' THEN 'nonaktif'
        ELSE 'aktif'
      END,
      updated_at = v_now
  WHERE id = v_facility_id
  RETURNING status INTO v_facility_status;

  RETURN jsonb_build_object(
    'maintenance_id', p_maintenance_id::TEXT,
    'facility_status', v_facility_status
  );
END;
$$;

-- Melindungi pengajuan/persetujuan yang berlangsung bersamaan
-- dengan dimulainya perbaikan.
CREATE FUNCTION public.check_reservation_facility_available()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NEW.status NOT IN ('menunggu', 'disetujui') THEN
    RETURN NEW;
  END IF;

  SELECT f.status INTO v_status
  FROM public.facilities AS f
  WHERE f.id = NEW.facility_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fasilitas tidak ditemukan.';
  END IF;

  IF v_status IS DISTINCT FROM 'aktif' THEN
    RAISE EXCEPTION 'Fasilitas tidak tersedia untuk pengajuan atau persetujuan reservasi.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.facility_maintenance AS m
    WHERE m.facility_id = NEW.facility_id
      AND m.completed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Fasilitas masih dalam perbaikan.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER reservations_check_facility_available
BEFORE INSERT OR UPDATE OF
  status, facility_id, reservation_date, start_time, end_time
ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.check_reservation_facility_available();

-- Mencegah tombol lama mengaktifkan fasilitas
-- sebelum kegiatan perbaikannya ditutup.
CREATE FUNCTION public.check_facility_maintenance_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_has_open_maintenance BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.facility_maintenance AS m
    WHERE m.facility_id = NEW.id
      AND m.completed_at IS NULL
  ) INTO v_has_open_maintenance;

  IF NEW.status = 'aktif' AND v_has_open_maintenance THEN
    RAISE EXCEPTION 'Selesaikan kegiatan perbaikan terlebih dahulu.';
  END IF;

  IF NEW.status = 'dalam_perbaikan'
     AND NOT v_has_open_maintenance THEN
    RAISE EXCEPTION 'Mulai perbaikan melalui laporan yang sedang ditangani.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER facilities_check_maintenance_status
BEFORE UPDATE OF status
ON public.facilities
FOR EACH ROW
EXECUTE FUNCTION public.check_facility_maintenance_status();

REVOKE ALL ON FUNCTION
  public.start_facility_maintenance(BIGINT, TEXT)
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.finish_facility_maintenance(BIGINT, TEXT, BOOLEAN)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.start_facility_maintenance(BIGINT, TEXT)
TO authenticated;

GRANT EXECUTE ON FUNCTION
  public.finish_facility_maintenance(BIGINT, TEXT, BOOLEAN)
TO authenticated;

REVOKE ALL ON FUNCTION
  public.check_reservation_facility_available()
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION
  public.check_facility_maintenance_status()
FROM PUBLIC, anon, authenticated, service_role;

COMMIT;