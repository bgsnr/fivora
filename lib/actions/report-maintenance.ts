'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export type MaintenanceNote = {
  id: string
  maintenanceId: string
  note: string
  createdAt: string
}

export type MaintenanceReadState = {
  reportId: string
  checking: boolean
  ownOpen: boolean
  error: string
}

export type MaintenanceData = {
  history: {
    id: string
    reason: string
    startedAt: string
    completedAt: string
    completionNote: string
  }[]
  notes: MaintenanceNote[]
  facilityStatus: string
  reportStatus: string
  openMaintenance: {
    id: string
    reportId: string
    reason: string
    startedAt: string
  } | null
}

type ReadResult =
  | { success: true; data: MaintenanceData }
  | { success: false; error: string }

type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

function validId(value: string) {
  return (
    typeof value === 'string' &&
    /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= BigInt('9223372036854775807')
  )
}

async function getStaffClient() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'petugas' || user.status !== 'aktif') {
    return null
  }

  return createClient()
}

function refreshMaintenancePages() {
  try {
    revalidatePath('/laporan')
    revalidatePath('/laporan/[id]', 'page')
    revalidatePath('/petugas/laporan')
    revalidatePath('/petugas/laporan/[id]', 'page')
    revalidatePath('/petugas/fasilitas')
    revalidatePath('/petugas/fasilitas/[id]', 'page')
    revalidatePath('/fasilitas')
    revalidatePath('/fasilitas/[id]', 'page')
    revalidatePath('/reservations')
    revalidatePath('/reservations/[id]', 'page')
    revalidatePath('/petugas/reservations')
    revalidatePath('/petugas/reservations/[id]', 'page')
  } catch (error) {
    console.error('Gagal menyegarkan halaman perbaikan:', error)
  }
}

export async function getReportMaintenance(
  reportId: string
): Promise<ReadResult> {
  try {
    if (!validId(reportId)) {
      return { success: false, error: 'ID laporan tidak valid.' }
    }

    const supabase = await getStaffClient()

    if (!supabase) {
      return {
        success: false,
        error: 'Silakan login menggunakan akun petugas aktif.',
      }
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('facility_id, status')
      .eq('id', reportId)
      .maybeSingle()

    if (reportError) {
      console.error('Gagal mengambil laporan perbaikan:', reportError)
      return { success: false, error: 'Data laporan gagal dimuat.' }
    }

    if (!report) {
      return { success: false, error: 'Laporan tidak ditemukan.' }
    }

    const [facilityResult, maintenanceResult, historyResult] = await Promise.all([
      supabase
        .from('facilities')
        .select('status')
        .eq('id', report.facility_id)
        .maybeSingle(),

      supabase
        .from('facility_maintenance')
        .select('id, report_id, reason, started_at')
        .eq('facility_id', report.facility_id)
        .is('completed_at', null)
        .maybeSingle(),
      supabase.from('facility_maintenance')
        .select('id, reason, started_at, completed_at, completion_note')
        .eq('report_id', reportId)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false })
        .order('id', { ascending: false }),
    ])

    if (
      facilityResult.error ||
      maintenanceResult.error ||
      historyResult.error ||
      !facilityResult.data
    ) {
      console.error(
        'Gagal mengambil data perbaikan:',
        facilityResult.error,
        maintenanceResult.error
      )

      return {
        success: false,
        error: 'Data perbaikan fasilitas gagal dimuat.',
      }
    }

    const maintenance = maintenanceResult.data
    const maintenanceIds = [...new Set([
      ...(historyResult.data ?? []).map((item) => String(item.id)),
      ...(maintenance ? [String(maintenance.id)] : []),
    ])]
    const notes: MaintenanceNote[] = []
    if (maintenanceIds.length > 0) {
      const result = await supabase.from('maintenance_notes')
        .select('id, maintenance_id, note, created_at')
        .in('maintenance_id', maintenanceIds)
        .order('created_at', { ascending: true }).order('id', { ascending: true })
      if (result.error) {
        return { success: false, error: 'Catatan pemeriksaan gagal dimuat. Muat ulang data.' }
      }
      for (const item of result.data ?? []) {
        notes.push({ id: String(item.id), maintenanceId: String(item.maintenance_id),
          note: item.note, createdAt: item.created_at })
      }
    }

    return {
      success: true,
      data: {
        history: (historyResult.data ?? []).map((item) => ({
          id: String(item.id),
          reason: item.reason,
          startedAt: item.started_at,
          completedAt: item.completed_at,
          completionNote: item.completion_note,
        })),
        notes,
        facilityStatus: facilityResult.data.status ?? '',
        reportStatus: report.status,
        openMaintenance: maintenance
          ? {
              id: String(maintenance.id),
              reportId: String(maintenance.report_id),
              reason: maintenance.reason,
              startedAt: maintenance.started_at,
            }
          : null,
      },
    }
  } catch (error) {
    console.error('Kesalahan membaca perbaikan:', error)

    return {
      success: false,
      error: 'Data perbaikan belum dapat dimuat. Coba lagi.',
    }
  }
}

