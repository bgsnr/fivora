'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import {
  useDemoReports,
  updateDemoReport,
  type Report,
} from '@/lib/use-demo-reports'
import styles from './detail-laporan-petugas.module.css'

const statusLabels: Record<string, string> = {
  baru: 'Baru',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

export default function DetailLaporanPetugasPage() {
  const { id } = useParams<{ id: string }>()
  const reports = useDemoReports()
  const report = reports.find((item) => String(item.id) === id)

  if (!report) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <h1>Laporan tidak ditemukan</h1>
          <Link href="/petugas/laporan" className={styles.backLink}>
            Kembali ke antrean laporan
          </Link>
        </section>
      </main>
    )
  }

  return <ReportDetail key={report.id} report={report} />
}

function ReportDetail({ report }: { report: Report }) {
  const currentStatus = report.status
  const savedNote = report.officerNote

  const [selectedStatus, setSelectedStatus] = useState(report.status)
  const [note, setNote] = useState(report.officerNote)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const isClosed =
    currentStatus === 'selesai' || currentStatus === 'ditolak'

  const nextStatuses =
    currentStatus === 'baru'
      ? ['diproses', 'ditolak']
      : currentStatus === 'diproses'
        ? ['selesai', 'ditolak']
        : []

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (isClosed) {
      setError('Laporan sudah ditutup dan tidak dapat diubah.')
      return
    }

    if (!nextStatuses.includes(selectedStatus)) {
      setError('Pilih status penanganan yang baru.')
      return
    }

    const cleanNote = note.trim()

    if (
      (selectedStatus === 'selesai' || selectedStatus === 'ditolak') &&
      !cleanNote
    ) {
      setError('Isi catatan sebelum menyelesaikan atau menolak laporan.')
      return
    }

    try {
      updateDemoReport(report.id, selectedStatus, cleanNote)
      setNote(cleanNote)
      setMessage('Status laporan berhasil diperbarui.')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Perubahan gagal disimpan di browser.'
      )
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/petugas/laporan" className={styles.backLink}>
          ← Kembali ke antrean laporan
        </Link>

        <header className={styles.heading}>
          <p className={styles.eyebrow}>PETUGAS</p>
          <h1>Detail Laporan #{report.id}</h1>
          <p>Periksa masalah yang dilaporkan sebelum menentukan tindakan.</p>
        </header>

        <p className={styles.demoNotice}>
          Mode demo · Data tersimpan di browser ini.
        </p>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <h2>Informasi Laporan</h2>

              <span
                className={`${styles.status} ${styles[currentStatus]}`}
              >
                {statusLabels[currentStatus]}
              </span>
            </div>

            <dl className={styles.info}>
              <div>
                <dt>Fasilitas</dt>
                <dd>{report.facility}</dd>
              </div>

              <div>
                <dt>Kategori</dt>
                <dd>{report.category}</dd>
              </div>

              <div>
                <dt>Tanggal laporan</dt>
                <dd>{report.date}</dd>
              </div>
            </dl>

            <h3>Deskripsi Masalah</h3>
            <p className={styles.text}>{report.description}</p>

            <h3>Foto Laporan</h3>
            <div className={styles.photoPlaceholder}>
              Foto belum tersedia pada data contoh.
            </div>

            <h3>Catatan Petugas</h3>
            <p className={styles.text}>
              {savedNote || 'Belum ada catatan petugas.'}
            </p>
          </section>

          <section className={styles.card}>
            <h2>Penanganan Laporan</h2>

            {isClosed ? (
              <p className={styles.closedNotice}>
                Laporan sudah {statusLabels[currentStatus].toLowerCase()}.
                Status dan catatan tidak dapat diubah lagi.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <label className={styles.field}>
                  <span>Status</span>

                  <select
                    value={
                      nextStatuses.includes(selectedStatus)
                        ? selectedStatus
                        : currentStatus
                    }
                    onChange={(event) => {
                      setSelectedStatus(event.target.value)
                      setError('')
                      setMessage('')
                    }}
                  >
                    <option value={currentStatus}>
                      {statusLabels[currentStatus]} (saat ini)
                    </option>

                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Catatan Petugas</span>

                  <textarea
                    rows={6}
                    value={note}
                    onChange={(event) => {
                      setNote(event.target.value)
                      setError('')
                      setMessage('')
                    }}
                    placeholder="Tuliskan tindakan atau alasan penolakan."
                    aria-describedby="note-help"
                  />
                </label>

                <p id="note-help" className={styles.help}>
                  Wajib diisi jika laporan diselesaikan atau ditolak.
                  Untuk laporan duplikat, cantumkan nomor laporan utama.
                </p>

                <button type="submit" className={styles.primaryButton}>
                  Terapkan Status
                </button>
              </form>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className={styles.success} role="status">
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}