'use client'

import FivoraLogo from '@/components/branding/fivora-logo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import ReportMaintenance from '@/components/petugas/report-maintenance'
import ReportProgress from '@/components/reports/report-progress'
import { ArrowLeft } from 'lucide-react'
import type { MaintenanceReadState } from '@/lib/actions/report-maintenance'
import type { ReportListContext } from '@/lib/report-filters'
import styles from './detail-laporan-petugas.module.css'

type ReportStatus = 'baru' | 'diproses' | 'selesai' | 'ditolak'

type Report = {
  id: string
  facility: string
  location: string
  category: string
  description: string
  status: ReportStatus
  officerNote: string
  date: string
  processedAt: string | null
  updatedAt: string
}

const statusLabels: Record<ReportStatus, string> = {
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const categoryLabels: Record<string, string> = {
  peralatan: 'Peralatan',
  listrik: 'Listrik',
  kebersihan: 'Kebersihan',
  bangunan: 'Bangunan',
  lainnya: 'Lainnya',
}

export default function DetailLaporanPetugasContent({
  report,
  backHref,
  listContext,
}: {
  report: Report
  backHref: string
  listContext: ReportListContext
}) {
  const router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [maintenanceRead, setMaintenanceRead] = useState<MaintenanceReadState | null>(null)
  const [failedPhotoId, setFailedPhotoId] = useState<string | null>(null)

  function handleSaved() {
    setMessage('Status laporan berhasil diperbarui.')

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <Link href="/" className={styles.brand}>
            <FivoraLogo />
          </Link>

          <Link href={backHref} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            Antrean laporan
          </Link>
        </header>

        <div className={styles.heading}>
          <p className={styles.eyebrow}>PETUGAS</p>
          <h1>Detail Laporan #{report.id}</h1>
          <p>Periksa kondisi fasilitas dan tentukan tindak lanjut laporan.</p>
        </div>

        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.reportCard}`}>
            <div className={styles.cardHeading}>
              <h2>{report.facility}</h2>
              <span className={`${styles.status} ${styles[report.status]}`}>
                {statusLabels[report.status]}
              </span>
            </div>

            <div className={styles.reportBody}>
              <div className={styles.reportInformation}>
                <dl className={styles.info}>
                  <div>
                    <dt>Kategori</dt>
                    <dd>{categoryLabels[report.category] ?? report.category}</dd>
                  </div>
                  <div>
                    <dt>Lokasi Fasilitas</dt>
                    <dd>{report.location || 'Lokasi belum dicantumkan'}</dd>
                  </div>
                  <div>
                    <dt>Tanggal Laporan</dt>
                    <dd>{report.date}</dd>
                  </div>
                  <div>
                    <dt>Status laporan terakhir diperbarui</dt>
                    <dd>{report.processedAt ?? 'Belum diproses'}</dd>
                  </div>
                </dl>

                <h3>Deskripsi Kerusakan</h3>
                <p className={styles.text}>{report.description}</p>

                <h3>Catatan perubahan status</h3>
                <p className={`${styles.text} ${styles.savedNote}`}>
                  {report.officerNote || 'Belum ada catatan dari petugas.'}
                </p>
              </div>

              <figure className={styles.reportPhoto}>
                <figcaption>Foto kerusakan</figcaption>
                {failedPhotoId === report.id ? (
                  <p className={styles.photoError} role="alert">
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
              </figure>
            </div>
          </section>

          <div className={styles.actionRow}>
            <section className={`${styles.card} ${styles.handlingCard}`}>
              <h2>Penanganan Laporan</h2>
              {message && (
                <div className={styles.success} role="status">
                  {message}
                </div>
              )}
              <HandlingForm
                key={`${report.id}-${report.updatedAt}`}
                report={report}
                refreshing={refreshing}
                maintenanceRead={maintenanceRead}
                onSaved={handleSaved}
                onStart={() => setMessage('')}
              />
              <ReportProgress key={`${report.id}-${report.status}`} reportId={report.id} editable />
            </section>

            <ReportMaintenance
              key={report.id}
              reportId={report.id}
              reportStatus={report.status}
              listContext={listContext}
              onRead={setMaintenanceRead}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function HandlingForm({
  report,
  refreshing,
  maintenanceRead,
  onSaved,
  onStart,
}: {
  report: Report
  refreshing: boolean
  maintenanceRead: MaintenanceReadState | null
  onSaved: () => void
  onStart: () => void
}) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [note, setNote] = useState(report.officerNote)
  const [laporanUtamaId, setLaporanUtamaId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsReload, setNeedsReload] = useState(false)
  const [saved, setSaved] = useState(false)

  const submittingRef = useRef(false)

  const isClosed =
    report.status === 'selesai' || report.status === 'ditolak'

  const nextStatuses: ReportStatus[] =
    report.status === 'baru'
      ? ['diproses', 'ditolak']
      : report.status === 'diproses'
        ? ['selesai', 'ditolak']
        : []

  const checkingMaintenance = !maintenanceRead ||
    maintenanceRead.reportId !== report.id || maintenanceRead.checking
  const blockedByMaintenance = report.status === 'diproses' && (
    checkingMaintenance || maintenanceRead?.ownOpen || Boolean(maintenanceRead?.error)
  )
  const disabled = loading || refreshing || needsReload || saved || blockedByMaintenance

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current || disabled) {
      return
    }

    setError('')
    onStart()

    if (isClosed) {
      setError('Laporan sudah ditutup dan tidak dapat diubah.')
      return
    }

    if (!nextStatuses.includes(selectedStatus as ReportStatus)) {
      setError('Pilih status penanganan yang baru.')
      return
    }

    const cleanNote = note.trim()

    if (cleanNote.length > 5000) {
      setError('Catatan petugas maksimal 5000 karakter.')
      return
    }

    if (
      (selectedStatus === 'selesai' || selectedStatus === 'ditolak') &&
      !cleanNote
    ) {
      setError('Isi catatan sebelum menyelesaikan atau menolak laporan.')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const response = await fetch(
        `/api/reports/${report.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: selectedStatus,
            note: cleanNote,
            laporanUtamaId: laporanUtamaId.trim() || undefined,
            expectedUpdatedAt: report.updatedAt,
          }),
        }
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        setError(
          typeof result?.error === 'string'
            ? result.error
            : 'Perubahan gagal disimpan. Silakan coba lagi.'
        )

        if (response.status === 409) {
          setNeedsReload(true)
        }

        return
      }

      setSaved(true)
      onSaved()
    } catch {
      setError(
        'Koneksi terputus. Muat ulang halaman untuk memeriksa apakah perubahan sudah tersimpan.'
      )
      setNeedsReload(true)
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  if (isClosed) {
    return (
      <div className={styles.closedNotice}>
        Laporan sudah {statusLabels[report.status].toLowerCase()} dan
        tidak dapat diubah kembali.
      </div>
    )
  }

  if (blockedByMaintenance) {
    return (
      <div className={styles.closedNotice} role="status">
        {checkingMaintenance
          ? 'Memeriksa kegiatan perbaikan terkait laporan...'
          : maintenanceRead?.error
            ? 'Data perbaikan belum dapat diperiksa. Klik Muat ulang data pada panel Perbaikan Fasilitas.'
            : 'Laporan ini menjadi dasar perbaikan yang masih berlangsung. Selesaikan perbaikannya terlebih dahulu, lalu tutup laporan dengan catatan resolusi.'}
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span>Status Penanganan</span>

        <select
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          disabled={disabled}
        >
          <option value="">Pilih status baru</option>

          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      {selectedStatus === 'ditolak' && (
        <label className={styles.field}>
          <span>ID Laporan Utama (Opsional — untuk duplikat)</span>

          <input
            type="number"
            value={laporanUtamaId}
            onChange={(event) => setLaporanUtamaId(event.target.value)}
            placeholder="Contoh: 12 (ID Laporan utama yang diproses)"
            disabled={disabled}
          />
        </label>
      )}

      <label className={styles.field}>
        <span>Catatan Petugas</span>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Tuliskan hasil pemeriksaan atau alasan penutupan laporan"
          rows={6}
          maxLength={5000}
          disabled={disabled}
        />
      </label>

      <p className={styles.help}>
        Catatan wajib diisi untuk status Selesai atau Ditolak.
        Untuk laporan duplikat, isi ID Laporan Utama di atas.
      </p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {needsReload ? (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.refresh()}
        >
          Muat ulang halaman
        </button>
      ) : (
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={disabled}
        >
          {loading
            ? 'Menyimpan...'
            : refreshing
              ? 'Memuat perubahan...'
              : saved
                ? 'Tersimpan'
                : 'Simpan Perubahan'}
        </button>
      )}
    </form>
  )
}