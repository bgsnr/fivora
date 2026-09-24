import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string
    }>
  }
) {
  try {
    // Ambil session admin dari cookie
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: 'Anda belum login.',
        },
        {
          status: 401,
        }
      )
    }

    // Pastikan yang melakukan aksi benar-benar admin aktif
    const {
      data: admin,
      error: adminError,
    } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('auth_user_id', user.id)
      .single()

    if (
      adminError ||
      !admin ||
      admin.role !== 'admin' ||
      admin.status !== 'aktif'
    ) {
      return NextResponse.json(
        {
          error:
            'Hanya admin aktif yang dapat melakukan verifikasi.',
        },
        {
          status: 403,
        }
      )
    }

    const { id } = await params

    const body = await request.json()

    if (
      body.status !== 'aktif' &&
      body.status !== 'ditolak'
    ) {
      return NextResponse.json(
        {
          error: 'Status tidak valid.',
        },
        {
          status: 400,
        }
      )
    }

    // Hanya akun yang masih menunggu yang dapat diproses
    const {
      data,
      error,
    } = await supabaseAdmin
      .from('users')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', Number(id))
      .eq('status', 'menunggu')
      .select(
        'id, name, email, status'
      )
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            'Pendaftaran tidak ditemukan atau sudah diproses.',
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json({
      message:
        body.status === 'aktif'
          ? 'Akun berhasil disetujui.'
          : 'Pendaftaran berhasil ditolak.',
      user: data,
    })
  } catch {
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