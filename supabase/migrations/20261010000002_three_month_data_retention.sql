BEGIN;

-- Tanggal kedaluwarsa menggunakan tiga bulan kalender dalam WIB, bukan 90 hari.
CREATE OR REPLACE FUNCTION public.fivora_retention_deadline(p_time TIMESTAMPTZ)
RETURNS TIMESTAMPTZ
LANGUAGE sql IMMUTABLE STRICT
SET search_path = ''
AS $$
  SELECT ((p_time AT TIME ZONE 'Asia/Jakarta') + INTERVAL '3 months')
    AT TIME ZONE 'Asia/Jakarta';
$$;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Pada data lama, processed_at adalah waktu pergantian status terakhir.
UPDATE public.reports
SET closed_at = COALESCE(processed_at, updated_at, created_at)
WHERE status IN ('selesai', 'ditolak') AND closed_at IS NULL;

CREATE OR REPLACE FUNCTION public.fivora_stamp_report_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IN ('selesai', 'ditolak') THEN
    IF TG_OP = 'UPDATE' AND OLD.status IN ('selesai', 'ditolak') THEN
      NEW.closed_at := OLD.closed_at;
    ELSE
      NEW.closed_at := clock_timestamp();
    END IF;
  ELSE
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_stamp_closure ON public.reports;
CREATE TRIGGER reports_stamp_closure
BEFORE INSERT OR UPDATE OF status, closed_at ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.fivora_stamp_report_closure();

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
GENERATED ALWAYS AS (public.fivora_retention_deadline(closed_at)) STORED;

ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
GENERATED ALWAYS AS (
  ((reservation_date + end_time + INTERVAL '3 months') AT TIME ZONE 'Asia/Jakarta')
) STORED;

CREATE INDEX IF NOT EXISTS reports_retention_expiry_idx
ON public.reports (retention_expires_at, id)
WHERE status IN ('selesai', 'ditolak');
CREATE INDEX IF NOT EXISTS reservations_retention_expiry_idx
ON public.reservations (retention_expires_at, id);

-- Jangan menerapkan penghapusan jika ada relasi tambahan yang belum diperiksa.
DO $$
DECLARE v_unknown TEXT;
BEGIN
  SELECT string_agg(c.conrelid::regclass::TEXT || '.' || c.conname, ', ')
  INTO v_unknown
  FROM pg_constraint AS c
  WHERE c.contype = 'f' AND (
    (c.confrelid = 'public.reports'::regclass AND NOT (
      c.conrelid IN ('public.facility_maintenance'::regclass, 'public.report_progress_notes'::regclass)
      OR (c.conrelid = 'public.reports'::regclass AND cardinality(c.conkey) = 1
        AND EXISTS (SELECT 1 FROM pg_attribute AS a
          WHERE a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
            AND a.attname = 'laporan_utama_id'))
    ))
    OR c.confrelid = 'public.reservations'::regclass
    OR (c.confrelid = 'public.facility_maintenance'::regclass
      AND c.conrelid <> 'public.maintenance_notes'::regclass)
  );
  IF v_unknown IS NOT NULL THEN
    RAISE EXCEPTION 'Retensi belum diterapkan. Relasi tambahan perlu diperiksa: %', v_unknown;
  END IF;
END;
$$;

-- Referensi laporan duplikat dilepas jika laporan acuannya kedaluwarsa.
-- Isi dan status laporan duplikat yang masih berlaku tidak ikut dihapus.
DO $$
DECLARE v_constraint RECORD;
BEGIN
  FOR v_constraint IN
    SELECT c.conname, pg_get_constraintdef(c.oid) AS definition
    FROM pg_constraint AS c
    JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
    WHERE c.contype = 'f' AND c.conrelid = 'public.reports'::regclass
      AND c.confrelid = 'public.reports'::regclass
      AND cardinality(c.conkey) = 1 AND a.attname = 'laporan_utama_id'
  LOOP
    IF v_constraint.definition NOT LIKE '%ON DELETE SET NULL%' THEN
      EXECUTE format('ALTER TABLE public.reports DROP CONSTRAINT %I', v_constraint.conname);
      EXECUTE format(
        'ALTER TABLE public.reports ADD CONSTRAINT %I FOREIGN KEY (laporan_utama_id) REFERENCES public.reports(id) ON DELETE SET NULL',
        v_constraint.conname
      );
    END IF;
  END LOOP;
