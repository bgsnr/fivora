export const reportFilters = [
  'semua',
  'baru',
  'diproses',
  'selesai',
  'ditolak',
] as const

export type ReportFilter = (typeof reportFilters)[number]
export type ReportStatus = Exclude<ReportFilter, 'semua'>
export type ReportListRole = 'pengguna' | 'petugas'
export type ReportSearchParams = {
  status?: string | string[]
  page?: string | string[]
}
export type ReportListContext = {
  status: ReportFilter
  page: number
}

export function parseReportFilter(value: unknown): ReportFilter {
  return typeof value === 'string' &&
    reportFilters.includes(value as ReportFilter)
    ? (value as ReportFilter)
    : 'semua'
}

export function parseReportListContext(params: ReportSearchParams): ReportListContext {
  const requestedPage = typeof params.page === 'string' ? Number(params.page) : 1
  return {
    status: parseReportFilter(params.status),
    page:
      Number.isSafeInteger(requestedPage) &&
      requestedPage > 0 &&
      requestedPage <= 1_000_000
        ? requestedPage
        : 1,
  }
}

export function reportHistoryHref(
  status: ReportFilter,
  page = 1,
  role: ReportListRole = 'pengguna'
) {
  const path = role === 'petugas' ? '/petugas/laporan' : '/laporan'
  return `${path}?status=${status}&page=${page}`
}

export function reportDetailHref(
  reportId: string,
  status: ReportFilter,
  page: number,
  role: ReportListRole = 'pengguna'
) {
  const path = role === 'petugas' ? '/petugas/laporan' : '/laporan'
  return `${path}/${encodeURIComponent(reportId)}?status=${status}&page=${page}`
}