export async function startReportMaintenance(
  reportId: string,
  reason: string,
  confirmed: boolean
): Promise<ActionResult> {
  try {
    if (!validId(reportId)) {
      return { success: false, error: 'ID laporan tidak valid.' }
    }

    if (
      typeof reason !== 'string' ||
      reason.trim().length === 0 ||
      reason.trim().length > 5000
    ) {
      return {
        success: false,
        error: 'Alasan perbaikan wajib diisi, maksimal 5000 karakter.',
      }
    }

    if (confirmed !== true) {
      return {
        success: false,
        error: 'Konfirmasi dampak terhadap reservasi terlebih dahulu.',
      }
    }

    const supabase = await getStaffClient()

    if (!supabase) {
      return {
        success: false,
        error: 'Hanya petugas aktif yang dapat memulai perbaikan.',
      }
    }

    const { data, error } = await supabase.rpc(
      'start_facility_maintenance',
      {
        p_report_id: reportId,
        p_reason: reason.trim(),
      }
    )

    if (error) {
      console.error('Gagal memulai perbaikan:', error)

      return {
        success: false,
        error:
          error.code === 'P0001' || (
            error.code === '23514' &&
            error.message.startsWith('Perbaikan melalui laporan ini sudah selesai.')
          )
            ? error.message
            : 'Perbaikan gagal dimulai. Muat ulang data sebelum mencoba lagi.',
      }
    }

    refreshMaintenancePages()

    return {
      success: true,
      message:
        `Perbaikan dimulai. ` +
        `${data.rejected_pending_count} pengajuan menunggu ditolak dan ` +
        `${data.cancelled_approved_count} reservasi disetujui dibatalkan.`,
    }
  } catch (error) {
    console.error('Kesalahan memulai perbaikan:', error)

    return {
      success: false,
      error:
        'Hasil penyimpanan belum dapat dipastikan. Muat ulang data sebelum mencoba lagi.',
    }
  }
}

export async function finishReportMaintenance(
  maintenanceId: string,
  completionNote: string,
  confirmedUsable: boolean
): Promise<ActionResult> {
  try {
    if (!validId(maintenanceId)) {
      return { success: false, error: 'ID perbaikan tidak valid.' }
    }

    if (
      typeof completionNote !== 'string' ||
      completionNote.trim().length === 0 ||
      completionNote.trim().length > 5000
    ) {
      return {
        success: false,
        error: 'Catatan penyelesaian wajib diisi, maksimal 5000 karakter.',
      }
    }

    if (confirmedUsable !== true) {
      return {
        success: false,
        error: 'Pastikan fasilitas sudah layak digunakan.',
      }
    }

    const supabase = await getStaffClient()

    if (!supabase) {
      return {
        success: false,
        error: 'Hanya petugas aktif yang dapat menyelesaikan perbaikan.',
      }
    }

    const { data, error } = await supabase.rpc(
      'finish_facility_maintenance',
      {
        p_maintenance_id: maintenanceId,
        p_completion_note: completionNote.trim(),
        p_confirmed_usable: confirmedUsable,
      }
    )

    if (error) {
      console.error('Gagal menyelesaikan perbaikan:', error)

      return {
        success: false,
        error:
          error.code === 'P0001'
            ? error.message
            : 'Perbaikan gagal diselesaikan. Muat ulang data sebelum mencoba lagi.',
      }
    }

    refreshMaintenancePages()

    return {
      success: true,
      message:
        data.facility_status === 'nonaktif'
          ? 'Perbaikan selesai. Fasilitas tetap nonaktif sesuai pengaturan admin.'
          : 'Perbaikan selesai. Fasilitas kembali aktif.',
    }
  } catch (error) {
    console.error('Kesalahan menyelesaikan perbaikan:', error)

    return {
      success: false,
      error:
        'Hasil penyimpanan belum dapat dipastikan. Muat ulang data sebelum mencoba lagi.',
    }
  }
}

export async function addReportMaintenanceNote(
  maintenanceId: string, note: string, requestId: string
): Promise<ActionResult> {
  if (!validId(maintenanceId) || typeof requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    return { success: false, error: 'ID penyimpanan tidak valid. Muat ulang data.' }
  }
  if (typeof note !== 'string' || !note.trim() || note.trim().length > 5000) {
    return { success: false, error: 'Catatan pemeriksaan wajib diisi, maksimal 5000 karakter.' }
  }
  try {
    const supabase = await getStaffClient()
    if (!supabase) return { success: false, error: 'Hanya petugas aktif yang dapat menambah catatan pemeriksaan.' }
    const { error } = await supabase.rpc('add_maintenance_note', {
      p_maintenance_id: maintenanceId, p_note: note.trim(), p_request_id: requestId,
    })
    if (error) return { success: false, error: error.code === 'P0001' ? error.message : 'Catatan gagal disimpan. Muat ulang data untuk memeriksa hasilnya.' }
    refreshMaintenancePages()
    return { success: true, message: 'Catatan pemeriksaan tersimpan.' }
  } catch {
    return { success: false, error: 'Koneksi terputus. Muat ulang data untuk memeriksa hasil penyimpanan.' }
  }
}
