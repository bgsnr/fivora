BEGIN;

-- Pengguna hanya membaca perbaikan yang didasarkan pada laporannya sendiri.
-- Laporan lain pada fasilitas yang sama tetap tidak dapat diakses.
-- Hak INSERT/UPDATE/DELETE dan kebijakan petugas tidak berubah.
DROP POLICY IF EXISTS maintenance_read_by_report_owner
ON public.facility_maintenance;

CREATE POLICY maintenance_read_by_report_owner
ON public.facility_maintenance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.reports AS report
    JOIN public.users AS profile ON profile.id = report.user_id
    WHERE report.id = facility_maintenance.report_id
      AND profile.auth_user_id = (SELECT auth.uid())
      AND profile.role = 'pengguna'
      AND profile.status = 'aktif'
  )
);

COMMIT;
