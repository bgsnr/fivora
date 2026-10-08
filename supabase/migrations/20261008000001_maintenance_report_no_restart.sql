BEGIN;

-- Pertahankan seluruh riwayat lama. Aturan ini berlaku untuk kegiatan baru.
CREATE OR REPLACE FUNCTION public.check_maintenance_report_no_restart()
RETURNS TRIGGER
LANGUAGE plpgsql VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.completed_at IS NOT NULL AND NEW.completed_at IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514',
        MESSAGE = 'Perbaikan yang sudah selesai tidak dapat dibuka kembali.';
    END IF;
  END IF;

  IF NEW.completed_at IS NULL THEN
    -- Start RPC telah mengunci fasilitas, lalu laporan. Kunci laporan yang
    -- sama juga melindungi penulisan melalui jalur lain.
    PERFORM 1 FROM public.reports AS r
    WHERE r.id = NEW.report_id FOR UPDATE;

    IF EXISTS (
      SELECT 1 FROM public.facility_maintenance AS m
      WHERE m.report_id = NEW.report_id
        AND m.completed_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION USING ERRCODE = '23514',
        MESSAGE = 'Perbaikan melalui laporan ini sudah selesai. Kegiatan baru harus menggunakan laporan lain yang valid dan berstatus Diproses.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS maintenance_check_report_no_restart
ON public.facility_maintenance;
CREATE TRIGGER maintenance_check_report_no_restart
BEFORE INSERT OR UPDATE OF report_id, facility_id, completed_at
ON public.facility_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.check_maintenance_report_no_restart();

REVOKE ALL ON FUNCTION public.check_maintenance_report_no_restart()
FROM PUBLIC, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