END;
$$;

CREATE TABLE IF NOT EXISTS public.fivora_retention_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  enabled BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO public.fivora_retention_settings(singleton, enabled)
VALUES (TRUE, FALSE) ON CONFLICT (singleton) DO NOTHING;

-- Foto diantrekan dalam transaksi yang sama dengan penghapusan laporan.
-- Antrean dipertahankan sampai Storage API berhasil, agar kegagalan bisa dicoba ulang.
CREATE TABLE IF NOT EXISTS public.fivora_retention_photos (
  photo_path TEXT PRIMARY KEY,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  retry_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  lease_token UUID,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);
CREATE INDEX IF NOT EXISTS fivora_retention_photos_retry_idx
ON public.fivora_retention_photos(retry_at, queued_at);

ALTER TABLE public.fivora_retention_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fivora_retention_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.fivora_retention_settings, public.fivora_retention_photos
FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fivora_retention_preview()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'enabled', (SELECT enabled FROM public.fivora_retention_settings WHERE singleton),
    'reports_due', (SELECT count(*) FROM public.reports AS r
      WHERE r.status IN ('selesai', 'ditolak') AND r.retention_expires_at <= statement_timestamp()
        AND NOT EXISTS (SELECT 1 FROM public.facility_maintenance AS m
          WHERE m.report_id = r.id AND m.completed_at IS NULL)),
    'reservations_due', (SELECT count(*) FROM public.reservations AS r
      WHERE r.retention_expires_at <= statement_timestamp()),
    'photos_waiting', (SELECT count(*) FROM public.fivora_retention_photos),
    'blocked_open_maintenance', (SELECT count(*) FROM public.reports AS r
      WHERE r.status IN ('selesai', 'ditolak') AND r.retention_expires_at <= statement_timestamp()
        AND EXISTS (SELECT 1 FROM public.facility_maintenance AS m
          WHERE m.report_id = r.id AND m.completed_at IS NULL))
  );
$$;

