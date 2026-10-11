'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  getReportMaintenance,
  startReportMaintenance,
  finishReportMaintenance,
  addReportMaintenanceNote,
  type MaintenanceReadState,
  type MaintenanceData,
} from '@/lib/actions/report-maintenance'

import { reportDetailHref, type ReportListContext } from '@/lib/report-filters'
import styles from '@/app/petugas/laporan/[id]/detail-laporan-petugas.module.css'
import historyStyles from './maintenance-history.module.css'
import { useAutoRefresh, canApplyRefresh } from '@/lib/use-auto-refresh'

type Props = {
  reportId: string
  reportStatus: string
  listContext?: ReportListContext
  onRead?: (state: MaintenanceReadState) => void
}

const facilityLabels: Record<string, string> = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  dalam_perbaikan: 'Dalam perbaikan',
}

function formatDate(value: string) {
  const date = new Date(value)

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)

  const waktu = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(date).replace(':', '.')

  return `${tanggal}, ${waktu} WIB`
}

export default function ReportMaintenance({
  reportId,
  reportStatus,
  listContext = { status: 'semua', page: 1 },
  onRead,
}: Props) {
  const router = useRouter()

  const [data, setData] = useState<MaintenanceData | null>(null)
  const [readError, setReadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)

  const submittingRef = useRef(false)
  const readingRef = useRef(true)

  useEffect(() => {
    let cancelled = false
    readingRef.current = true

    async function loadMaintenance() {
      try {
        const result = await getReportMaintenance(reportId)

        if (cancelled) return

        if (!result.success) {
          setData(null)
          setReadError(result.error)
          onRead?.({ reportId, checking: false, ownOpen: false, error: result.error })
          return
        }

        setData(result.data)
        setReadError('')
        onRead?.({ reportId, checking: false,
          ownOpen: result.data.openMaintenance?.reportId === reportId, error: '' })
      } catch {
        if (!cancelled) {
          setData(null)
          setReadError('Data perbaikan gagal dimuat. Coba lagi.')
          onRead?.({ reportId, checking: false, ownOpen: false,
            error: 'Data perbaikan gagal dimuat. Coba lagi.' })
        }
      } finally {
        if (!cancelled) readingRef.current = false
      }
    }

    void loadMaintenance()

    return () => {
      cancelled = true
    }
  }, [reportId, reportStatus, reloadVersion, onRead])

  useAutoRefresh(async (signal, automatic) => {
    if (loading || submittingRef.current || readingRef.current) return
    try {
      const result = await getReportMaintenance(reportId)
      if (!canApplyRefresh(signal, automatic) || submittingRef.current) return
      if (!result.success) { setReadError(result.error); return }
      setData(result.data)
      setReadError('')
      onRead?.({ reportId, checking: false,
        ownOpen: result.data.openMaintenance?.reportId === reportId, error: '' })
    } catch {
      if (canApplyRefresh(signal, automatic)) setReadError('Data perbaikan gagal diperbarui. Coba lagi.')
    }
  }, { resetKey: reportId })

  function reloadData() {
    readingRef.current = true
    onRead?.({ reportId, checking: true, ownOpen: false, error: '' })
    setData(null)
    setReadError('')
    setError('')
    setNote('')
    setConfirmed(false)
    setReloadVersion((value) => value + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!data || submittingRef.current) return

    setError('')
    setMessage('')

    const cleanNote = note.trim()
    const maintenance = data.openMaintenance

    if (!maintenance && data.reportStatus !== 'diproses') {
      setError('Ubah status laporan menjadi Diproses terlebih dahulu.')
      return
    }

    if (!maintenance && data.history.length > 0) {
      setError('Perbaikan melalui laporan ini sudah selesai dan tidak dapat dimulai ulang.')
      return
    }

    if (!cleanNote || cleanNote.length > 5000) {
      setError('Isi catatan dengan panjang maksimal 5000 karakter.')
      return
    }

    if (!confirmed) {
      setError('Centang konfirmasi sebelum menyimpan.')
      return
    }

    submittingRef.current = true
    setLoading(true)

    try {
      const result = maintenance
        ? await finishReportMaintenance(
            maintenance.id,
            cleanNote,
            confirmed
          )
        : await startReportMaintenance(
            reportId,
            cleanNote,
            confirmed
          )

      if (!result.success) {
        setError(result.error)
        return
      }

      setMessage(result.message)
      reloadData()
      router.refresh()
    } catch {
      setError(
        'Koneksi terputus. Muat ulang data untuk memeriksa hasil penyimpanan.'
      )
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const maintenance = data?.openMaintenance
  const hasCompletedMaintenance = Boolean(data?.history.length)
  const openNotes = data?.notes.filter((entry) => entry.maintenanceId === maintenance?.id) ?? []

  const needsMaintenanceRecord =
    data?.facilityStatus === 'dalam_perbaikan' && !maintenance

  const canStart =
    data?.reportStatus === 'diproses' &&
    !maintenance &&
    !hasCompletedMaintenance &&
    ['aktif', 'nonaktif', 'dalam_perbaikan'].includes(data.facilityStatus)

  return (
    <section className={`${styles.card} ${styles.maintenanceCard}`}>
      <div className={styles.cardHeading}>
        <h2>Perbaikan Fasilitas</h2>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={reloadData}
          disabled={loading}
        >
          Muat ulang data
        </button>
      </div>

      {message && (
        <div className={styles.success} role="status">
          {message}
        </div>
      )}

      {readError ? (
        <div className={styles.error} role="alert">
          {readError}
        </div>
      ) : !data ? (
        <p className={`${styles.text} ${styles.maintenanceLoading}`}>
          Memuat data perbaikan...
        </p>
      ) : (
        <>
          <dl className={styles.info}>
            <div>
              <dt>Status Layanan Fasilitas</dt>
              <dd>
                {facilityLabels[data.facilityStatus] ?? 'Tidak diketahui'}
              </dd>
            </div>

            <div>
              <dt>Kegiatan Perbaikan</dt>
              <dd>
                {maintenance
                  ? 'Sedang berlangsung'
                  : hasCompletedMaintenance
                    ? 'Perbaikan melalui laporan ini sudah selesai'
                  : 'Tidak ada perbaikan terbuka'}
              </dd>
            </div>
          </dl>

          {maintenance && (
            <>
              <h3>Perbaikan ini dimulai dari</h3>

              <Link
                href={reportDetailHref(maintenance.reportId, listContext.status, listContext.page, 'petugas')}
                className={styles.backLink}
              >
                Laporan #{maintenance.reportId}
              </Link>

              <p className={styles.text}>
                Dimulai pada {formatDate(maintenance.startedAt)}
              </p>

              <h3>Alasan Perbaikan</h3>
              <p className={styles.text}>{maintenance.reason}</p>
            </>
          )}

          {openNotes.length > 0 && (
            <section className={styles.findings} aria-label="Riwayat catatan pemeriksaan">
              <h3>Catatan pemeriksaan</h3>
              <ol className={styles.findingsList}>
                {openNotes.map((entry) => (
                  <li key={entry.id}>
                    <p>{entry.note}</p>
                    <span>{formatDate(entry.createdAt)} · Perbaikan #{entry.maintenanceId}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {maintenance && (
            <FindingsForm key={maintenance.id} maintenanceId={maintenance.id}
              disabled={loading}
              onSaved={() => { reloadData(); router.refresh() }} />
          )}

          {data.facilityStatus === 'nonaktif' && (
            <div className={styles.closedNotice}>
              Fasilitas dinonaktifkan admin. Menyelesaikan perbaikan
              tidak akan mengaktifkannya kembali.
            </div>
          )}

          {needsMaintenanceRecord && (
            <div className={styles.closedNotice}>
              {hasCompletedMaintenance
                ? 'Fasilitas berstatus Dalam perbaikan, tetapi tidak ada kegiatan terbuka. Perbaikan melalui laporan ini sudah selesai. Periksa data fasilitas; kegiatan berikutnya harus menggunakan laporan lain yang valid dan berstatus Diproses.'
                : 'Fasilitas sudah berstatus Dalam perbaikan, tetapi belum ada catatan perbaikan yang sedang berlangsung. Isi alasan dan konfirmasi untuk mencatat penanganannya melalui laporan ini. Fasilitas tetap tidak tersedia untuk reservasi.'}
            </div>
          )}

          {maintenance || canStart ? (
            <form className={styles.form} onSubmit={handleSubmit}
              data-auto-refresh-blocked={Boolean(note || confirmed || loading)}>
              <label className={styles.field}>
                <span>
                  {maintenance
                    ? 'Catatan Penyelesaian Perbaikan'
                    : 'Alasan Perbaikan'}
                </span>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  disabled={loading}
                  placeholder={
                    maintenance
                      ? 'Jelaskan perbaikan yang telah dilakukan dan kondisi fasilitas'
                      : 'Jelaskan mengapa fasilitas perlu dihentikan penggunaannya'
                  }
                />
              </label>

              <label className={styles.confirmation}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={loading}
                />

                <span>
                  {maintenance
                    ? 'Saya sudah memeriksa fasilitas dan memastikan tidak ada kerusakan lain yang menghambat penggunaannya.'
                    : 'Saya memahami bahwa pengajuan menunggu yang belum dimulai akan ditolak dan reservasi disetujui yang belum berakhir akan dibatalkan.'}
                </span>
              </label>

              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading
                  ? 'Menyimpan...'
                  : maintenance
                    ? 'Selesaikan Perbaikan'
                    : needsMaintenanceRecord
                      ? 'Catat Perbaikan Fasilitas'
                      : 'Mulai Perbaikan Fasilitas'}
              </button>
            </form>
          ) : (
            <div className={styles.closedNotice}>
              {hasCompletedMaintenance
                ? data.reportStatus === 'diproses'
                  ? 'Perbaikan melalui laporan ini sudah selesai. Isi catatan hasil penanganan pada panel Penanganan Laporan, lalu tutup laporan sesuai hasil pemeriksaan.'
                  : 'Perbaikan melalui laporan ini sudah selesai. Riwayatnya tetap dapat dibaca di bawah.'
                : needsMaintenanceRecord
                ? 'Untuk mencatat perbaikan, gunakan laporan yang berstatus Diproses.'
                : 'Perbaikan baru dapat dimulai melalui laporan berstatus Diproses.'}
            </div>
          )}

          {data.history.length > 0 && (
            <section className={historyStyles.history} aria-label="Riwayat perbaikan laporan ini">
              <h3>Riwayat perbaikan laporan ini</h3>
              {data.history.map((item) => (
                <article className={historyStyles.entry} key={item.id}>
                  <div className={historyStyles.heading}>
                    <h4>Perbaikan #{item.id}</h4>
                    <span>Selesai</span>
                  </div>
                  <dl className={historyStyles.dates}>
                    <div><dt>Dimulai</dt><dd><time dateTime={item.startedAt}>{formatDate(item.startedAt)}</time></dd></div>
                    <div><dt>Selesai</dt><dd><time dateTime={item.completedAt}>{formatDate(item.completedAt)}</time></dd></div>
                  </dl>
                  <h4>Alasan awal perbaikan</h4>
                  <p>{item.reason}</p>
                  <h4>Catatan pemeriksaan</h4>
                  {data.notes.some((entry) => entry.maintenanceId === item.id) ? (
                    <ol className={historyStyles.notes}>
                      {data.notes.filter((entry) => entry.maintenanceId === item.id).map((entry) => (
                        <li key={entry.id}>
                          <p>{entry.note}</p>
                          <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={historyStyles.empty}>Tidak ada catatan pemeriksaan tambahan</p>}
                  <h4>Catatan penyelesaian perbaikan</h4>
                  <p>{item.completionNote}</p>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </section>
  )
}

function FindingsForm({ maintenanceId, disabled, onSaved }: {
  maintenanceId: string
  disabled: boolean
  onSaved: () => void
}) {
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)
  const requestId = useRef<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (disabled || submitting.current) return
    setError('')
    const cleanNote = note.trim()
    if (!cleanNote || cleanNote.length > 5000) {
      setError('Catatan pemeriksaan wajib diisi, maksimal 5000 karakter.')
      return
    }
    submitting.current = true
    setLoading(true)
    try {
      requestId.current ??= crypto.randomUUID()
      const result = await addReportMaintenanceNote(maintenanceId, cleanNote, requestId.current)
      if (!result.success) { setError(result.error); return }
      setNote('')
      requestId.current = null
      onSaved()
    } catch {
      setError('Koneksi terputus. Muat ulang data untuk memeriksa hasil penyimpanan.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <form className={`${styles.form} ${styles.findingsForm}`} onSubmit={handleSubmit}
      data-auto-refresh-blocked={Boolean(note || loading)}>
      <label className={styles.field}>
        <span>Tambah catatan pemeriksaan</span>
        <textarea value={note} rows={3} maxLength={5000}
          placeholder="Catat kerusakan tambahan atau perkembangan penanganan"
          disabled={disabled || loading}
          onChange={(event) => { setNote(event.target.value); requestId.current = null }} />
      </label>
      <p className={styles.help}>
        Catatan ini dapat dilihat oleh pemilik laporan yang digunakan untuk memulai perbaikan.
        Menyimpan catatan tidak menyelesaikan perbaikan.
      </p>
      {error && <div className={styles.error} role="alert">{error}</div>}
      <button type="submit" className={styles.noteButton} disabled={disabled || loading}>
        {loading ? 'Menyimpan catatan...' : 'Simpan catatan pemeriksaan'}
      </button>
    </form>
  )
}
