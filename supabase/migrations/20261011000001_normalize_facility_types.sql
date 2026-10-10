BEGIN;

-- Ejaan tipe diseragamkan pada semua jalur penulisan data master.
-- Tidak mengubah kewenangan admin, status layanan, atau alur perbaikan.
CREATE OR REPLACE FUNCTION public.normalize_facility_type(p_type TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN key IN ('ruang', 'ruangan', 'kelas', 'ruang_kelas', 'ruang_kuliah', 'ruangan_kuliah', 'classroom', 'class') THEN 'Ruang Kelas'
    WHEN key IN ('lab', 'laboratorium', 'laboratory') THEN 'Laboratorium'
    WHEN key IN ('aula', 'auditorium') THEN 'Aula'
    WHEN key IN ('lapangan', 'lapangan_olahraga', 'lapangan_futsal', 'lapangan_basket', 'lapangan_voli', 'lapangan_badminton', 'field') THEN 'Lapangan'
    WHEN key IN ('alat', 'alat_lab', 'peralatan', 'peralatan_lab', 'perlengkapan', 'equipment', 'lainnya', 'other', 'others') THEN 'Lainnya'
    ELSE NULL
  END
  FROM (SELECT regexp_replace(lower(btrim(p_type, E' \t\n\r')), '[[:space:]_/-]+', '_', 'g') AS key) AS input;
$$;

CREATE OR REPLACE FUNCTION public.normalize_facility_type_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE v_type TEXT;
BEGIN
  IF NEW.type IS NULL THEN RETURN NEW; END IF;
  v_type := public.normalize_facility_type(NEW.type);
  IF v_type IS NULL THEN
    RAISE EXCEPTION 'Pilih tipe fasilitas yang tersedia.' USING ERRCODE = '23514';
  END IF;
  NEW.type := v_type;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS facilities_normalize_type ON public.facilities;
CREATE TRIGGER facilities_normalize_type
BEFORE INSERT OR UPDATE OF type ON public.facilities
FOR EACH ROW EXECUTE FUNCTION public.normalize_facility_type_before_write();

CREATE OR REPLACE FUNCTION public.validate_facility_master(
  p_name TEXT, p_type TEXT, p_location TEXT, p_capacity INTEGER, p_description TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF p_name IS NULL OR length(btrim(p_name, E' \t\n\r')) NOT BETWEEN 1 AND 255 THEN
    RAISE EXCEPTION 'Nama fasilitas wajib diisi, maksimal 255 karakter.';
  END IF;
  IF public.normalize_facility_type(p_type) IS NULL THEN
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

REVOKE ALL ON FUNCTION public.normalize_facility_type_before_write()
FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.validate_facility_master(TEXT,TEXT,TEXT,INTEGER,TEXT)
FROM PUBLIC, anon, authenticated, service_role;

-- Tipe lama yang dikenali dipertahankan kategorinya, dengan satu ejaan baku.
UPDATE public.facilities
SET type = public.normalize_facility_type(type), updated_at = clock_timestamp()
WHERE public.normalize_facility_type(type) IS NOT NULL
  AND type IS DISTINCT FROM public.normalize_facility_type(type);

NOTIFY pgrst, 'reload schema';
COMMIT;
