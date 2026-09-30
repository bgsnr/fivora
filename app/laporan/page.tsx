import { redirect } from 'next/navigation'
import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import LaporanContent from './laporan-content'

type ReportRow = {
  id: number
  category: string
  description: string
  status: 'baru' | 'diproses' | 'selesai' | 'ditolak'
  created_at: string
  facility: {
    name: string
  } | null
}

type Props = {
  searchParams: Promise<{
    page?: string | string[]
  }>
}

const PAGE_SIZE = 10

export default async function LaporanPage({ searchParams }: Props) {
  const currentUser = await requireReportRole('pengguna')
  const params = await searchParams

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

  const { data, error, count } = await supabase
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
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(start, start + PAGE_SIZE - 1)
    .returns<ReportRow[]>()

  if (error) {
    console.error('Gagal mengambil riwayat laporan:', error)

    return (
      <LaporanContent
        reports={[]}
        errorMessage="Riwayat laporan gagal dimuat. Coba muat ulang halaman."
        page={page}
        totalPages={1}
      />
    )
  }

  const totalPages = Math.max(
    1,
    Math.ceil((count ?? 0) / PAGE_SIZE)
  )

  if (page > totalPages) {
    redirect(`/laporan?page=${totalPages}`)
  }

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })

  const reports = (data ?? []).map((report) => ({
    id: String(report.id),
    facility: report.facility?.name ?? 'Fasilitas tidak tersedia',
    category: report.category,
    description: report.description,
    status: report.status,
    date: `${dateFormatter.format(new Date(report.created_at))} WIB`,
  }))

  return (
    <LaporanContent
      reports={reports}
      errorMessage=""
      page={page}
      totalPages={totalPages}
    />
  )
}