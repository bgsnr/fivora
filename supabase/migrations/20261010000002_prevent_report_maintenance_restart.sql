BEGIN;

CREATE OR REPLACE FUNCTION public.start_facility_maintenance(
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
    RAISE EXCEPTION
      'Hanya petugas aktif yang dapat memulai perbaikan.';
  END IF;

  IF p_reason IS NULL
     OR length(trim(p_reason)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION
      'Alasan perbaikan wajib diisi, maksimal 5000 karakter.';
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
    RAISE EXCEPTION
      'Data fasilitas berubah. Muat ulang halaman.';
  END IF;

  IF v_report.status <> 'diproses' THEN
    RAISE EXCEPTION
      'Perbaikan hanya dapat dimulai dari laporan berstatus Diproses.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.facility_maintenance AS m
    WHERE m.facility_id = v_facility_id
      AND m.completed_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Fasilitas masih memiliki kegiatan perbaikan yang belum selesai.';
  END IF;

  -- Pengaman baru: satu laporan tidak boleh memulai
  -- kegiatan perbaikan berulang kali.
  IF EXISTS (
    SELECT 1
    FROM public.facility_maintenance AS m
    WHERE m.report_id = p_report_id
  ) THEN
    RAISE EXCEPTION
      'Perbaikan melalui laporan ini sudah selesai dan tidak dapat dimulai ulang.';
  END IF;

  IF v_facility_status IS NULL
     OR v_facility_status NOT IN (
       'aktif',
       'nonaktif',
       'dalam_perbaikan'
     ) THEN
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

REVOKE ALL ON FUNCTION
  public.start_facility_maintenance(BIGINT, TEXT)
FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION
  public.start_facility_maintenance(BIGINT, TEXT)
TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;