import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

type Context = {
  params: Promise<{ id: string }>
}

type ReportRow = {
  status: ReportStatus
  updated_at: string
}

const allowedTransitions: Record<ReportStatus, ReportStatus[]> = {
  baru: ['diproses', 'ditolak'],
  diproses: ['selesai', 'ditolak'],
  selesai: [],
  ditolak: [],
}

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return fail('Silakan login terlebih dahulu.', 401)
    }

    if (
      currentUser.role !== 'petugas' ||
      currentUser.status !== 'aktif'
    ) {
      return fail('Hanya petugas aktif yang dapat memproses laporan.', 403)
    }

    const { id } = await params

    if (
      !/^[1-9]\d{0,18}$/.test(id) ||
      BigInt(id) > BigInt('9223372036854775807')
    ) {
      return fail('Laporan tidak ditemukan.', 404)
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return fail('Data permintaan tidak valid.', 400)
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return fail('Data permintaan tidak valid.', 400)
    }

    const input = body as Record<string, unknown>
    const status = input.status
    const note = input.note
    const expectedUpdatedAt = input.expectedUpdatedAt
    const laporanUtamaId = input.laporanUtamaId

    if (
      typeof status !== 'string' ||
      !['diproses', 'selesai', 'ditolak'].includes(status)
    ) {
      return fail('Pilih status penanganan yang valid.', 400)
    }

    if (typeof note !== 'string') {
      return fail('Catatan petugas tidak valid.', 400)
    }

    const cleanNote = note.trim()

    if (cleanNote.length > 5000) {
      return fail('Catatan petugas maksimal 5000 karakter.', 400)
    }

    if (
      (status === 'selesai' || status === 'ditolak') &&
      !cleanNote
    ) {
      return fail(
        'Isi catatan sebelum menyelesaikan atau menolak laporan.',
        400
      )
    }

    let parsedLaporanUtamaId: string | null = null

    if (status === 'ditolak' && laporanUtamaId !== undefined && laporanUtamaId !== null && laporanUtamaId !== '') {
      const mainIdStr = String(laporanUtamaId).trim()
      if (!/^[1-9]\d{0,18}$/.test(mainIdStr)) {
        return fail('ID laporan utama tidak valid.', 400)
      }
      parsedLaporanUtamaId = mainIdStr
    }

    if (
      typeof expectedUpdatedAt !== 'string' ||
      expectedUpdatedAt.length > 50 ||
      !Number.isFinite(Date.parse(expectedUpdatedAt))
    ) {
      return fail('Muat ulang halaman sebelum menyimpan perubahan.', 400)
    }

    const supabase = await createClient()

    const { data: report, error: readError } = await supabase
      .from('reports')
      .select('status, updated_at')
      .eq('id', id)
      .returns<ReportRow[]>()
      .maybeSingle()

    if (readError) {
      console.error('Gagal memeriksa status laporan:', readError)
      return fail('Laporan belum dapat diperiksa. Coba lagi.', 500)
    }

    if (!report) {
      return fail('Laporan tidak ditemukan.', 404)
    }

    if (report.updated_at !== expectedUpdatedAt) {
      return fail(
        'Laporan sudah berubah sejak halaman dibuka. Muat ulang halaman sebelum melanjutkan.',
        409
      )
    }

    if (report.status === 'selesai' || report.status === 'ditolak') {
      return fail('Laporan sudah ditutup dan tidak dapat diubah.', 409)
    }

    const nextStatus = status as ReportStatus

    if (!allowedTransitions[report.status].includes(nextStatus)) {
      return fail('Perubahan status tersebut tidak diperbolehkan.', 400)
    }

    const now = new Date().toISOString()

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      officer_note: cleanNote,
      processed_by: currentUser.id,
      processed_at: now,
      updated_at: now,
    }

    if (parsedLaporanUtamaId !== null) {
      updatePayload.laporan_utama_id = parsedLaporanUtamaId
    }

    const { data: updatedReport, error: updateError } = await supabaseAdmin
      .from('reports')
      .update(updatePayload)
      .eq('id', id)
      .eq('status', report.status)
      .eq('updated_at', report.updated_at)
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('Gagal memperbarui laporan:', updateError)
      if (updateError.code === '23514' &&
          updateError.message.includes('perbaikan yang terkait')) {
        return fail('Selesaikan perbaikan yang terkait dengan laporan ini sebelum menutup laporan.', 409)
      }
      return fail('Perubahan gagal disimpan. Silakan coba lagi.', 500)
    }

    if (!updatedReport) {
      return fail(
        'Laporan baru saja diubah petugas lain. Muat ulang halaman sebelum melanjutkan.',
        409
      )
    }

    try {
      revalidatePath('/petugas/laporan')
      revalidatePath(`/petugas/laporan/${id}`)
      revalidatePath('/laporan')
      revalidatePath(`/laporan/${id}`)
      revalidatePath('/admin/laporan')
      revalidatePath('/admin/laporan/[id]', 'page')
    } catch (error) {
      console.error('Gagal menyegarkan halaman laporan:', error)
    }

    return NextResponse.json(
      { message: 'Status laporan berhasil diperbarui.' },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('Kesalahan pemrosesan laporan:', error)
    return fail('Terjadi kesalahan saat memproses laporan.', 500)
  }
}