import { NextResponse } from 'next/server'

import { supabaseAdmin } from '@/lib/supabase/admin'

function getJenisPengguna(email: string) {
  const cleanEmail = email.trim().toLowerCase()

  if (cleanEmail.endsWith('@students.undip.ac.id')) {
    return 'students'
  }

  if (cleanEmail.endsWith('@lecturer.undip.ac.id')) {
    return 'lecturer'
  }

  if (cleanEmail.endsWith('@staff.undip.ac.id')) {
    return 'staff'
  }

  return null
}

export async function POST(request: Request) {
  try {
    // Ambil data dari request
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
    if (!name || !email || !nimNip || !password) {
      return NextResponse.json(
        {
          error:
            'Nama, email, NIM/NIP, dan password wajib diisi.',
        },
        { status: 400 }
      )
    }

    // Validasi nama
    if (name.length < 3) {
      return NextResponse.json(
        {
          error: 'Nama lengkap minimal 3 karakter.',
        },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Masukkan email yang valid.',
        },
        { status: 400 }
      )
    }

    // Tentukan jenis pengguna berdasarkan domain email
    const jenisPengguna = getJenisPengguna(email)

    if (!jenisPengguna) {
      return NextResponse.json(
        {
          error:
            'Gunakan email SSO Undip yang sesuai: @students.undip.ac.id, @lecturer.undip.ac.id, atau @staff.undip.ac.id.',
        },
        { status: 400 }
      )
    }

    // Validasi NIM/NIP hanya angka
    if (!/^\d+$/.test(nimNip)) {
      return NextResponse.json(
        {
          error:
            'NIM/NIP hanya boleh berisi angka.',
        },
        { status: 400 }
      )
    }

    // Validasi NIM mahasiswa
    if (
      jenisPengguna === 'students' &&
      !/^\d{14}$/.test(nimNip)
    ) {
      return NextResponse.json(
        {
          error:
            'NIM mahasiswa harus terdiri dari 14 digit.',
        },
        { status: 400 }
      )
    }

    // Validasi NIP dosen/staf
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
        { status: 400 }
      )
    }

    // Validasi password
    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            'Password minimal 8 karakter.',
        },
        { status: 400 }
      )
    }

    // Cek email yang sudah terdaftar
    const {
      data: existingEmail,
      error: emailCheckError,
    } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle()

    if (emailCheckError) {
      console.error(
        'REGISTER EMAIL CHECK ERROR:',
        emailCheckError
      )

      return NextResponse.json(
        {
          error:
            'Gagal memeriksa email yang sudah terdaftar.',
        },
        { status: 500 }
      )
    }

    if (existingEmail) {
      return NextResponse.json(
        {
          error:
            'Email tersebut sudah terdaftar.',
        },
        { status: 409 }
      )
    }

    // Cek NIM/NIP yang sudah terdaftar
    const {
      data: existingNimNip,
      error: nimNipCheckError,
    } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('nim_nip', nimNip)
      .limit(1)
      .maybeSingle()

    if (nimNipCheckError) {
      console.error(
        'REGISTER NIM/NIP CHECK ERROR:',
        nimNipCheckError
      )

      return NextResponse.json(
        {
          error:
            'Gagal memeriksa NIM/NIP yang sudah terdaftar.',
        },
        { status: 500 }
      )
    }

    if (existingNimNip) {
      return NextResponse.json(
        {
          error:
            'NIM/NIP tersebut sudah terdaftar.',
        },
        { status: 409 }
      )
    }

    // Membuat akun di Supabase Auth
    // Role dan status tidak berasal dari client.
    // Trigger database akan membuat profile dengan:
    // role = pengguna
    // status = menunggu
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          source: 'public_register',
          name,
          nim_nip: nimNip,
        },
      })

    if (authError) {
      console.error(
        'REGISTER AUTH ERROR:',
        authError
      )

      return NextResponse.json(
        {
          error:
            authError.message ||
            'Gagal membuat akun.',
        },
        { status: 400 }
      )
    }

    if (!authData.user) {
      console.error(
        'REGISTER AUTH ERROR: User tidak terbentuk.'
      )

      return NextResponse.json(
        {
          error:
            'Akun gagal dibuat.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message:
          'Registrasi berhasil. Akun menunggu verifikasi admin.',
        userId: authData.user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'REGISTER SERVER ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan pada server.',
      },
      { status: 500 }
    )
  }
}