CREATE OR REPLACE FUNCTION public.fivora_purge_expired_data(p_limit INTEGER DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ids BIGINT[];
  v_reports INTEGER := 0;
  v_reservations INTEGER := 0;
BEGIN
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Ukuran batch harus 1 sampai 500.';
  END IF;
  IF NOT COALESCE((SELECT enabled FROM public.fivora_retention_settings WHERE singleton), FALSE) THEN
    RETURN jsonb_build_object('enabled', FALSE, 'reports_deleted', 0, 'reservations_deleted', 0);
  END IF;
  IF NOT pg_try_advisory_xact_lock(20261010, 30002) THEN
    RETURN jsonb_build_object('enabled', TRUE, 'busy', TRUE, 'reports_deleted', 0, 'reservations_deleted', 0);
  END IF;

  SELECT array_agg(candidate.id) INTO v_ids
  FROM (
    SELECT r.id FROM public.reports AS r
    WHERE r.status IN ('selesai', 'ditolak') AND r.retention_expires_at <= statement_timestamp()
      AND NOT EXISTS (SELECT 1 FROM public.facility_maintenance AS m
        WHERE m.report_id = r.id AND m.completed_at IS NULL)
    ORDER BY r.retention_expires_at, r.id LIMIT p_limit
    FOR UPDATE OF r SKIP LOCKED
  ) AS candidate;

  IF v_ids IS NOT NULL THEN
    INSERT INTO public.fivora_retention_photos(photo_path)
    SELECT photo_path FROM public.reports WHERE id = ANY(v_ids)
    ON CONFLICT (photo_path) DO NOTHING;

    DELETE FROM public.maintenance_notes AS n
    USING public.facility_maintenance AS m
    WHERE n.maintenance_id = m.id AND m.report_id = ANY(v_ids);
    DELETE FROM public.facility_maintenance WHERE report_id = ANY(v_ids) AND completed_at IS NOT NULL;
    DELETE FROM public.report_progress_notes WHERE report_id = ANY(v_ids);
    DELETE FROM public.reports WHERE id = ANY(v_ids);
    GET DIAGNOSTICS v_reports = ROW_COUNT;
  END IF;

  DELETE FROM public.reservations AS r
  USING (
    SELECT candidate.id FROM public.reservations AS candidate
    WHERE candidate.retention_expires_at <= statement_timestamp()
    ORDER BY candidate.retention_expires_at, candidate.id LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ) AS expired
  WHERE r.id = expired.id;
  GET DIAGNOSTICS v_reservations = ROW_COUNT;

  RETURN jsonb_build_object('enabled', TRUE,
    'reports_deleted', v_reports, 'reservations_deleted', v_reservations);
END;
$$;

CREATE OR REPLACE FUNCTION public.fivora_claim_retention_photos(p_limit INTEGER DEFAULT 100)
RETURNS TABLE(photo_path TEXT, lease_token UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_token UUID := gen_random_uuid();
BEGIN
  IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Ukuran batch harus 1 sampai 500.';
  END IF;
  IF NOT COALESCE((SELECT enabled FROM public.fivora_retention_settings WHERE singleton), FALSE) THEN
    RETURN;
  END IF;
  RETURN QUERY
  UPDATE public.fivora_retention_photos AS q
  SET lease_token = v_token, retry_at = clock_timestamp() + INTERVAL '5 minutes',
    attempts = q.attempts + 1
  FROM (
    SELECT p.photo_path FROM public.fivora_retention_photos AS p
    WHERE p.retry_at <= statement_timestamp()
    ORDER BY p.queued_at, p.photo_path LIMIT p_limit FOR UPDATE SKIP LOCKED
  ) AS candidate
  WHERE q.photo_path = candidate.photo_path
  RETURNING q.photo_path, q.lease_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.fivora_ack_retention_photos(p_paths TEXT[], p_token UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_count INTEGER;
BEGIN
  IF p_token IS NULL OR p_paths IS NULL OR cardinality(p_paths) NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Konfirmasi penghapusan foto tidak valid.';
  END IF;
  DELETE FROM public.fivora_retention_photos
  WHERE photo_path = ANY(p_paths) AND lease_token = p_token;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Pengguna tidak mendapat hak menghapus riwayat atau menjalankan pembersihan.
REVOKE ALL ON FUNCTION public.fivora_retention_preview(),
  public.fivora_purge_expired_data(INTEGER), public.fivora_claim_retention_photos(INTEGER),
  public.fivora_ack_retention_photos(TEXT[], UUID)
FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fivora_retention_preview(),
  public.fivora_purge_expired_data(INTEGER), public.fivora_claim_retention_photos(INTEGER),
  public.fivora_ack_retention_photos(TEXT[], UUID) TO service_role;
REVOKE ALL ON FUNCTION public.fivora_stamp_report_closure() FROM PUBLIC, anon, authenticated, service_role;

-- Riwayat kedaluwarsa tidak ditampilkan sejak tenggat, meski cron belum berjalan.
DROP POLICY IF EXISTS reports_retention_visible ON public.reports;
CREATE POLICY reports_retention_visible ON public.reports AS RESTRICTIVE
FOR SELECT TO authenticated
USING (retention_expires_at IS NULL OR retention_expires_at > statement_timestamp());

DROP POLICY IF EXISTS reservations_retention_visible ON public.reservations;
CREATE POLICY reservations_retention_visible ON public.reservations AS RESTRICTIVE
FOR SELECT TO anon, authenticated
USING (retention_expires_at > statement_timestamp());

DROP POLICY IF EXISTS maintenance_retention_visible ON public.facility_maintenance;
CREATE POLICY maintenance_retention_visible ON public.facility_maintenance AS RESTRICTIVE
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.reports AS r WHERE r.id = report_id));

DROP POLICY IF EXISTS maintenance_notes_retention_visible ON public.maintenance_notes;
CREATE POLICY maintenance_notes_retention_visible ON public.maintenance_notes AS RESTRICTIVE
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.facility_maintenance AS m WHERE m.id = maintenance_id));

DROP POLICY IF EXISTS report_progress_retention_visible ON public.report_progress_notes;
CREATE POLICY report_progress_retention_visible ON public.report_progress_notes AS RESTRICTIVE
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.reports AS r WHERE r.id = report_id));

NOTIFY pgrst, 'reload schema';
COMMIT;
