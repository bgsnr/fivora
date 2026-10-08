'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type ProgressEntry = { id: string; note: string; createdAt: string }
type ReadResult =
  | { success: true; entries: ProgressEntry[]; hasMore: boolean; canAdd: boolean }
  | { success: false; error: string }
type SaveResult =
  | { success: true; entry: ProgressEntry }
  | { success: false; error: string }

function validId(value: string) {
  return typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= BigInt('9223372036854775807')
}

export async function getReportProgress(
  reportId: string, beforeId?: string
): Promise<ReadResult> {
  try {
    if (!validId(reportId) || (beforeId !== undefined && !validId(beforeId))) {
      return { success: false, error: 'ID laporan atau catatan tidak valid.' }
    }
    const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' ||
        !['pengguna', 'petugas', 'admin'].includes(user.role)) {
      return { success: false, error: 'Silakan login menggunakan akun aktif.' }
    }
    const supabase = await createClient()
    let reportQuery = supabase.from('reports').select('status').eq('id', reportId)
    if (user.role === 'pengguna') reportQuery = reportQuery.eq('user_id', user.id)
    const reportResult = await reportQuery.maybeSingle()
    if (reportResult.error) {
      return { success: false, error: 'Data laporan gagal dimuat. Coba lagi.' }
    }
    if (!reportResult.data) return { success: false, error: 'Laporan tidak ditemukan.' }

    let query = supabase.from('report_progress_notes')
      .select('id, note, created_at').eq('report_id', reportId)
    if (beforeId !== undefined) query = query.lt('id', beforeId)
    const { data, error } = await query.order('id', { ascending: false }).limit(21)
    if (error) {
      console.error('Gagal membaca perkembangan laporan:', error)
      return { success: false, error: 'Perkembangan laporan gagal dimuat. Klik Muat ulang.' }
    }
    return {
      success: true,
      entries: (data ?? []).slice(0, 20).map((item) => ({
        id: String(item.id), note: item.note, createdAt: item.created_at,
      })),
      hasMore: (data ?? []).length > 20,
      canAdd: user.role === 'petugas' && reportResult.data.status === 'diproses',
    }
  } catch (error) {
    console.error('Kesalahan membaca perkembangan laporan:', error)
    return { success: false, error: 'Perkembangan laporan gagal dimuat. Coba lagi.' }
  }
}

export async function addReportProgress(
  reportId: string, note: string, requestId: string
): Promise<SaveResult> {
  try {
    if (!validId(reportId) || typeof note !== 'string' ||
        typeof requestId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      return { success: false, error: 'Data catatan tidak valid. Muat ulang halaman.' }
    }
    const cleanNote = note.trim()
    if (!cleanNote || cleanNote.length > 5000) {
      return { success: false, error: 'Catatan perkembangan wajib diisi, maksimal 5000 karakter.' }
    }
    const user = await getCurrentUser()
    if (!user || user.role !== 'petugas' || user.status !== 'aktif') {
      return { success: false, error: 'Hanya petugas aktif yang dapat menambahkan perkembangan laporan.' }
    }
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('add_report_progress_note', {
      p_report_id: reportId, p_note: cleanNote, p_request_id: requestId,
    })
    if (error) {
      console.error('Gagal menyimpan perkembangan laporan:', error)
      return {
        success: false,
        error: error.code === 'P0001' ? error.message :
          'Catatan belum dapat disimpan. Coba lagi atau muat ulang untuk memeriksa hasilnya.',
      }
    }
    if (!data || typeof data.id !== 'string' || typeof data.note !== 'string' ||
        typeof data.created_at !== 'string') {
      return { success: false, error: 'Hasil penyimpanan belum dapat dipastikan. Muat ulang untuk memeriksa catatan.' }
    }
    // Penyimpanan sudah berhasil; kegagalan revalidasi tidak boleh meminta kirim ulang.
    try {
      revalidatePath('/laporan/[id]', 'page')
      revalidatePath('/petugas/laporan/[id]', 'page')
    } catch (error) {
      console.error('Gagal menyegarkan perkembangan laporan:', error)
    }
    return { success: true, entry: { id: data.id, note: data.note, createdAt: data.created_at } }
  } catch (error) {
    console.error('Kesalahan menyimpan perkembangan laporan:', error)
    return { success: false, error: 'Koneksi terputus. Muat ulang untuk memeriksa catatan, atau coba simpan kembali.' }
  }
}
