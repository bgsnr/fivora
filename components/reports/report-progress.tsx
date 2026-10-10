'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { addReportProgress, getReportProgress, type ProgressEntry } from '@/lib/actions/report-progress'
import styles from './report-progress.module.css'

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

export default function ReportProgress({
  reportId,
  editable = false,
  hideTopDivider = false,
}: {
  reportId: string
  editable?: boolean
  hideTopDivider?: boolean
}) {
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [canAdd, setCanAdd] = useState(false)
  const [reading, setReading] = useState(true)
  const [readError, setReadError] = useState('')
  const [version, setVersion] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const busyRef = useRef(false)
  const requestRef = useRef<{ note: string; id: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function read() {
      try {
        const result = await getReportProgress(reportId)
        if (cancelled) return
        if (!result.success) {
          setReadError(result.error)
          setCanAdd(false)
          return
        }
        setEntries(result.entries)
        setHasMore(result.hasMore)
        setCanAdd(result.canAdd)
        setReadError('')
      } catch {
        if (!cancelled) {
          setReadError('Perkembangan laporan gagal dimuat. Klik Muat ulang.')
          setCanAdd(false)
        }
      } finally {
        if (!cancelled) setReading(false)
      }
    }
    void read()
    return () => { cancelled = true }
  }, [reportId, version])

  function reload() {
    if (busyRef.current || reading) return
    setReading(true)
    setReadError('')
    setMessage('')
    setVersion((value) => value + 1)
  }

  async function loadOlder() {
    const last = entries.at(-1)
    if (!last || busyRef.current || reading) return
    busyRef.current = true
    setReading(true)
    try {
      const result = await getReportProgress(reportId, last.id)
      if (!result.success) { setReadError(result.error); return }
      setEntries((current) => {
        const ids = new Set(current.map((item) => item.id))
        return [...current, ...result.entries.filter((item) => !ids.has(item.id))]
      })
      setHasMore(result.hasMore)
      setCanAdd(result.canAdd)
      setReadError('')
    } catch {
      setReadError('Catatan sebelumnya gagal dimuat. Coba lagi.')
    } finally {
      busyRef.current = false
      setReading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyRef.current || reading || !canAdd) return
    setError('')
    setMessage('')
    const cleanNote = note.trim()
    if (!cleanNote || cleanNote.length > 5000) {
      setError('Catatan perkembangan wajib diisi, maksimal 5000 karakter.')
      return
    }
    busyRef.current = true
    setSaving(true)
    try {
      // Pakai ID yang sama saat mencoba kembali setelah hasilnya belum pasti.
      if (requestRef.current?.note !== cleanNote) {
        requestRef.current = { note: cleanNote, id: crypto.randomUUID() }
      }
      const result = await addReportProgress(reportId, cleanNote, requestRef.current.id)
      if (!result.success) { setError(result.error); return }
      setEntries((current) => [result.entry, ...current.filter((item) => item.id !== result.entry.id)])
      setNote('')
      requestRef.current = null
      setMessage('Perkembangan tersimpan. Status laporan tetap Diproses.')
    } catch {
      setError('Koneksi terputus. Muat ulang untuk memeriksa catatan, atau coba simpan kembali.')
    } finally {
      busyRef.current = false
      setSaving(false)
    }
  }

  return (
    <section className={`${styles.progress} ${editable ? '' : styles.reader} ${hideTopDivider ? styles.noTopDivider : ''}`}
       aria-label="Perkembangan laporan">
      <div className={styles.heading}>
        <h3>Perkembangan laporan</h3>
        <button type="button" className={styles.reload} disabled={reading || saving} onClick={reload}>
          Muat ulang
        </button>
      </div>
      {editable && canAdd && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Tambah perkembangan untuk pelapor</span>
            <textarea rows={4} value={note} maxLength={5000}
              onChange={(event) => setNote(event.target.value)} disabled={saving || reading}
              placeholder="Contoh: Kebocoran sudah diperiksa. Penggantian bagian plafon dijadwalkan besok." />
          </label>
          <p className={styles.help}>Terlihat oleh pemilik laporan ini. Menyimpan catatan tidak mengubah status laporan.</p>
          <button type="submit" className={styles.save} disabled={saving || reading}>
            {saving ? 'Menyimpan...' : 'Simpan perkembangan'}
          </button>
        </form>
      )}
      {message && <p className={styles.success} role="status">{message}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {readError && <p className={styles.error} role="alert">{readError}</p>}
      {reading && <p className={styles.help} role="status">Memuat perkembangan...</p>}
      {!reading && !readError && entries.length === 0 && (
        <p className={styles.empty}>Belum ada catatan perkembangan</p>
      )}
      {entries.length > 0 && (
        <>
          <p className={styles.order}>Catatan terbaru di atas</p>
          <ol className={styles.entries}>
            {entries.map((item) => (
              <li key={item.id}>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                <p>{item.note}</p>
              </li>
            ))}
          </ol>
        </>
      )}
      {hasMore && (
        <button type="button" className={styles.older} onClick={loadOlder} disabled={reading || saving}>
          Catatan sebelumnya
        </button>
      )}
    </section>
  )
}
