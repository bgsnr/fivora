
BEGIN;

-- =====================================================
-- 1. Lengkapi kolom tabel users
-- =====================================================

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS nim_nip VARCHAR(255),
    ADD COLUMN IF NOT EXISTS jenis_pengguna VARCHAR(20),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Normalisasi data lama tanpa mengubah status akun.
UPDATE public.users
SET
    email = LOWER(BTRIM(email)),
    name = BTRIM(name),
    nim_nip = NULLIF(BTRIM(nim_nip), ''),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE email IS NOT NULL;


-- =====================================================
-- 2. Periksa kelengkapan dan konsistensi data lama
-- Akun ditolak boleh mempertahankan NIM/NIP historis
-- yang formatnya tidak sesuai aturan terbaru.
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE auth_user_id IS NULL
           OR name IS NULL
           OR LENGTH(BTRIM(name)) < 3
           OR email IS NULL
           OR BTRIM(email) = ''
           OR jenis_pengguna IS NULL
           OR jenis_pengguna NOT IN (
               'students',
               'lecturer',
               'staff'
           )
    ) THEN
        RAISE EXCEPTION
            'Ada profil users yang belum memenuhi data wajib. Periksa sebelum migrasi.';
    END IF;

    -- Akun pengguna yang belum ditolak harus memiliki
    -- NIM 14 digit atau NIP 18 digit sesuai jenisnya.
    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE status <> 'ditolak'
          AND role = 'pengguna'
          AND (
              nim_nip IS NULL
              OR NOT (
                  (
                      jenis_pengguna = 'students'
                      AND nim_nip ~ '^[0-9]{14}$'
                  )
                  OR (
                      jenis_pengguna IN ('lecturer', 'staff')
                      AND nim_nip ~ '^[0-9]{18}$'
                  )
              )
          )
    ) THEN
        RAISE EXCEPTION
            'Ada akun pengguna yang belum ditolak dengan format NIM/NIP tidak valid.';
    END IF;

    -- Periksa duplikasi email tanpa membedakan kapitalisasi.
    IF EXISTS (
        SELECT LOWER(BTRIM(email))
        FROM public.users
        GROUP BY LOWER(BTRIM(email))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Ada email duplikat pada tabel users.';
    END IF;

    -- Periksa duplikasi nomor identitas.
    IF EXISTS (
        SELECT nim_nip
        FROM public.users
        WHERE nim_nip IS NOT NULL
        GROUP BY nim_nip
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Ada NIM/NIP duplikat pada tabel users.';
    END IF;
END;
$$;


-- =====================================================
-- 3. Pastikan kolom wajib dan default tersedia
-- =====================================================

ALTER TABLE public.users
    ALTER COLUMN auth_user_id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN jenis_pengguna SET NOT NULL,
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET NOT NULL;


-- =====================================================
-- 4. Pastikan identitas unik
-- Index dengan nama yang sama akan digunakan jika sudah ada.
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
    ON public.users (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_nim_nip_unique
    ON public.users (nim_nip)
    WHERE nim_nip IS NOT NULL;


-- =====================================================
-- 5. Validasi panjang nama minimal 3 karakter
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_name_min_length_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_name_min_length_check
        CHECK (LENGTH(BTRIM(name)) >= 3);
    END IF;
END;
$$;


-- =====================================================
-- 6. Validasi NIM/NIP
-- Akun ditolak tetap disimpan sebagai riwayat.
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_nim_nip_format_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_nim_nip_format_check
        CHECK (
            status = 'ditolak'
            OR (
                role = 'pengguna'
                AND nim_nip IS NOT NULL
                AND (
                    (
                        jenis_pengguna = 'students'
                        AND nim_nip ~ '^[0-9]{14}$'
                    )
                    OR (
                        jenis_pengguna IN ('lecturer', 'staff')
                        AND nim_nip ~ '^[0-9]{18}$'
                    )
                )
            )
            OR (
                role IN ('petugas', 'admin')
                AND (
                    nim_nip IS NULL
                    OR (
                        jenis_pengguna = 'students'
                        AND nim_nip ~ '^[0-9]{14}$'
                    )
                    OR (
                        jenis_pengguna IN ('lecturer', 'staff')
                        AND nim_nip ~ '^[0-9]{18}$'
                    )
                )
            )
        );
    END IF;
END;
$$;


-- =====================================================
-- 7. Perbarui updated_at setiap profil diubah
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at
ON public.users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_users_updated_at();

COMMIT;