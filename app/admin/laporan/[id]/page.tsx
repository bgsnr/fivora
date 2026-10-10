import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireFacilityAdmin } from '@/lib/facility-access'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ReportProgress from '@/components/reports/report-progress'

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Wrench,
  ImageIcon,
} from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    status?: string | string[]
    page?: string | string[]
  }>
}

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

type ReportRow = {
  id: number
  category: string
  description: string
  status: ReportStatus
  officer_note: string | null
  created_at: string
  processed_at: string | null
  updated_at: string
  photo_path: string | null
  facility: {
    name: string
    location: string | null
  } | null
}

type MaintenanceRow = {
  id: number
  reason: string
  started_at: string
  completed_at: string | null
  completion_note: string | null
}

type MaintenanceNoteRow = {
  id: number
  maintenance_id: number
  note: string
  created_at: string
}

const statusLabels: Record<ReportStatus, string> = {
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

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'long',
    timeStyle: 'short',
  }) + ' WIB'
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

export default async function AdminReportDetailPage({
  params,
  searchParams,
}: Props) {
  await requireFacilityAdmin()

  const { id } = await params
  const queryParams = await searchParams

  const statusParam = Array.isArray(queryParams.status)
    ? queryParams.status[0]
    : queryParams.status

  const pageParam = Array.isArray(queryParams.page)
    ? queryParams.page[0]
    : queryParams.page

  const allowedStatuses = [
    'semua',
    'baru',
    'diproses',
    'selesai',
    'ditolak',
  ]

  const backStatus =
    statusParam && allowedStatuses.includes(statusParam)
      ? statusParam
      : 'semua'

  const requestedPage = Number(pageParam)
  const backPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1

  const backHref =
    `/admin/laporan?status=${backStatus}&page=${backPage}`

  if (
    !/^[1-9]\d{0,18}$/.test(id) ||
    BigInt(id) > BigInt('9223372036854775807')
  ) {
    notFound()
  }

  const { data: report, error: reportError } =
    await supabaseAdmin
      .from('reports')
      .select(`
        id,
        category,
        description,
        status,
        officer_note,
        created_at,
        processed_at,
        updated_at,
        photo_path,
        facility:facilities!facility_id(
          name,
          location
        )
      `)
      .eq('id', id)
      .returns<ReportRow[]>()
      .maybeSingle()

  if (reportError) {
    console.error('ADMIN REPORT DETAIL ERROR:', {
      message: reportError.message,
      code: reportError.code,
      details: reportError.details,
    })

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#010736]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Laporan
        </Link>

        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          Detail laporan gagal dimuat. Silakan muat ulang halaman.
        </div>
      </main>
    )
  }

  if (!report) {
    notFound()
  }

  // Baca riwayat perbaikan yang berhubungan dengan laporan ini.
  const { data: maintenanceData, error: maintenanceError } =
    await supabaseAdmin
      .from('facility_maintenance')
      .select(`
        id,
        reason,
        started_at,
        completed_at,
        completion_note
      `)
      .eq('report_id', id)
      .order('started_at', { ascending: false })
      .order('id', { ascending: false })
      .returns<MaintenanceRow[]>()

  const maintenances = maintenanceData ?? []

  if (maintenanceError) {
    console.error('ADMIN MAINTENANCE HISTORY ERROR:', {
      message: maintenanceError.message,
      code: maintenanceError.code,
      details: maintenanceError.details,
    })
  }

  // Ambil catatan pemeriksaan untuk semua proses perbaikan terkait.
  let maintenanceNotes: MaintenanceNoteRow[] = []
  let notesError = false

  if (!maintenanceError && maintenances.length > 0) {
    const maintenanceIds = maintenances.map(
      (item) => item.id
    )

    const { data, error } = await supabaseAdmin
      .from('maintenance_notes')
      .select('id, maintenance_id, note, created_at')
      .in('maintenance_id', maintenanceIds)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .returns<MaintenanceNoteRow[]>()

    if (error) {
      notesError = true

      console.error('ADMIN MAINTENANCE NOTES ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
    } else {
      maintenanceNotes = data ?? []
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigasi dan judul */}
      <header className="mb-7">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#010736] transition hover:text-[#22396f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Laporan
        </Link>

        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-[#22396f]">
          ADMINISTRATOR
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#010736] sm:text-3xl">
            Detail Laporan #{report.id}
          </h1>

          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(report.status)}`}
          >
            {statusLabels[report.status]}
          </span>
        </div>

        <p className="mt-2 text-sm text-[#52627d]">
          Pemantauan laporan dan perkembangan penanganan oleh petugas.
        </p>
      </header>

      {/* Informasi utama laporan */}
      <section className="rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm sm:p-7">
        <div className="border-b border-[#e7ebf1] pb-5">
          <h2 className="text-xl font-extrabold text-[#010736]">
            {report.facility?.name || 'Fasilitas tidak tersedia'}
          </h2>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#52627d]">
            {report.facility?.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {report.facility.location}
              </span>
            )}

            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(report.created_at)}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-5 border-b border-[#e7ebf1] py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-[#718097]">
              Kategori Kerusakan
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#010736]">
              {categoryLabels[report.category] ?? report.category}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold text-[#718097]">
              Terakhir Diproses
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#010736]">
              {formatDate(report.processed_at)}
            </dd>
          </div>
        </dl>

        <div className="border-b border-[#e7ebf1] py-5">
          <h3 className="text-sm font-bold text-[#010736]">
            Deskripsi Kerusakan
          </h3>

          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
            {report.description}
          </p>
        </div>

        <div className="border-b border-[#e7ebf1] py-5">
          <h3 className="text-sm font-bold text-[#010736]">
            Catatan Perubahan Status
          </h3>

          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
            {report.officer_note || 'Belum ada catatan dari petugas.'}
          </p>
        </div>

        {/* Foto kerusakan */}
        <div className="pt-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#010736]">
            <ImageIcon className="h-4 w-4" />
            Foto Kerusakan
          </h3>

          {report.photo_path ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#d8dfea] bg-[#f7f9fc]">
              <img
                src={`/api/reports/${report.id}/photo`}
                alt={`Foto kerusakan ${report.facility?.name ?? ''}`}
                className="max-h-[480px] w-full object-contain"
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#718097]">
              Tidak ada foto yang dilampirkan.
            </p>
          )}
        </div>
      </section>

      {/* Perkembangan laporan: read-only */}
      <section className="mt-6 rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm sm:p-7">
        <ReportProgress
          reportId={String(report.id)}
          editable={false}
          hideTopDivider
        />
      </section>

      {/* Riwayat perbaikan */}
      <section className="mt-6 rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fcf1d0] text-[#22396f]">
            <Wrench className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#010736]">
              Riwayat Perbaikan
            </h2>
            <p className="mt-1 text-sm text-[#52627d]">
              Catatan proses perbaikan yang terkait dengan laporan ini.
            </p>
          </div>
        </div>

        {maintenanceError ? (
          <p role="alert" className="text-sm text-red-700">
            Riwayat perbaikan gagal dimuat. Silakan muat ulang halaman.
          </p>
        ) : maintenances.length === 0 ? (
          <p className="rounded-xl bg-[#f7f9fc] p-4 text-sm text-[#52627d]">
            Belum ada riwayat perbaikan yang tercatat untuk laporan ini.
          </p>
        ) : (
          <div className="space-y-4">
            {maintenances.map((item) => {
              const itemNotes = maintenanceNotes.filter(
                (note) => note.maintenance_id === item.id
              )

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-[#d8dfea] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold text-[#010736]">
                      Perbaikan #{item.id}
                    </h3>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${
                        item.completed_at
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-blue-200 bg-blue-50 text-blue-800'
                      }`}
                    >
                      {item.completed_at ? 'Selesai' : 'Dalam Perbaikan'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-[#52627d]">
                    <p>
                      <span className="font-semibold text-[#010736]">
                        Alasan perbaikan:
                      </span>{' '}
                      {item.reason}
                    </p>

                    <p>
                      <span className="font-semibold text-[#010736]">
                        Mulai:
                      </span>{' '}
                      {formatDate(item.started_at)}
                    </p>

                    <p>
                      <span className="font-semibold text-[#010736]">
                        Selesai:
                      </span>{' '}
                      {formatDate(item.completed_at)}
                    </p>

                    {item.completion_note && (
                      <div className="rounded-lg bg-[#f7f9fc] p-3">
                        <p className="font-semibold text-[#010736]">
                          Catatan Penyelesaian
                        </p>
                        <p className="mt-1 whitespace-pre-line">
                          {item.completion_note}
                        </p>
                      </div>
                    )}
                  </div>

                  {notesError ? (
                    <p role="alert" className="mt-4 text-xs text-red-700">
                      Catatan pemeriksaan gagal dimuat.
                    </p>
                  ) : itemNotes.length > 0 ? (
                    <div className="mt-5 border-t border-[#e7ebf1] pt-4">
                      <h4 className="text-sm font-bold text-[#010736]">
                        Catatan Pemeriksaan
                      </h4>

                      <ol className="mt-3 space-y-3">
                        {itemNotes.map((note) => (
                          <li
                            key={note.id}
                            className="rounded-lg bg-[#f7f9fc] p-3"
                          >
                            <time className="text-xs text-[#718097]">
                              {formatDate(note.created_at)}
                            </time>
                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
                              {note.note}
                            </p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[#718097]">
                      Belum ada catatan pemeriksaan untuk perbaikan ini.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* Pengingat hak akses */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#22396f]/20 bg-[#fcf1d0]/50 p-4 text-xs leading-relaxed text-[#52627d]">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#22396f]" />
        <p>
          Halaman ini hanya untuk pemantauan administrator.
          Perubahan status laporan, catatan petugas, dan proses
          perbaikan dilakukan oleh petugas yang berwenang.
        </p>
      </div>
    </main>
  )
}