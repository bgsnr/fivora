'use client'

import Image from 'next/image'
import Link from 'next/link'
import AutoRefresh from '@/components/layout/auto-refresh'
import { useState } from 'react'
import {
  ArrowUpRight,
  FileText,
  MessageSquare,
} from 'lucide-react'

import ReportProgress from '@/components/reports/report-progress'
import type { UserReportMaintenance } from '@/lib/actions/report-history'
import styles from './detail-laporan.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

type Props = {
  backHref: string
  maintenance: UserReportMaintenance[]
  maintenanceError: string
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

function formatDate(value: string) {
  const date = new Date(value)
  const day = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(date)
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta',
  }).format(date).replace(':', '.')
  return `${day}, ${time} WIB`
}

export default function DetailLaporanContent({
  report,
  backHref,
  maintenance,
  maintenanceError,
}: Props) {
  const [failedPhotoId, setFailedPhotoId] = useState<string | null>(null)

  const statusClasses: Record<ReportStatus, string> = {
    baru: styles.statusBaru,
    diproses: styles.statusDiproses,
    selesai: styles.statusSelesai,
    ditolak: styles.statusDitolak,
  }

  return (
    <main className={styles.page}>
      <AutoRefresh />
      <div className={styles.container}>
        <section
          className={styles.heading}
          aria-labelledby="report-title"
        >
          <div className={styles.headingTop}>
            <p className={styles.eyebrow}>
              DETAIL LAPORAN / #{report.id}
            </p>

            <Link href={backHref} className={styles.historyButton}>
              <FileText
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span>Riwayat laporan</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.titleRow}>
            <h1 id="report-title">{report.facility}</h1>

            <span
              className={`${styles.status} ${statusClasses[report.status]}`}
            >
              <span className={styles.statusDot} aria-hidden="true" />
              {statusLabels[report.status]}
            </span>
          </div>
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

            <h2 id="officer-note-title">Tindak lanjut</h2>

            {report.officerNote ? (
              <div className={styles.notePaper}>
                <h3>Catatan petugas</h3>
                <p>{report.officerNote}</p>
              </div>
            ) : maintenance.length === 0 && !maintenanceError ? (
              <div className={styles.notePaper}>
                <p>Belum ada catatan perubahan status</p>
              </div>
            ) : null}

            <ReportProgress key={`${report.id}-${report.status}`} reportId={report.id} />

            {maintenanceError && (
              <p className={styles.maintenanceError} role="alert">
                {maintenanceError}
              </p>
            )}

            {maintenance.map((item) => (
              <section className={styles.maintenanceEntry} key={item.id}>
                <div className={styles.maintenanceHeading}>
                  <h3>Perbaikan fasilitas</h3>
                  <span>{item.completedAt ? 'Selesai' : 'Berlangsung'}</span>
                </div>
                <p className={styles.maintenanceDate}>
                  Dimulai {formatDate(item.startedAt)}
                </p>
                <div className={styles.notePaper}>
                  <h4>Alasan perbaikan</h4>
                  <p>{item.reason}</p>
                  {item.notes.length > 0 && (
                    <section className={styles.findings} aria-label="Catatan pemeriksaan perbaikan">
                      <h4>Catatan pemeriksaan</h4>
                      <ol>
                        {item.notes.map((entry) => (
                          <li key={entry.id}>
                            <p>{entry.note}</p>
                            <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}
                  {item.completionNote && (
                    <>
                      <h4 className={styles.completionTitle}>Hasil perbaikan</h4>
                      <p>{item.completionNote}</p>
                    </>
                  )}
                </div>
                {item.completedAt && (
                  <p className={styles.maintenanceDate}>
                    Selesai {formatDate(item.completedAt)}
                  </p>
                )}
              </section>
            ))}

            <dl className={styles.processingInfo}>
              <div>
                <dt>Status laporan terakhir diperbarui</dt>
                <dd>{report.processedAt ?? 'Belum diproses'}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  )
}
