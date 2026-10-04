import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  UserRound,
} from 'lucide-react'
import { requireReportRole } from '@/lib/report-access'
import styles from './petugas.module.css'

export default async function PetugasPage() {
  const petugas = await requireReportRole('petugas')

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <Link href="/" className={styles.brand}>
            FIVORA<span className={styles.brandDot}>.</span>
          </Link>

          <span className={styles.role}>
            <UserRound size={16} strokeWidth={1.5} aria-hidden="true" />
            Petugas
          </span>
        </header>

        <section
          className={styles.welcome}
          aria-labelledby="welcome-title"
        >
          <p className={styles.eyebrow}>RUANG KERJA PETUGAS</p>

          <h1 id="welcome-title">
            Selamat datang,
            <br />
            <span>{petugas.name}</span>
          </h1>

          <p className={styles.introduction}>
            Periksa pengajuan yang masuk dan tangani laporan
            kerusakan fasilitas kampus.
          </p>
        </section>

        <section className={styles.menu} aria-label="Menu petugas">
          <article className={styles.reportCard}>
            <div className={styles.cardTop}>
              <span className={styles.cardLabel}>
                PELAPORAN & PERBAIKAN
              </span>

              <span className={styles.reportIcon} aria-hidden="true">
                <ClipboardList size={26} strokeWidth={1.5} />
              </span>
            </div>

            <div className={styles.cardContent}>
              <h2>Laporan kerusakan</h2>

              <p>
                Periksa laporan yang masuk, perbarui status
                penanganan, dan catat perbaikan fasilitas.
              </p>
            </div>

            <div className={styles.reportFooter}>
              <Link
                href="/petugas/laporan"
                className={styles.primaryButton}
              >
                Buka antrean laporan
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </article>

          <article className={styles.reservationCard}>
            <div className={styles.cardTop}>
              <span className={styles.cardLabel}>
                PEMINJAMAN FASILITAS
              </span>

              <span
                className={styles.reservationIcon}
                aria-hidden="true"
              >
                <CalendarDays size={26} strokeWidth={1.5} />
              </span>
            </div>

            <div className={styles.cardContent}>
              <h2>Reservasi fasilitas</h2>

              <p>
                Periksa pengajuan reservasi, berikan persetujuan
                atau penolakan, dan tangani pembatalan mendesak.
              </p>
            </div>

            <div className={styles.reservationFooter}>
              <button
                type="button"
                className={styles.disabledButton}
                disabled
              >
                Antrean reservasi
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}