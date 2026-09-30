import Link from 'next/link'
import { reports } from './data'
import styles from './laporan.module.css'




export default function RiwayatLaporanPage() {
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

        <div className={styles.list}>
          {reports.map((report) => (
            <article className={styles.reportCard} key={report.id}>
              <div className={styles.reportTop}>
                <div>
                  <p className={styles.category}>{report.category}</p>
                  <h2>{report.facility}</h2>
                </div>

                <span
                  className={`${styles.status} ${
                    styles[
                      `status${report.status
                        .charAt(0)
                        .toUpperCase()}${report.status.slice(1)}`
                    ]
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <p className={styles.reportDescription}>
                {report.description}
              </p>

              <div className={styles.reportBottom}>
                <span>Dikirim pada {report.date}</span>
                <Link href={`/laporan/${report.id}`}>Lihat detail</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}