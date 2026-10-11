
BEGIN;

-- =====================================================
-- 1. Menentukan jenis pengguna dari domain email UNDIP
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_jenis_pengguna(
    p_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
    email_domain TEXT;
BEGIN
    email_domain := LOWER(
        SPLIT_PART(BTRIM(COALESCE(p_email, '')), '@', 2)
    );

    CASE email_domain
        WHEN 'students.undip.ac.id' THEN
            RETURN 'students';

        WHEN 'lecturer.undip.ac.id' THEN
            RETURN 'lecturer';

        WHEN 'staff.undip.ac.id' THEN
            RETURN 'staff';

        ELSE
            RETURN NULL;
    END CASE;
END;
$$;


-- =====================================================
-- 2. Membuat profil pengguna setelah registrasi publik
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    detected_user_type TEXT;
    v_email TEXT;
    v_name TEXT;
    v_nim_nip TEXT;
BEGIN

    -- Trigger ini hanya memproses registrasi publik.
    -- Akun yang dibuat admin diproses oleh endpoint admin.
    IF NEW.raw_user_meta_data ->> 'source'
       IS DISTINCT FROM 'public_register' THEN
        RETURN NEW;
    END IF;

    -- Normalisasi email dan data profil.
    v_email := LOWER(BTRIM(COALESCE(NEW.email, '')));

    v_name := BTRIM(
        COALESCE(
            NEW.raw_user_meta_data ->> 'name',
            ''
        )
    );

    v_nim_nip := NULLIF(
        BTRIM(
            NEW.raw_user_meta_data ->> 'nim_nip'
        ),
        ''
    );

    -- Validasi email.
    detected_user_type :=
        public.get_jenis_pengguna(v_email);

    IF detected_user_type IS NULL THEN
        RAISE EXCEPTION
            'Email harus menggunakan email SSO UNDIP yang valid.';
    END IF;

    -- Validasi nama.
    IF LENGTH(v_name) < 3 THEN
        RAISE EXCEPTION
            'Nama lengkap minimal harus terdiri dari 3 karakter.';
    END IF;

    -- Validasi NIM mahasiswa: 14 digit.
    IF detected_user_type = 'students'
       AND (
           v_nim_nip IS NULL
           OR v_nim_nip !~ '^[0-9]{14}$'
       )
    THEN
        RAISE EXCEPTION
            'NIM mahasiswa harus terdiri dari 14 digit.';
    END IF;

    -- Validasi NIP dosen dan staf: 18 digit.
    IF detected_user_type IN ('lecturer', 'staff')
       AND (
           v_nim_nip IS NULL
           OR v_nim_nip !~ '^[0-9]{18}$'
       )
    THEN
        RAISE EXCEPTION
            'NIP dosen/staf harus terdiri dari 18 digit.';
    END IF;

    -- Membuat profil pengguna.
    -- Registrasi publik selalu ber-role pengguna
    -- dan berstatus menunggu verifikasi admin.
    INSERT INTO public.users (
        auth_user_id,
        name,
        email,
        nim_nip,
        jenis_pengguna,
        role,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        v_name,
        v_email,
        v_nim_nip,
        detected_user_type,
        'pengguna',
        'menunggu',
        NOW(),
        NOW()
    );

    RETURN NEW;
END;
$$;


-- =====================================================
-- 3. Membuat atau memperbarui trigger registrasi
-- =====================================================

-- Pastikan hanya ada satu trigger dengan nama ini.
DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;