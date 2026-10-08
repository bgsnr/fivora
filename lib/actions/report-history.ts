import 'server-only'

import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import type { ReportFilter, ReportStatus } from '@/lib/report-filters'

type ReportRow = {
  id: number
  category: string
  description: string
  status: ReportStatus
  created_at: string
  facility: { name: string } | null
}

type NoteRow = { id: number; note: string; created_at: string }

type MaintenanceRow = {
  notes: NoteRow[]
  id: number
  reason: string
  started_at: string
  completed_at: string | null
  completion_note: string | null
}

export type UserReportMaintenance = {
  notes: { id: string; note: string; createdAt: string }[]
  id: string
  reason: string
  startedAt: string
  completedAt: string | null
  completionNote: string | null
}

export const REPORT_PAGE_SIZE = 10

export async function getOwnReportHistory(page: number, status: ReportFilter) {
  const currentUser = await requireReportRole('pengguna')
  const supabase = await createClient()
  const start = (page - 1) * REPORT_PAGE_SIZE

  let query = supabase
    .from('reports')
    .select(
      `id, category, description, status, created_at,
       facility:facilities!facility_id(name)`,
      { count: 'exact' }
    )
    .eq('user_id', currentUser.id)

  // Filter seluruh riwayat sebelum menghitung dan membatasi halaman.
  if (status !== 'semua') {
    query = query.eq('status', status)
  }

  return query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + REPORT_PAGE_SIZE - 1)
    .returns<ReportRow[]>()
}

export async function getOwnReportMaintenance(reportId: string) {
  const currentUser = await requireReportRole('pengguna')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('facility_maintenance')
    .select(
      `id, reason, started_at, completed_at, completion_note,
       notes:maintenance_notes(id, note, created_at),
       report:reports!maintenance_report_facility_match!inner(user_id)`
    )
    .eq('report_id', reportId)
    .eq('report.user_id', currentUser.id)
    .order('started_at', { ascending: false })
    .order('id', { ascending: false })
    .returns<MaintenanceRow[]>()

  if (error) {
    console.error('Gagal mengambil perbaikan laporan pengguna:', error)
    return {
      maintenance: [] as UserReportMaintenance[],
      errorMessage: 'Informasi perbaikan gagal dimuat. Coba muat ulang halaman.',
    }
  }

  return {
    maintenance: (data ?? []).map((item) => ({
      notes: (item.notes ?? []).slice().sort((a, b) =>
        a.created_at.localeCompare(b.created_at) || (a.id - b.id)
      ).map((entry) => ({ id: String(entry.id), note: entry.note, createdAt: entry.created_at })),
      id: String(item.id),
      reason: item.reason,
      startedAt: item.started_at,
      completedAt: item.completed_at,
      completionNote: item.completion_note,
    })),
    errorMessage: '',
  }
}
