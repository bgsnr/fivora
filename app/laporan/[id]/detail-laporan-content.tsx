import Link from 'next/link'
import { notFound } from 'next/navigation'
import { reports } from '../data'
import styles from './detail-laporan.module.css'

type DetailLaporanPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function DetailLaporanPage({
  params,
}: DetailLaporanPageProps) {
  const { id } = await params
  const report = reports.find((item) => item.id === Number(id))

  if (!report) {
    notFound()
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>DETAIL LAPORAN</p>
            <h1>{report.facility}</h1>
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

        <div className={styles.information}>
          <div>
            <span>Kategori</span>
            <p>{report.category}</p>
          </div>

          <div>
            <span>Tanggal Laporan</span>
            <p>{report.date}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Deskripsi Kerusakan</h2>
          <p>{report.description}</p>
        </div>

        <div className={styles.section}>
          <h2>Catatan Petugas</h2>
          <p>
            {report.officerNote ||
              'Belum ada catatan dari petugas.'}
          </p>
        </div>

        <Link href="/laporan" className={styles.backButton}>
          Kembali ke Riwayat
        </Link>
      </section>
    </main>
  )
}