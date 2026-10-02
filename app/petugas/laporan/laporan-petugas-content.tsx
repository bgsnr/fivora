'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import styles from './laporan-petugas.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'
type StatusFilter = 'semua' | ReportStatus

type Report = {
  id: string
  facility: string
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

export default function LaporanPetugasContent({
  reports,
  summary,
  selectedStatus,
  page,
  totalPages,
  errorMessage,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function changeStatus(status: StatusFilter) {
    startTransition(() => {
      router.push(`/petugas/laporan?status=${status}&page=1`, {
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
      <section className={styles.container}>
        <Link href="/petugas" className={styles.backLink}>
          ← Dashboard petugas
        </Link>

        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>PETUGAS</p>

            <h1>Antrean Laporan</h1>

            <p>
              Periksa laporan kerusakan dan perbarui status penanganannya.
            </p>
          </div>

          <button
            type="button"
            className={styles.filterButton}
            onClick={refreshReports}
            disabled={isPending}
          >
            {isPending ? 'Memuat...' : 'Muat ulang'}
          </button>
        </div>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span>Total laporan</span>
            <strong>{summary?.total ?? '—'}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Laporan baru</span>
            <strong>{summary?.baru ?? '—'}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Sedang diproses</span>
            <strong>{summary?.diproses ?? '—'}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Selesai</span>
            <strong>{summary?.selesai ?? '—'}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Ditolak</span>
            <strong>{summary?.ditolak ?? '—'}</strong>
          </article>
        </section>

        {!summary && (
          <p role="alert">
            Ringkasan laporan gagal dimuat. Klik Muat ulang untuk mencoba lagi.
          </p>
        )}

        <section
          className={styles.reportSection}
          aria-busy={isPending}
        >
          <div className={styles.toolbar}>
            <h2>Daftar Laporan</h2>

            <div className={styles.filters}>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    selectedStatus === status
                      ? styles.activeFilter
                      : styles.filterButton
                  }
                  onClick={() => changeStatus(status)}
                  disabled={isPending}
                  aria-pressed={selectedStatus === status}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.reportList}>
            {errorMessage ? (
              <div className={styles.empty} role="alert">
                {errorMessage}
              </div>
            ) : reports.length > 0 ? (
              reports.map((report) => (
                <article key={report.id} className={styles.reportCard}>
                  <div className={styles.reportContent}>
                    <div className={styles.reportTop}>
                      <span
                        className={`${styles.status} ${styles[report.status]}`}
                      >
                        {statusLabels[report.status]}
                      </span>

                      <span className={styles.date}>
                        {report.date}
                      </span>
                    </div>

                    <h3>{report.facility}</h3>

                    <p className={styles.category}>
                      {categoryLabels[report.category] ?? report.category}
                    </p>

                    <p className={styles.description}>
                      {report.description}
                    </p>
                  </div>

                  <Link
                    href={`/petugas/laporan/${report.id}`}
                    className={styles.detailButton}
                  >
                    Periksa laporan
                  </Link>
                </article>
              ))
            ) : (
              <div className={styles.empty}>
                {selectedStatus === 'semua'
                  ? 'Belum ada laporan masuk.'
                  : 'Tidak ada laporan dengan status tersebut.'}
              </div>
            )}
          </div>

          {!errorMessage && totalPages > 1 && (
            <nav
              aria-label="Halaman antrean laporan"
              className={styles.toolbar}
              style={{ marginTop: '24px' }}
            >
              {page > 1 && (
                <Link
                  href={`/petugas/laporan?status=${selectedStatus}&page=${page - 1}`}
                >
                  Sebelumnya
                </Link>
              )}

              <span>
                Halaman {page} dari {totalPages}
              </span>

              {page < totalPages && (
                <Link
                  href={`/petugas/laporan?status=${selectedStatus}&page=${page + 1}`}
                >
                  Berikutnya
                </Link>
              )}
            </nav>
          )}
        </section>
      </section>
    </main>
  )
}