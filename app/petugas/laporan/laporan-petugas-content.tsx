'use client'

import Link from 'next/link'
import AutoRefresh from '@/components/layout/auto-refresh'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react'

import { reportDetailHref, reportHistoryHref } from '@/lib/report-filters'
import styles from './laporan-petugas.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'
type StatusFilter = 'semua' | ReportStatus

type Report = {
  id: string
  facility: string
  reporterName: string
  category: string
  description: string
  status: ReportStatus
  date: string
}

type Summary = {
  total: number
  baru: number
  diproses: number
  selesai: number
  ditolak: number
}

type Props = {
  reports: Report[]
  summary: Summary | null
  selectedStatus: StatusFilter
  page: number
  totalPages: number
  errorMessage: string
  reporterErrorMessage?: string
}

const statusOptions: StatusFilter[] = [
  'semua',
  'baru',
  'diproses',
  'selesai',
  'ditolak',
]

const statusLabels: Record<StatusFilter, string> = {
  semua: 'Semua',
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

const summaryItems = [
  { key: 'total', label: 'Total laporan' },
  { key: 'baru', label: 'Laporan baru' },
  { key: 'diproses', label: 'Sedang diproses' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
] as const

export default function LaporanPetugasContent({
  reports,
  summary,
  selectedStatus,
  page,
  totalPages,
  errorMessage,
  reporterErrorMessage,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function changeStatus(status: StatusFilter) {
    startTransition(() => {
      router.push(reportHistoryHref(status, 1, 'petugas'), {
        scroll: false,
      })
    })
  }

  function refreshReports() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <main className={styles.page}>
      <AutoRefresh />
      <div className={styles.container}>
        <div className={styles.headingTop}>
          <p className={styles.eyebrow}>PELAPORAN & PERBAIKAN</p>

          <Link href="/petugas" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            Beranda Petugas
          </Link>
        </div>

        <section
          className={styles.heading}
          aria-labelledby="queue-title"
        >
          <div>
            <h1 id="queue-title">
              Antrean <span>laporan.</span>
            </h1>

            <p className={styles.introduction}>
              Periksa laporan kerusakan dan perbarui status
              penanganannya.
            </p>
          </div>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={refreshReports}
            disabled={isPending}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isPending ? 'Memuat...' : 'Perbarui daftar'}
          </button>
        </section>

        <dl
          className={styles.summary}
          aria-label="Ringkasan seluruh laporan"
        >
          {summaryItems.map((item) => (
            <div
              key={item.key}
              className={`${styles.summaryItem} ${
                item.key === 'total' ? styles.summaryTotal : ''
              }`}
            >
              <dt>{item.label}</dt>
              <dd>{summary?.[item.key] ?? '—'}</dd>
            </div>
          ))}
        </dl>

        <section
          className={styles.reportSection}
          aria-labelledby="report-list-title"
          aria-busy={isPending}
        >
          <div className={styles.toolbar}>
            <h2 id="report-list-title">Daftar laporan</h2>

            <div
              className={styles.filters}
              role="group"
              aria-label="Filter status laporan"
            >
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    selectedStatus === status
                      ? styles.activeFilter
                      : styles.filterButton
                  }
                  aria-pressed={selectedStatus === status}
                  onClick={() => changeStatus(status)}
                  disabled={isPending}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.reportList}>
            {reporterErrorMessage && (
              <p className={styles.error} role="alert">
                {reporterErrorMessage}
              </p>
            )}
            {errorMessage ? (
              <div className={styles.error} role="alert">
                <h3>Daftar belum dapat ditampilkan</h3>
                <p>{errorMessage}</p>
              </div>
            ) : reports.length === 0 ? (
              <div className={styles.empty}>
                <h3>
                  {selectedStatus === 'semua'
                    ? 'Belum ada laporan masuk'
                    : `Tidak ada laporan berstatus ${statusLabels[selectedStatus]}`}
                </h3>

                <p>
                  {selectedStatus === 'semua'
                    ? 'Laporan yang dikirim pengguna akan muncul di sini.'
                    : 'Pilih status lain untuk melihat laporan yang tersedia.'}
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <article className={styles.reportRow} key={report.id}>
                  <div className={styles.reportContent}>
                    <div className={styles.reportMeta}>
                      <span className={styles.category}>
                        {categoryLabels[report.category] ?? report.category}
                      </span>

                      <span className={styles.reportId}>
                        #{report.id}
                      </span>
                    </div>

                    <h3>
                      <Link href={reportDetailHref(report.id, selectedStatus, page, 'petugas')}>
                        {report.facility}
                      </Link>
                    </h3>

                    <p className={styles.reporter}>Pelapor: {report.reporterName}</p>

                    <p className={styles.description}>
                      {report.description}
                    </p>

                    <p className={styles.date}>
                      <span>Dikirim</span>
                      <time>{report.date}</time>
                    </p>
                  </div>

                  <div className={styles.reportActions}>
                    <span
                      className={`${styles.status} ${
                        styles[report.status]
                      }`}
                    >
                      <span
                        className={styles.statusDot}
                        aria-hidden="true"
                      />
                      {statusLabels[report.status]}
                    </span>

                    <Link
                      href={reportDetailHref(report.id, selectedStatus, page, 'petugas')}
                      className={styles.detailButton}
                      aria-label={`Periksa laporan ${report.facility}, nomor ${report.id}`}
                    >
                      Periksa laporan
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          {!errorMessage && reports.length > 0 && totalPages > 1 && (
            <nav
              className={styles.pagination}
              aria-label="Halaman antrean laporan"
            >
              {page > 1 ? (
                <Link
                  href={reportHistoryHref(selectedStatus, page - 1, 'petugas')}
                  className={styles.pageLink}
                  rel="prev"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Sebelumnya
                </Link>
              ) : (
                <span className={styles.pageDisabled}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  Sebelumnya
                </span>
              )}

              <span className={styles.pageInformation}>
                Halaman {page} dari {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={reportHistoryHref(selectedStatus, page + 1, 'petugas')}
                  className={styles.pageLink}
                  rel="next"
                >
                  Berikutnya
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <span className={styles.pageDisabled}>
                  Berikutnya
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              )}
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}
