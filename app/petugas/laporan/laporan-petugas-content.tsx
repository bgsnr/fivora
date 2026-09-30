'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useDemoReports } from '@/lib/use-demo-reports'
import styles from './laporan-petugas.module.css'

type ReportStatus = 'semua' | 'baru' | 'diproses' | 'selesai' | 'ditolak'

const statusOptions: ReportStatus[] = [
  'semua',
  'baru',
  'diproses',
  'selesai',
  'ditolak',
]

export default function PetugasLaporanPage() {
  const reports = useDemoReports()

  const [selectedStatus, setSelectedStatus] =
    useState<ReportStatus>('semua')

  const filteredReports =
    selectedStatus === 'semua'
      ? reports
      : reports.filter((report) => report.status === selectedStatus)

  function countStatus(status: string) {
    return reports.filter((report) => report.status === status).length
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>PETUGAS</p>
            <h1>Antrean Laporan</h1>
            <p>
              Periksa laporan kerusakan dan perbarui status penanganannya.
            </p>
          </div>
        </div>

        <section className={styles.summary}>
          <article className={styles.summaryCard}>
            <span>Total laporan</span>
            <strong>{reports.length}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Laporan baru</span>
            <strong>{countStatus('baru')}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Sedang diproses</span>
            <strong>{countStatus('diproses')}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Selesai</span>
            <strong>{countStatus('selesai')}</strong>
          </article>

          <article className={styles.summaryCard}>
            <span>Ditolak</span>
            <strong>{countStatus('ditolak')}</strong>
            </article>
        </section>

        <section className={styles.reportSection}>
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
                  onClick={() => setSelectedStatus(status)}
                >
                  {status === 'semua' ? 'Semua' : status}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.reportList}>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <article key={report.id} className={styles.reportCard}>
                  <div className={styles.reportContent}>
                    <div className={styles.reportTop}>
                      <span
                        className={`${styles.status} ${styles[report.status]}`}
                      >
                        {report.status}
                      </span>

                      <span className={styles.date}>{report.date}</span>
                    </div>

                    <h3>{report.facility}</h3>
                    <p className={styles.category}>{report.category}</p>
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
                Tidak ada laporan dengan status tersebut.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}