import Link from 'next/link'
import { redirect } from 'next/navigation'

import { requireFacilityAdmin } from '@/lib/facility-access'
import { supabaseAdmin } from '@/lib/supabase/admin'

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  RefreshCw,
} from 'lucide-react'

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
  officer_note: string | null
  created_at: string
  processed_at: string | null
  updated_at: string
  facility: {
    name: string
    location: string | null
  } | null
}

const PAGE_SIZE = 10

const statusOptions: StatusFilter[] = [
  'semua',
  'baru',
  'diproses',
  'selesai',
  'ditolak',
]

const statusLabels: Record<StatusFilter, string> = {
  semua: 'Semua Laporan',
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const categoryLabels: Record<string, string> = {
  peralatan: 'Peralatan',
  listrik: 'Listrik',
  kebersihan: 'Kebersihan',
  bangunan: 'Bangunan',
  lainnya: 'Lainnya',
}

function getStatusClass(status: string) {
  switch (status) {
    case 'baru':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'diproses':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'selesai':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'ditolak':
      return 'border-red-200 bg-red-50 text-red-800'
    default:
      return 'border-slate-200 bg-white text-slate-700'
  }
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' WIB'
}

export default async function AdminReportsPage({
  searchParams,
}: Props) {
  await requireFacilityAdmin()

  const params = await searchParams

  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status

  const rawPage = Array.isArray(params.page)
    ? params.page[0]
    : params.page

  const activeStatus: StatusFilter =
    typeof rawStatus === 'string' &&
    statusOptions.includes(rawStatus as StatusFilter)
      ? (rawStatus as StatusFilter)
      : 'semua'

  const requestedPage =
    typeof rawPage === 'string' ? Number(rawPage) : 1

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 1_000_000
      ? requestedPage
      : 1

  const start = (page - 1) * PAGE_SIZE

  let query = supabaseAdmin
    .from('reports')
    .select(
      `
        id,
        category,
        description,
        status,
        officer_note,
        created_at,
        processed_at,
        updated_at,
        facility:facilities!facility_id (
          name,
          location
        )
      `,
      { count: 'exact' }
    )

  if (activeStatus !== 'semua') {
    query = query.eq('status', activeStatus)
  }

  const statuses: ReportStatus[] = [
    'baru',
    'diproses',
    'selesai',
    'ditolak',
  ]

  const [listResult, countResults] = await Promise.all([
    query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(start, start + PAGE_SIZE - 1)
      .returns<ReportRow[]>(),

    Promise.all(
      statuses.map((status) =>
        supabaseAdmin
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', status)
      )
    ),
  ])

  if (listResult.error) {
    console.error('ADMIN REPORTS QUERY ERROR:', {
      message: listResult.error.message,
      code: listResult.error.code,
      details: listResult.error.details,
      hint: listResult.error.hint,
    })
  }

  const summaryFailed = countResults.some(
    (result) =>
      result.error !== null || result.count === null
  )

  countResults.forEach((result) => {
    if (result.error) {
      console.error('ADMIN REPORTS COUNT ERROR:', {
        message: result.error.message,
        code: result.error.code,
        details: result.error.details,
      })
    }
  })

  const counts = {
    baru: countResults[0].count ?? 0,
    diproses: countResults[1].count ?? 0,
    selesai: countResults[2].count ?? 0,
    ditolak: countResults[3].count ?? 0,
  }

  const total = summaryFailed
    ? null
    : counts.baru +
      counts.diproses +
      counts.selesai +
      counts.ditolak

  const totalPages = Math.max(
    1,
    Math.ceil((listResult.count ?? 0) / PAGE_SIZE)
  )

  if (!listResult.error && page > totalPages) {
    redirect(
      `/admin/laporan?status=${activeStatus}&page=${totalPages}`
    )
  }

  const reports: ReportRow[] = listResult.data ?? []

  const summaryItems = [
    {
      key: 'total',
      label: 'Total Laporan',
      count: total,
      color: 'border-[#d8dfea] bg-white',
    },
    {
      key: 'baru',
      label: 'Laporan Baru',
      count: summaryFailed ? null : counts.baru,
      color: 'border-amber-200 bg-amber-50',
    },
    {
      key: 'diproses',
      label: 'Sedang Diproses',
      count: summaryFailed ? null : counts.diproses,
      color: 'border-blue-200 bg-blue-50',
    },
    {
      key: 'selesai',
      label: 'Selesai',
      count: summaryFailed ? null : counts.selesai,
      color: 'border-emerald-200 bg-emerald-50',
    },
    {
      key: 'ditolak',
      label: 'Ditolak',
      count: summaryFailed ? null : counts.ditolak,
      color: 'border-red-200 bg-red-50',
    },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-7">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#22396f]">
          ADMINISTRATOR
        </p>

        <h1 className="text-2xl font-extrabold tracking-tight text-[#010736] sm:text-3xl">
          Laporan Kerusakan
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52627d]">
          Pantau laporan kerusakan fasilitas kampus dan
          perkembangan penanganannya oleh petugas.
        </p>
      </header>

      {/* Ringkasan laporan */}
      <section
        aria-label="Ringkasan laporan kerusakan"
        className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        {summaryItems.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border p-4 ${item.color}`}
          >
            <p className="text-sm font-medium text-[#52627d]">
              {item.label}
            </p>

            <p className="mt-2 text-3xl font-extrabold text-[#010736]">
              {item.count ?? '—'}
            </p>
          </div>
        ))}
      </section>

      {/* Filter status */}
      <nav
        aria-label="Filter status laporan"
        className="mb-6 flex flex-wrap gap-2 border-b border-[#d8dfea] pb-4"
      >
        {statusOptions.map((status) => (
          <Link
            key={status}
            href={`/admin/laporan?status=${status}&page=1`}
            aria-current={activeStatus === status ? 'page' : undefined}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activeStatus === status
                ? 'border-[#010736] bg-[#010736] text-white'
                : 'border-[#d8dfea] bg-white text-[#52627d] hover:border-[#22396f] hover:text-[#010736]'
            }`}
          >
            {statusLabels[status]}
          </Link>
        ))}
      </nav>

      {/* Daftar laporan */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#010736]">
              {statusLabels[activeStatus]}
            </h2>

            <p className="mt-1 text-sm text-[#52627d]">
              {listResult.count ?? 0} laporan pada kategori ini.
            </p>
          </div>

          <Link
            href={`/admin/laporan?status=${activeStatus}&page=${page}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8dfea] bg-white px-3 py-2 text-xs font-bold text-[#010736] transition hover:border-[#22396f]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Muat Ulang
          </Link>
        </div>

        {listResult.error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-bold">
                  Data laporan gagal dimuat.
                </p>

                <p className="mt-2">
                  {listResult.error.message}
                </p>

                <p className="mt-1 text-xs">
                  Kode error: {listResult.error.code || '-'}
                </p>
              </div>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c9d2e0] bg-white px-6 py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-[#718097]" />

            <h3 className="mt-4 text-base font-bold text-[#010736]">
              Belum Ada Laporan
            </h3>

            <p className="mt-2 text-sm text-[#52627d]">
              Belum ada laporan dengan status{' '}
              {statusLabels[activeStatus].toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-[#f0f3f8] px-2.5 py-1 text-xs font-bold text-[#22396f]">
                        {categoryLabels[report.category] ??
                          report.category}
                      </span>

                      <span className="font-mono text-xs text-[#718097]">
                        #{report.id}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(report.status)}`}
                      >
                        {statusLabels[report.status]}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#010736]">
                      {report.facility?.name ??
                        'Fasilitas tidak tersedia'}
                    </h3>

                    {report.facility?.location && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-[#52627d]">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {report.facility.location}
                      </p>
                    )}

                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
                      {report.description}
                    </p>

                    <p className="mt-3 text-xs text-[#718097]">
                      Dilaporkan: {formatDate(report.created_at)}
                    </p>

                    {report.processed_at && (
                      <p className="mt-1 text-xs text-[#718097]">
                        Diproses: {formatDate(report.processed_at)}
                      </p>
                    )}

                    {report.officer_note && (
                      <div className="mt-4 rounded-xl border border-[#d8dfea] bg-[#f7f9fc] p-3">
                        <p className="text-xs font-bold text-[#010736]">
                          Catatan Petugas
                        </p>

                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
                          {report.officer_note}
                        </p>
                      </div>
                    )}
                  </div>

                  <span className="shrink-0 text-xs text-[#718097]">
                    Diperbarui: {formatDate(report.updated_at)}
                  </span>
                </div>
                <div className="mt-5 flex justify-end border-t border-[#e7ebf1] pt-4">
                    <Link
                        href={`/admin/laporan/${report.id}?status=${activeStatus}&page=${page}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#010736] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d1c42]"
                    >
                        Lihat Detail
                    </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!listResult.error && reports.length > 0 && totalPages > 1 && (
          <nav
            aria-label="Halaman daftar laporan"
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
          >
            {page > 1 ? (
              <Link
                href={`/admin/laporan?status=${activeStatus}&page=${page - 1}`}
                rel="prev"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8dfea] bg-white px-4 py-2 text-sm font-semibold text-[#010736] hover:border-[#22396f]"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </Link>
            ) : (
              <span />
            )}

            <span className="text-sm text-[#52627d]">
              Halaman {page} dari {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/admin/laporan?status=${activeStatus}&page=${page + 1}`}
                rel="next"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8dfea] bg-white px-4 py-2 text-sm font-semibold text-[#010736] hover:border-[#22396f]"
              >
                Berikutnya
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </main>
  )
}