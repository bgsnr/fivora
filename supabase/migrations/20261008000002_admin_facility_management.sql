BEGIN;

-- Penulisan data master dilakukan melalui fungsi admin, bukan browser langsung.
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.facilities
FROM PUBLIC, anon, authenticated;

-- Cabut juga izin per kolom jika sebelumnya pernah diberikan.
DO $$
DECLARE v_columns TEXT;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
  INTO v_columns
  FROM pg_attribute
  WHERE attrelid = 'public.facilities'::regclass
    AND attnum > 0 AND NOT attisdropped;
  EXECUTE 'REVOKE INSERT (' || v_columns || '), UPDATE (' || v_columns
    || ') ON TABLE public.facilities FROM PUBLIC, anon, authenticated';
END;
$$;

CREATE OR REPLACE FUNCTION public.require_facility_admin()
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_admin_id BIGINT;
BEGIN
  SELECT u.id INTO v_admin_id FROM public.users AS u
  WHERE u.auth_user_id = auth.uid() AND u.role = 'admin' AND u.status = 'aktif'
  FOR SHARE;
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Hanya administrator aktif yang dapat mengelola fasilitas.';
  END IF;
  RETURN v_admin_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_facility_master(
  p_name TEXT, p_type TEXT, p_location TEXT, p_capacity INTEGER, p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF p_name IS NULL OR length(btrim(p_name, E' \t\n\r')) NOT BETWEEN 1 AND 255 THEN
    RAISE EXCEPTION 'Nama fasilitas wajib diisi, maksimal 255 karakter.';
  END IF;
  IF p_type IS NULL OR p_type NOT IN (
    'Ruang Kelas', 'Aula', 'Laboratorium', 'Peralatan', 'Lapangan',
    'ruang_kelas', 'aula', 'laboratorium', 'alat', 'peralatan', 'lapangan'
  ) THEN
    RAISE EXCEPTION 'Pilih tipe fasilitas yang tersedia.';
  END IF;
  IF length(btrim(p_location)) > 255 THEN
    RAISE EXCEPTION 'Lokasi maksimal 255 karakter.';
  END IF;
  IF p_capacity < 0 THEN RAISE EXCEPTION 'Kapasitas tidak boleh negatif.'; END IF;
  IF length(btrim(p_description)) > 5000 THEN
    RAISE EXCEPTION 'Deskripsi maksimal 5000 karakter.';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_facility(
  p_name TEXT, p_type TEXT, p_location TEXT, p_capacity INTEGER,
  p_description TEXT, p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id BIGINT;
BEGIN
  PERFORM public.require_facility_admin();
  PERFORM public.validate_facility_master(p_name, p_type, p_location, p_capacity, p_description);
  IF p_status IS NULL OR p_status NOT IN ('aktif', 'nonaktif') THEN
    RAISE EXCEPTION 'Status awal harus Aktif atau Nonaktif.';
  END IF;
  INSERT INTO public.facilities(name, type, location, capacity, description, status)
  VALUES (
    btrim(p_name, E' \t\n\r'), p_type, nullif(btrim(p_location), ''), p_capacity,
    nullif(btrim(p_description), ''), p_status
  ) RETURNING id INTO v_id;
  RETURN jsonb_build_object('facility_id', v_id::TEXT);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_facility(
  p_facility_id BIGINT, p_name TEXT, p_type TEXT, p_location TEXT,
  p_capacity INTEGER, p_description TEXT, p_expected_updated_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_updated_at TIMESTAMPTZ;
BEGIN
  PERFORM public.require_facility_admin();
  PERFORM public.validate_facility_master(p_name, p_type, p_location, p_capacity, p_description);
  IF p_facility_id IS NULL OR p_facility_id <= 0 THEN RAISE EXCEPTION 'ID fasilitas tidak valid.'; END IF;
  SELECT f.updated_at INTO v_updated_at FROM public.facilities AS f
  WHERE f.id = p_facility_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fasilitas tidak ditemukan.'; END IF;
  IF v_updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'Data fasilitas sudah berubah. Muat ulang sebelum melanjutkan.' USING ERRCODE = '40001';
  END IF;
  -- Status dan tanggal pembuatan tidak ikut diubah saat mengedit rincian.
  UPDATE public.facilities SET
    name = btrim(p_name, E' \t\n\r'), type = p_type,
    location = nullif(btrim(p_location), ''), capacity = p_capacity,
    description = nullif(btrim(p_description), ''), updated_at = clock_timestamp()
  WHERE id = p_facility_id;
  RETURN jsonb_build_object('facility_id', p_facility_id::TEXT);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_facility_pending_reservations(p_facility_id BIGINT)
RETURNS TABLE (
  id BIGINT, user_name TEXT, reservation_date DATE,
  start_time TIME, end_time TIME, status TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_wib TIMESTAMP;
BEGIN
  PERFORM public.require_facility_admin();
  IF p_facility_id IS NULL OR p_facility_id <= 0 THEN RAISE EXCEPTION 'ID fasilitas tidak valid.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.facilities AS f WHERE f.id = p_facility_id) THEN
    RAISE EXCEPTION 'Fasilitas tidak ditemukan.';
  END IF;
  v_wib := clock_timestamp() AT TIME ZONE 'Asia/Jakarta';
  RETURN QUERY SELECT r.id, coalesce(u.name::TEXT, 'Nama tidak tersedia'),
    r.reservation_date, r.start_time, r.end_time, r.status::TEXT
  FROM public.reservations AS r
  LEFT JOIN public.users AS u ON u.id = r.user_id
  WHERE r.facility_id = p_facility_id AND r.status IN ('menunggu', 'disetujui')
    AND r.reservation_date + r.end_time > v_wib
  ORDER BY r.reservation_date, r.start_time, r.id;
END;
$$;

-- Berlaku juga untuk penulisan langsung oleh kode server lama.
CREATE OR REPLACE FUNCTION public.check_facility_deactivation_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_wib TIMESTAMP;
BEGIN
  IF NEW.status = 'nonaktif' AND OLD.status IS DISTINCT FROM 'nonaktif' THEN
    v_wib := clock_timestamp() AT TIME ZONE 'Asia/Jakarta';
    IF EXISTS (
      SELECT 1 FROM public.reservations AS r
      WHERE r.facility_id = NEW.id AND r.status IN ('menunggu', 'disetujui')
        AND r.reservation_date + r.end_time > v_wib
    ) THEN
      RAISE EXCEPTION 'Fasilitas masih memiliki reservasi menunggu atau disetujui yang belum berakhir. Petugas harus menanganinya terlebih dahulu.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS facilities_check_deactivation_reservations ON public.facilities;
CREATE TRIGGER facilities_check_deactivation_reservations
BEFORE UPDATE OF status ON public.facilities FOR EACH ROW
EXECUTE FUNCTION public.check_facility_deactivation_reservations();

CREATE OR REPLACE FUNCTION public.admin_set_facility_status(
  p_facility_id BIGINT, p_status TEXT, p_expected_updated_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_facility public.facilities%ROWTYPE;
BEGIN
  PERFORM public.require_facility_admin();
  IF p_facility_id IS NULL OR p_facility_id <= 0 THEN RAISE EXCEPTION 'ID fasilitas tidak valid.'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('aktif', 'nonaktif') THEN
    RAISE EXCEPTION 'Status harus Aktif atau Nonaktif.';
  END IF;
  -- Lock ini juga menunggu transaksi pengajuan/persetujuan yang memegang FOR SHARE.
  SELECT f.* INTO v_facility FROM public.facilities AS f WHERE f.id = p_facility_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fasilitas tidak ditemukan.'; END IF;
  IF v_facility.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'Data fasilitas sudah berubah. Muat ulang sebelum melanjutkan.' USING ERRCODE = '40001';
  END IF;
  IF v_facility.status IS NULL OR v_facility.status NOT IN ('aktif', 'nonaktif', 'dalam_perbaikan') THEN
    RAISE EXCEPTION 'Status fasilitas tidak dikenali. Periksa data fasilitas.';
  END IF;
  IF p_status = 'aktif' AND (
    v_facility.status = 'dalam_perbaikan' OR EXISTS (
      SELECT 1 FROM public.facility_maintenance AS m
      WHERE m.facility_id = p_facility_id AND m.completed_at IS NULL
    )
  ) THEN
    RAISE EXCEPTION 'Selesaikan kegiatan perbaikan melalui laporan terlebih dahulu.';
  END IF;
  IF v_facility.status <> p_status THEN
    UPDATE public.facilities SET status = p_status, updated_at = clock_timestamp()
    WHERE id = p_facility_id;
  END IF;
  RETURN jsonb_build_object('facility_id', p_facility_id::TEXT, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.require_facility_admin() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.validate_facility_master(TEXT,TEXT,TEXT,INTEGER,TEXT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.check_facility_deactivation_reservations() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_create_facility(TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_update_facility(BIGINT,TEXT,TEXT,TEXT,INTEGER,TEXT,TIMESTAMPTZ) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_facility_pending_reservations(BIGINT) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_set_facility_status(BIGINT,TEXT,TIMESTAMPTZ) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.admin_create_facility(TEXT,TEXT,TEXT,INTEGER,TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_facility(BIGINT,TEXT,TEXT,TEXT,INTEGER,TEXT,TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_facility_pending_reservations(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_facility_status(BIGINT,TEXT,TIMESTAMPTZ) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
