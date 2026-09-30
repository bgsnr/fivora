import { redirect } from 'next/navigation'

import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import LaporanPetugasContent from './laporan-petugas-content'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'
type StatusFilter = 'semua' | ReportStatus

type Props = {
  searchParams: Promise<{
    status?: string | string[]
    page?: string | string[]
  }>
}

type ReportRow = {
  id: number
  category: string
  description: string
  status: ReportStatus
  created_at: string
  facility: {
    name: string
  } | null
}

const PAGE_SIZE = 10

const statuses: ReportStatus[] = [
  'baru',
  'diproses',
  'selesai',
  'ditolak',
]

function formatDate(value: string) {
  const date = new Date(value)

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)

  const waktu = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(date).replace(':', '.')

  return `${tanggal}, ${waktu} WIB`
}

export default async function LaporanPetugasPage({
  searchParams,
}: Props) {
  await requireReportRole('petugas')

  const params = await searchParams

  const selectedStatus: StatusFilter =
    typeof params.status === 'string' &&
    statuses.includes(params.status as ReportStatus)
      ? (params.status as ReportStatus)
      : 'semua'

  const requestedPage =
    typeof params.page === 'string' ? Number(params.page) : 1

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 1_000_000
      ? requestedPage
      : 1

  const supabase = await createClient()
  const start = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('reports')
    .select(
      `
        id,
        category,
        description,
        status,
        created_at,
        facility:facilities!facility_id (
          name
        )
      `,
      { count: 'exact' }
    )

  if (selectedStatus !== 'semua') {
    query = query.eq('status', selectedStatus)
  }

  const [listResult, countResults] = await Promise.all([
    query
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(start, start + PAGE_SIZE - 1)
      .returns<ReportRow[]>(),

    Promise.all(
      statuses.map((status) =>
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', status)
      )
    ),
  ])

  if (listResult.error) {
    console.error('Gagal mengambil antrean laporan:', listResult.error)
  }

  const summaryFailed = countResults.some(
    (result) => result.error !== null || result.count === null
  )

  for (const result of countResults) {
    if (result.error) {
      console.error('Gagal menghitung laporan:', result.error)
    }
  }

  const counts: Record<ReportStatus, number> = {
    baru: countResults[0].count ?? 0,
    diproses: countResults[1].count ?? 0,
    selesai: countResults[2].count ?? 0,
    ditolak: countResults[3].count ?? 0,
  }

  const summary = summaryFailed
    ? null
    : {
        total: counts.baru + counts.diproses + counts.selesai + counts.ditolak,
        ...counts,
      }

  const totalPages = Math.max(
    1,
    Math.ceil((listResult.count ?? 0) / PAGE_SIZE)
  )

  if (!listResult.error && page > totalPages) {
    redirect(
      `/petugas/laporan?status=${selectedStatus}&page=${totalPages}`
    )
  }

  const reports = (listResult.data ?? []).map((report) => ({
    id: String(report.id),
    facility: report.facility?.name ?? 'Fasilitas tidak tersedia',
    category: report.category,
    description: report.description,
    status: report.status,
    date: formatDate(report.created_at),
  }))

  return (
    <LaporanPetugasContent
      reports={reports}
      summary={summary}
      selectedStatus={selectedStatus}
      page={page}
      totalPages={totalPages}
      errorMessage={
        listResult.error
          ? 'Daftar laporan gagal dimuat. Coba muat ulang halaman.'
          : ''
      }
    />
  )
}