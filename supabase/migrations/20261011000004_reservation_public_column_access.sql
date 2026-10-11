
BEGIN;

-- Hapus kebijakan SELECT lama yang membuka seluruh
-- kolom reservasi berstatus disetujui untuk publik.
DROP POLICY IF EXISTS
    "Users can read own or approved reservations, staff can read all"
ON public.reservations;

DROP POLICY IF EXISTS
    "Public can read approved reservation slots"
ON public.reservations;

CREATE POLICY "Public can read approved reservation slots"
ON public.reservations
FOR SELECT
TO anon
USING (status IN ('disetujui', 'approved'));

DROP POLICY IF EXISTS
    "Authenticated users read own or staff reservations"
ON public.reservations;

CREATE POLICY "Authenticated users read own or staff reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (
    user_id IN (
        SELECT profile.user_id
        FROM public.get_current_user_profile() AS profile
    )
    OR EXISTS (
        SELECT 1
        FROM public.get_current_user_profile() AS profile
        WHERE profile.role IN ('petugas', 'admin')
    )
);

-- Cabut izin baca/tulis seluruh tabel untuk publik.
REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLE public.reservations
FROM PUBLIC, anon;

-- Pengunjung hanya dapat membaca kolom untuk ketersediaan.
GRANT SELECT (
    facility_id,
    reservation_date,
    start_time,
    end_time,
    status
)
ON public.reservations TO anon;

-- Pengguna login tetap membaca reservasi melalui RLS.
GRANT SELECT
ON TABLE public.reservations TO authenticated;

-- Pengunjung tidak boleh menulis reservasi.
REVOKE INSERT, UPDATE, DELETE
ON TABLE public.reservations FROM anon;

-- Pengguna login tidak boleh menghapus reservasi langsung.
REVOKE DELETE
ON TABLE public.reservations FROM authenticated;

COMMIT;
