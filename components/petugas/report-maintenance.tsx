'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import {
  getReportMaintenance,
  startReportMaintenance,
  finishReportMaintenance,
  type MaintenanceData,
} from '@/lib/actions/report-maintenance'

import styles from '@/app/petugas/laporan/[id]/detail-laporan-petugas.module.css'

type Props = {
  reportId: string
  reportStatus: string
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

  useEffect(() => {
    let cancelled = false

    async function loadMaintenance() {
      try {
        const result = await getReportMaintenance(reportId)

        if (cancelled) return

        if (!result.success) {
          setData(null)
          setReadError(result.error)
          return
        }

        setData(result.data)
        setReadError('')
      } catch {
        if (!cancelled) {
          setData(null)
          setReadError('Data perbaikan gagal dimuat. Coba lagi.')
        }
      }
    }

    void loadMaintenance()

    return () => {
      cancelled = true
    }
  }, [reportId, reportStatus, reloadVersion])

  function reloadData() {
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

  const canStart =
    data?.reportStatus === 'diproses' &&
    ['aktif', 'nonaktif'].includes(data.facilityStatus)

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
        <p className={styles.text} style={{ marginTop: '20px' }}>
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
                  : 'Tidak ada perbaikan terbuka'}
              </dd>
            </div>
          </dl>

          {maintenance && (
            <>
              <h3>Laporan Dasar Perbaikan</h3>

              <Link
                href={`/petugas/laporan/${maintenance.reportId}`}
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

          {data.facilityStatus === 'nonaktif' && (
            <div className={styles.closedNotice}>
              Fasilitas dinonaktifkan admin. Menyelesaikan perbaikan
              tidak akan mengaktifkannya kembali.
            </div>
          )}

          {maintenance || canStart ? (
            <form className={styles.form} onSubmit={handleSubmit}>
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

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={loading}
                  style={{ marginTop: '5px' }}
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
                    : 'Mulai Perbaikan Fasilitas'}
              </button>
            </form>
          ) : (
            <div className={styles.closedNotice}>
              {data.facilityStatus === 'dalam_perbaikan'
                ? 'Status fasilitas menunjukkan perbaikan, tetapi riwayat perbaikannya belum tercatat. Data perlu diperiksa sebelum melanjutkan.'
                : 'Perbaikan baru dapat dimulai melalui laporan berstatus Diproses.'}
            </div>
          )}
        </>
      )}
    </section>
  )
}