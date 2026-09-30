'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import styles from './detail-laporan.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

type Props = {
  report: {
    id: string
    facility: string
    location: string
    category: string
    description: string
    status: ReportStatus
    officerNote: string
    date: string
    processedAt: string | null
  }
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

export default function DetailLaporanContent({ report }: Props) {
  const [failedPhotoId, setFailedPhotoId] = useState<string | null>(null)

  const statusClasses: Record<ReportStatus, string> = {
    baru: styles.statusBaru,
    diproses: styles.statusDiproses,
    selesai: styles.statusSelesai,
    ditolak: styles.statusDitolak,
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              DETAIL LAPORAN #{report.id}
            </p>

            <h1>{report.facility}</h1>
          </div>

          <span
            className={`${styles.status} ${statusClasses[report.status]}`}
          >
            {statusLabels[report.status]}
          </span>
        </div>

        <div className={styles.information}>
          <div>
            <span>Kategori</span>
            <p>{categoryLabels[report.category] ?? report.category}</p>
          </div>

          <div>
            <span>Tanggal Laporan</span>
            <p>{report.date}</p>
          </div>

          <div>
            <span>Lokasi Fasilitas</span>
            <p>{report.location || 'Lokasi belum dicantumkan.'}</p>
          </div>

          <div>
            <span>Waktu Pemrosesan Terakhir</span>
            <p>{report.processedAt ?? 'Belum diproses'}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Deskripsi Kerusakan</h2>
          <p className={styles.multiline}>{report.description}</p>
        </div>

        <div className={styles.section}>
          <h2>Foto Kerusakan</h2>

          {failedPhotoId === report.id ? (
            <p role="alert">
              Foto gagal dimuat. Coba muat ulang halaman.
            </p>
          ) : (
            <Image
              key={report.id}
              src={`/api/reports/${report.id}/photo`}
              alt={`Foto kerusakan ${report.facility}`}
              width={800}
              height={600}
              className={styles.photo}
              unoptimized
              onError={() => setFailedPhotoId(report.id)}
            />
          )}
        </div>

        <div className={styles.section}>
          <h2>Catatan Petugas</h2>

          <p className={styles.multiline}>
            {report.officerNote || 'Belum ada catatan dari petugas.'}
          </p>
        </div>

        <Link href="/laporan" className={styles.backButton}>
          Kembali ke Riwayat
        </Link>
      </section>
    </main>
  )
}