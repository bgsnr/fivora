import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type Context = {
  params: Promise<{ id: string }>
}

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  Vary: 'Cookie',
  'X-Content-Type-Options': 'nosniff',
}

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: privateHeaders }
  )
}

export async function GET(
  _request: Request,
  { params }: Context
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return fail('Silakan login terlebih dahulu.', 401)
    }

    if (
      currentUser.status !== 'aktif' ||
      !['pengguna', 'petugas', 'admin'].includes(currentUser.role)
    ) {
      return fail('Akun tidak memiliki akses.', 403)
    }

    const { id } = await params

    if (
      !/^[1-9]\d{0,18}$/.test(id) ||
      BigInt(id) > BigInt('9223372036854775807')
    ) {
      return fail('Laporan tidak ditemukan.', 404)
    }

    const supabase = await createClient()

    let query = supabase
      .from('reports')
      .select('photo_path')
      .eq('id', id)

    if (currentUser.role === 'pengguna') {
      query = query.eq('user_id', currentUser.id)
    }

    const { data: report, error: reportError } = await query
      .maybeSingle()

    if (reportError) {
      console.error('Gagal memeriksa akses foto:', reportError)
      return fail('Foto belum dapat dimuat.', 500)
    }

    if (!report) {
      return fail('Laporan tidak ditemukan.', 404)
    }

    const { data: photo, error: photoError } = await supabaseAdmin
      .storage
      .from('report-photos')
      .download(report.photo_path)

    if (photoError || !photo) {
      console.error('Gagal mengambil foto laporan:', photoError)
      return fail('Foto belum dapat dimuat.', 500)
    }

    const contentType = photo.type.split(';')[0].trim()

    if (!['image/jpeg', 'image/png'].includes(contentType)) {
      return fail('Format foto tidak didukung.', 415)
    }

    return new Response(photo, {
      status: 200,
      headers: {
        ...privateHeaders,
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
      },
    })
  } catch (error) {
    console.error('Kesalahan saat mengambil foto:', error)
    return fail('Terjadi kesalahan saat memuat foto.', 500)
  }
}