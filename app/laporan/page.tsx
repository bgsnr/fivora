import { redirect } from 'next/navigation'
import {
  getOwnReportHistory,
  REPORT_PAGE_SIZE,
} from '@/lib/actions/report-history'
import { parseReportFilter, reportHistoryHref } from '@/lib/report-filters'
import LaporanContent from './laporan-content'

type Props = {
  searchParams: Promise<{
    page?: string | string[]
    status?: string | string[]
  }>
}

export default async function LaporanPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedStatus = parseReportFilter(params.status)
  const requestedPage =
    typeof params.page === 'string' ? Number(params.page) : 1
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 1_000_000
      ? requestedPage
      : 1

  const { data, error, count } = await getOwnReportHistory(page, selectedStatus)

  if (error) {
    console.error('Gagal mengambil riwayat laporan:', error)
    return (
      <LaporanContent
        reports={[]}
        errorMessage="Riwayat laporan gagal dimuat. Coba muat ulang halaman."
        selectedStatus={selectedStatus}
        page={page}
        totalPages={1}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / REPORT_PAGE_SIZE))
  if (page > totalPages) {
    redirect(reportHistoryHref(selectedStatus, totalPages))
  }

  const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  })
  const reports = (data ?? []).map((report) => {
    const date = new Date(report.created_at)
    return {
      id: String(report.id),
      facility: report.facility?.name ?? 'Fasilitas tidak tersedia',
      category: report.category,
      description: report.description,
      status: report.status,
      date: `${dateFormatter.format(date)}, ${timeFormatter.format(date).replace(':', '.')} WIB`,
    }
  })

  return (
    <LaporanContent
      reports={reports}
      errorMessage=""
      selectedStatus={selectedStatus}
      page={page}
      totalPages={totalPages}
    />
  )
}
