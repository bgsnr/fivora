import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function getJenisPengguna(email: string) {
  const domain = email
    .toLowerCase()
    .split('@')[1]

  if (domain === 'students.undip.ac.id') {
    return 'students'
  }

  if (domain === 'lecturer.undip.ac.id') {
    return 'lecturer'
  }

  if (domain === 'staff.undip.ac.id') {
    return 'staff'
  }

  return null
}

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
    const {
      data: currentUser,
      error: currentUserError,
    } = await supabase
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
          error:
            'Akses hanya untuk administrator.',
        },
        {
          status: 403,
        }
      )
    }

    const body = await request.json()

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : ''

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''

    const nimNip =
      typeof body.nim_nip === 'string'
        ? body.nim_nip.trim()
        : ''

    const password =
      typeof body.password === 'string'
        ? body.password
        : ''

    // Validasi field wajib
    if (
      !name ||
      !email ||
      !nimNip ||
      !password
    ) {
      return NextResponse.json(
        {
          error:
            'Nama, email, NIM/NIP, dan password wajib diisi.',
        },
        {
          status: 400,
        }
      )
    }

    // Validasi password
    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            'Password minimal 8 karakter.',
        },
        {
          status: 400,
        }
      )
    }

    // Validasi email SSO
    const jenisPengguna =
      getJenisPengguna(email)

    if (!jenisPengguna) {
      return NextResponse.json(
        {
          error:
            'Email harus menggunakan email SSO UNDIP yang valid.',
        },
        {
          status: 400,
        }
      )
    }

    // NIM/NIP hanya boleh angka
    if (!/^\d+$/.test(nimNip)) {
      return NextResponse.json(
        {
          error:
            'NIM/NIP hanya boleh berisi angka.',
        },
        {
          status: 400,
        }
      )
    }

    // Validasi panjang NIM/NIP berdasarkan jenis pengguna
    if (
      jenisPengguna === 'students' &&
      !/^\d{14}$/.test(nimNip)
    ) {
      return NextResponse.json(
        {
          error:
            'NIM mahasiswa harus terdiri dari 14 digit.',
        },
        {
          status: 400,
        }
      )
    }

    if (
      (jenisPengguna === 'lecturer' ||
        jenisPengguna === 'staff') &&
      !/^\d{18}$/.test(nimNip)
    ) {
      return NextResponse.json(
        {
          error:
            'NIP dosen/staf harus terdiri dari 18 digit.',
        },
        {
          status: 400,
        }
      )
    }

    // Cek apakah email sudah digunakan
    const {
      data: existingEmail,
      error: existingEmailError,
    } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingEmailError) {
      console.error(
        'CHECK EMAIL ERROR:',
        existingEmailError
      )

      return NextResponse.json(
        {
          error:
            'Gagal memeriksa email pengguna.',
        },
        {
          status: 500,
        }
      )
    }

    if (existingEmail) {
      return NextResponse.json(
        {
          error:
            'Email tersebut sudah terdaftar.',
        },
        {
          status: 409,
        }
      )
    }

    // Cek apakah NIM/NIP sudah digunakan
    const {
      data: existingNimNip,
      error: existingNimNipError,
    } =
      await supabaseAdmin
        .from('users')
        .select('id')
        .eq('nim_nip', nimNip)
        .maybeSingle()

    if (existingNimNipError) {
      console.error(
        'CHECK NIM NIP ERROR:',
        existingNimNipError
      )

      return NextResponse.json(
        {
          error:
            'Gagal memeriksa NIM/NIP.',
        },
        {
          status: 500,
        }
      )
    }

    if (existingNimNip) {
      return NextResponse.json(
        {
          error:
            'NIM/NIP tersebut sudah terdaftar.',
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
        email_confirm: true,
        user_metadata: {
          source: 'admin_create',
          name,
          nim_nip: nimNip,
        },
      })

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        'CREATE AUTH USER ERROR:',
        authError
      )

      return NextResponse.json(
        {
          error:
            authError?.message ||
            'Gagal membuat akun pengguna.',
        },
        {
          status: 400,
        }
      )
    }

    // Simpan profile ke public.users
    const {
      error: profileError,
    } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        name,
        email,
        nim_nip: nimNip,
        jenis_pengguna: jenisPengguna,
        role: 'pengguna',
        status: 'aktif',
      })

    // Kalau profile gagal dibuat,
    // hapus user Auth agar tidak menggantung
    if (profileError) {
      console.error(
        'CREATE USER PROFILE ERROR:',
        profileError
      )

      await supabaseAdmin.auth.admin.deleteUser(
        authData.user.id
      )

      return NextResponse.json(
        {
          error:
            profileError.message ||
            'Gagal membuat data pengguna.',
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        message:
          'Akun pengguna berhasil dibuat dan langsung aktif.',
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(
      'CREATE USER ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    )
  }
}