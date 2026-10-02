import Link from 'next/link'
import { ClipboardList, CalendarDays, ArrowRight } from 'lucide-react'
import { requireReportRole } from '@/lib/report-access'
import styles from './petugas.module.css'

export default async function PetugasPage() {
  const petugas = await requireReportRole('petugas')

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            FIVORA
          </Link>
          <span className={styles.role}>Petugas</span>
        </header>

        <section className={styles.welcome}>
          <p className={styles.eyebrow}>HALAMAN PETUGAS</p>
          <h1>Selamat datang, {petugas.name}</h1>
          <p>
            Periksa pengajuan yang masuk dan tangani laporan kerusakan
            fasilitas kampus.
          </p>
        </section>

        <section className={styles.menu} aria-label="Menu petugas">
          <article className={styles.card}>
            <div className={styles.icon}>
              <CalendarDays size={28} aria-hidden="true" />
            </div>

            <h2>Reservasi Fasilitas</h2>
            <p>
              Periksa pengajuan reservasi, berikan persetujuan atau
              penolakan, dan tangani pembatalan dalam kondisi mendesak.
            </p>

            <button
              type="button"
              className={styles.disabledButton}
              disabled
            >
              Antrean Reservasi
            </button>
          </article>

          <article className={styles.card}>
            <div className={styles.icon}>
              <ClipboardList size={28} aria-hidden="true" />
            </div>

            <h2>Laporan Kerusakan</h2>
            <p>
              Periksa laporan yang masuk, perbarui status penanganan,
              dan catat perbaikan sampai fasilitas layak digunakan kembali.
            </p>

            <Link
              href="/petugas/laporan"
              className={styles.primaryButton}
            >
              Buka Antrean Laporan
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        </section>
      </div>
    </main>
  )
}
