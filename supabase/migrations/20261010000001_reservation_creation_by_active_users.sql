BEGIN;

-- Aturan ini juga berlaku jika browser memanggil Supabase secara langsung.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own pending reservation" ON public.reservations;
CREATE POLICY "Users can insert own pending reservation"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (
  status = 'menunggu'
  AND EXISTS (
    SELECT 1 FROM public.users AS u
    WHERE u.id = reservations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'pengguna' AND u.status = 'aktif'
  )
);

-- Kebijakan INSERT lain tidak boleh melonggarkan batas role dan kepemilikan.
DROP POLICY IF EXISTS reservations_insert_active_owner ON public.reservations;
CREATE POLICY reservations_insert_active_owner
ON public.reservations AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'menunggu'
  AND EXISTS (
    SELECT 1 FROM public.users AS u
    WHERE u.id = reservations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'pengguna' AND u.status = 'aktif'
  )
);

-- Kode server memakai service_role; pastikan pemesannya tetap pengguna aktif.
-- Reservasi lama dan pemrosesan status oleh petugas tidak ikut diubah.
CREATE OR REPLACE FUNCTION public.check_reservation_requester()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
  v_status TEXT;
BEGIN
  SELECT u.role, u.status INTO v_role, v_status
  FROM public.users AS u WHERE u.id = NEW.user_id FOR SHARE;

  IF v_role IS DISTINCT FROM 'pengguna' OR v_status IS DISTINCT FROM 'aktif' THEN
    RAISE EXCEPTION USING ERRCODE = '42501',
      MESSAGE = 'Reservasi hanya dapat diajukan oleh pengguna aktif.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_check_requester ON public.reservations;
CREATE TRIGGER reservations_check_requester
BEFORE INSERT ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.check_reservation_requester();

REVOKE ALL ON FUNCTION public.check_reservation_requester()
FROM PUBLIC, anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
