import Link from 'next/link'
import styles from './laporan.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

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
      <section className={styles.container}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>FIVORA</p>

            <h1>Riwayat Laporan</h1>

            <p className={styles.description}>
              Lihat perkembangan laporan kerusakan yang pernah kamu kirim.
            </p>
          </div>

          <Link href="/laporan/buat" className={styles.createButton}>
            Buat Laporan
          </Link>
        </div>

        {errorMessage ? (
          <div className={styles.reportCard} role="alert">
            <p>{errorMessage}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.reportCard}>
            <h2>Belum ada laporan</h2>

            <p className={styles.reportDescription}>
              Laporan yang kamu kirim akan muncul di halaman ini.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {reports.map((report) => (
                <article className={styles.reportCard} key={report.id}>
                  <div className={styles.reportTop}>
                    <div>
                      <p className={styles.category}>
                        {categoryLabels[report.category] ?? report.category}
                      </p>

                      <h2>{report.facility}</h2>
                    </div>

                    <span
                      className={`${styles.status} ${
                        statusClasses[report.status]
                      }`}
                    >
                      {statusLabels[report.status]}
                    </span>
                  </div>

                  <p className={styles.reportDescription}>
                    {report.description}
                  </p>

                  <div className={styles.reportBottom}>
                    <span>Dikirim pada {report.date}</span>

                    <Link href={`/laporan/${report.id}`}>
                      Lihat detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Halaman riwayat laporan"
                className={styles.reportBottom}
                style={{ marginTop: '24px', gap: '16px', flexWrap: 'wrap' }}
              >
                {page > 1 && (
                  <Link href={`/laporan?page=${page - 1}`}>
                    Sebelumnya
                  </Link>
                )}

                <span>
                  Halaman {page} dari {totalPages}
                </span>

                {page < totalPages && (
                  <Link href={`/laporan?page=${page + 1}`}>
                    Berikutnya
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  )
}