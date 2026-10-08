import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Plus,
} from 'lucide-react'
import {
  reportFilters,
  reportDetailHref,
  reportHistoryHref,
  type ReportFilter,
  type ReportStatus,
} from '@/lib/report-filters'
import styles from './laporan.module.css'

type Report = {
  id: string
  facility: string
  category: string
  description: string
  status: ReportStatus
  date: string
}

type Props = {
  reports: Report[]
  errorMessage: string
  selectedStatus: ReportFilter
  page: number
  totalPages: number
}

const categoryLabels: Record<string, string> = {
  peralatan: 'Peralatan',
  listrik: 'Listrik',
  kebersihan: 'Kebersihan',
  bangunan: 'Bangunan',
  lainnya: 'Lainnya',
}

const statusLabels: Record<ReportStatus, string> = {
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

export default function LaporanContent({
  reports,
  errorMessage,
  selectedStatus,
  page,
  totalPages,
}: Props) {
  const statusClasses: Record<ReportStatus, string> = {
    baru: styles.statusBaru,
    diproses: styles.statusDiproses,
    selesai: styles.statusSelesai,
    ditolak: styles.statusDitolak,
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <Link href="/" className={styles.brand}>
            FIVORA<span className={styles.brandDot}>.</span>
          </Link>

          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            Halaman utama
          </Link>
        </header>

        <section
          className={styles.heading}
          aria-labelledby="history-title"
        >
          <div className={styles.headingText}>
            <p className={styles.eyebrow}>LAPORAN SAYA</p>

            <h1 id="history-title">
              Riwayat <span>laporan.</span>
            </h1>

            <p className={styles.description}>
              Pantau status penanganan fasilitas yang kamu laporkan.
            </p>
          </div>

          <Link href="/laporan/buat" className={styles.createButton}>
            <Plus size={18} aria-hidden="true" />
            Buat laporan
          </Link>
        </section>

        <nav className={styles.statusFilters} aria-label="Filter status laporan">
          {reportFilters.map((status) => (
            <Link
              key={status}
              href={reportHistoryHref(status)}
              className={selectedStatus === status ? styles.activeFilter : styles.statusFilter}
              aria-current={selectedStatus === status ? 'page' : undefined}
              scroll={false}
            >
              {status === 'semua' ? 'Semua' : statusLabels[status]}
            </Link>
          ))}
        </nav>

        {errorMessage ? (
          <section className={styles.error} role="alert">
            <h2>Riwayat belum dapat ditampilkan</h2>
            <p>{errorMessage}</p>
          </section>
        ) : reports.length === 0 ? (
          <section className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <FileText size={28} strokeWidth={1.5} />
            </div>

            <h2>
              {selectedStatus === 'semua'
                ? 'Belum ada laporan'
                : `Tidak ada laporan ${statusLabels[selectedStatus].toLowerCase()}`}
            </h2>

            <p>
              {selectedStatus === 'semua'
                ? 'Laporan yang kamu kirim akan tercatat di sini, beserta status dan catatan penanganannya.'
                : 'Pilih status lain untuk melihat laporanmu.'}
            </p>

            <Link
              href={selectedStatus === 'semua' ? '/laporan/buat' : reportHistoryHref('semua')}
              className={styles.emptyLink}
            >
              {selectedStatus === 'semua' ? 'Buat laporan pertama' : 'Lihat semua laporan'}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <section
            className={styles.history}
            aria-labelledby="report-list-title"
          >
            <div className={styles.listHeading}>
              <h2 id="report-list-title">Laporan terkirim</h2>

              <span>
                Menampilkan {reports.length} laporan
              </span>
            </div>

            <div className={styles.list}>
              {reports.map((report) => (
                <article className={styles.reportRow} key={report.id}>
                  <div className={styles.reportIcon} aria-hidden="true">
                    <FileText size={22} strokeWidth={1.5} />
                  </div>

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
                      <Link href={reportDetailHref(report.id, selectedStatus, page)}>
                        {report.facility}
                      </Link>
                    </h3>

                    <p className={styles.reportDescription}>
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
                        statusClasses[report.status]
                      }`}
                    >
                      <span
                        className={styles.statusDot}
                        aria-hidden="true"
                      />
                      {statusLabels[report.status]}
                    </span>

                    <Link
                      href={reportDetailHref(report.id, selectedStatus, page)}
                      className={styles.detailLink}
                      aria-label={`Lihat detail laporan ${report.facility}, nomor ${report.id}`}
                    >
                      Lihat detail
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Halaman riwayat laporan"
                className={styles.pagination}
              >
                {page > 1 ? (
                  <Link
                    href={reportHistoryHref(selectedStatus, page - 1)}
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
                    href={reportHistoryHref(selectedStatus, page + 1)}
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
        )}
      </div>
    </main>
  )
}