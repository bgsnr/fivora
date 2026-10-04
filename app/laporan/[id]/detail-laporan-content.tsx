'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowUpRight,
  FileText,
  MessageSquare,
} from 'lucide-react'

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
      <div className={styles.container}>
        <header className={styles.navigation}>
          <Link href="/" className={styles.brand}>
            FIVORA<span className={styles.brandDot}>.</span>
          </Link>

          <Link href="/laporan" className={styles.historyButton}>
            <FileText
              size={18}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span>Riwayat laporan</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </header>

        <section
          className={styles.heading}
          aria-labelledby="report-title"
        >
          <div className={styles.headingText}>
            <p className={styles.eyebrow}>
              DETAIL LAPORAN / #{report.id}
            </p>

            <h1 id="report-title">{report.facility}</h1>
          </div>

          <span
            className={`${styles.status} ${statusClasses[report.status]}`}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            {statusLabels[report.status]}
          </span>
        </section>

        <dl className={styles.information}>
          <div>
            <dt>Kategori kerusakan</dt>
            <dd>
              {categoryLabels[report.category] ?? report.category}
            </dd>
          </div>

          <div>
            <dt>Tanggal laporan</dt>
            <dd>{report.date}</dd>
          </div>

          <div>
            <dt>Lokasi fasilitas</dt>
            <dd>
              {report.location || 'Lokasi belum dicantumkan'}
            </dd>
          </div>
        </dl>

        <div className={styles.workspace}>
          <div className={styles.reportContent}>
            <section
              className={styles.descriptionSection}
              aria-labelledby="description-title"
            >
              <p className={styles.sectionLabel}>KONDISI FASILITAS</p>

              <h2 id="description-title">Deskripsi kerusakan</h2>

              <p className={styles.description}>
                {report.description}
              </p>
            </section>

            <figure className={styles.photoSection}>
              <figcaption className={styles.photoHeading}>
                <span>Foto kerusakan</span>
                <span className={styles.attachmentLabel}>Lampiran</span>
              </figcaption>

              <div className={styles.photoFrame}>
                {failedPhotoId === report.id ? (
                  <div className={styles.photoError} role="alert">
                    <p>Foto gagal dimuat.</p>
                    <span>Coba muat ulang halaman.</span>
                  </div>
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
            </figure>
          </div>

          <aside
            className={styles.officerPanel}
            aria-labelledby="officer-note-title"
          >
            <div className={styles.officerHeading}>
              <p className={styles.officerLabel}>PENANGANAN LAPORAN</p>

              <MessageSquare
                size={22}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>

            <h2 id="officer-note-title">Catatan petugas</h2>

            <div className={styles.notePaper}>
              <p>
                {report.officerNote || 'Belum ada catatan dari petugas'}
              </p>
            </div>

            <dl className={styles.processingInfo}>
              <div>
                <dt>Waktu pemrosesan terakhir</dt>
                <dd>{report.processedAt ?? 'Belum diproses'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  )
}