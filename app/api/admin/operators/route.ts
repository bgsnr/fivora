import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Cek user yang sedang login
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Kamu belum login.',
        },
        {
          status: 401,
        }
      )
    }

    // Cek apakah user yang login adalah admin aktif
    const { data: currentUser, error: currentUserError } =
      await supabase
        .from('users')
        .select('id, role, status')
        .eq('auth_user_id', user.id)
        .single()

    if (
      currentUserError ||
      !currentUser ||
      currentUser.role !== 'admin' ||
      currentUser.status !== 'aktif'
    ) {
      return NextResponse.json(
        {
          error: 'Akses hanya untuk administrator.',
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    // Validasi input
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: 'Nama, email, dan password wajib diisi.',
        },
        {
          status: 400,
        }
      )
    }

    // Validasi password
    if (password.length < 6) {
      return NextResponse.json(
        {
          error: 'Password minimal 6 karakter.',
        },
        {
          status: 400,
        }
      )
    }

    // Operator harus menggunakan email operator UNDIP
    if (!email.endsWith('@operator.undip.ac.id')) {
      return NextResponse.json(
        {
          error:
            'Email operator harus menggunakan @operator.undip.ac.id.',
        },
        {
          status: 400,
        }
      )
    }

    // Cek apakah email sudah digunakan di public.users
    const { data: existingUser, error: existingUserError } =
      await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (existingUserError) {
      console.error(
        'CHECK EXISTING USER ERROR:',
        existingUserError
      )

      return NextResponse.json(
        {
          error: 'Gagal memeriksa email pengguna.',
        },
        {
          status: 500,
        }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'Email tersebut sudah terdaftar.',
        },
        {
          status: 409,
        }
      )
    }

    // Buat akun di Supabase Auth
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,

        // Akun yang dibuat admin langsung terkonfirmasi
        email_confirm: true,

        user_metadata: {
          source: 'admin_create',
          name,
        },
      })

    if (authError || !authData.user) {
      console.error(
        'CREATE AUTH USER ERROR:',
        authError
      )

      return NextResponse.json(
        {
          error:
            authError?.message ||
            'Gagal membuat akun Auth.',
        },
        {
          status: 400,
        }
      )
    }

    // Simpan data operator ke public.users
    const { error: profileError } =
      await supabaseAdmin
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          name,
          email,

          // NIM/NIP tidak wajib untuk akun operator
          nim_nip: null,

          // Operator dianggap sebagai staf
          jenis_pengguna: 'staff',

          // Role khusus operator
          role: 'petugas',

          // Langsung aktif karena dibuat admin
          status: 'aktif',
        })

    // Kalau profile gagal dibuat,
    // hapus akun Auth agar tidak ada akun yang menggantung
    if (profileError) {
      console.error(
        'CREATE OPERATOR PROFILE ERROR:',
        profileError
      )

      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      )

      return NextResponse.json(
        {
          error:
            profileError.message ||
            'Gagal membuat data operator.',
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        message:
          'Akun operator berhasil dibuat dan langsung aktif.',
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'CREATE OPERATOR ERROR:',
      error
    )

    return NextResponse.json(
      {
        error: 'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    )
  }
}