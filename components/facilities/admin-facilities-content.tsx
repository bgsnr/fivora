'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Search, X } from 'lucide-react'

import {
  getAllFacilitiesAdmin,
  getUpcomingReservationsForFacility,
  setFacilityStatusAction,
} from '@/lib/actions/admin-facilities'

import type { PendingReservationInfo } from '@/lib/actions/admin-facilities'
import type { Facility } from '@/types/facility'

import styles from '@/app/admin/fasilitas/adminFasilitas.module.css'
import extra from './admin-management.module.css'

type Props = {
  initialFacilities: Facility[]
  initialError: string
}

const statusLabels: Record<string, string> = {
  menunggu: 'Menunggu',
  disetujui: 'Disetujui',
}

export default function AdminFacilitiesContent({
  initialFacilities,
  initialError,
}: Props) {
  const [facilities, setFacilities] = useState(initialFacilities)
  const [readError, setReadError] = useState(initialError)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')

  const [selectedFacility, setSelectedFacility] =
    useState<Facility | null>(null)

  const [reservations, setReservations] =
    useState<PendingReservationInfo[]>([])

  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')

  const submittingRef = useRef(false)
  const readingRef = useRef(false)
  const requestRef = useRef(0)
  const modalRef = useRef<HTMLDivElement>(null)

  const busy = saving || refreshing

  // Pencarian fasilitas berdasarkan ID, nama, tipe,
  // lokasi, kapasitas, dan status.
  const filteredFacilities = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLocaleLowerCase('id-ID')

    if (!query) {
      return facilities
    }

    return facilities.filter((facility) => {
      const status = String(facility.status ?? '')
        .toLocaleLowerCase('id-ID')
        .replace(/[_-]+/g, ' ')

      let statusAliases = status

      if (
        ['nonaktif', 'inactive', 'tidak aktif'].includes(status)
      ) {
        statusAliases = 'nonaktif tidak aktif inactive'
      } else if (
        [
          'dalam perbaikan',
          'under maintenance',
        ].includes(status)
      ) {
        statusAliases =
          'dalam perbaikan perbaikan under maintenance'
      } else if (['aktif', 'active'].includes(status)) {
        statusAliases = 'aktif active tersedia'
      }

      const searchableText = [
        facility.id,
        facility.name,
        facility.type,
        facility.location,
        facility.capacity,
        status,
        statusAliases,
      ]
        .map((value) => String(value ?? ''))
        .join(' ')
        .toLocaleLowerCase('id-ID')

      return searchableText.includes(query)
    })
  }, [facilities, searchQuery])

  useEffect(() => {
    return () => {
      requestRef.current += 1
    }
  }, [])

  const closeModal = useCallback(() => {
    if (submittingRef.current) return

    requestRef.current += 1
    setSelectedFacility(null)
    setReservations([])
    setCheckError('')
    setChecking(false)
  }, [])

  // Mengatur fokus keyboard saat modal dibuka.
  useEffect(() => {
    if (!selectedFacility) return

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const modal = modalRef.current

    modal
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
        return
      }

      if (event.key !== 'Tab' || !modal) return

      const focusable = [
        ...modal.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], [tabindex="0"]'
        ),
      ].filter((element) => element.offsetParent !== null)

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (!first) {
        event.preventDefault()
        return
      }

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previousFocus?.isConnected) {
        previousFocus.focus()
      }
    }
  }, [selectedFacility, closeModal])

  // Memuat ulang daftar fasilitas.
  async function refreshFacilities() {
    if (readingRef.current) return

    readingRef.current = true
    setRefreshing(true)

    try {
      const result = await getAllFacilitiesAdmin()

      setFacilities(result)
      setReadError('')
    } catch {
      setReadError(
        'Data fasilitas gagal dimuat. Klik Muat ulang untuk mencoba lagi. Data yang masih tampil adalah hasil pemuatan sebelumnya.'
      )
    } finally {
      readingRef.current = false
      setRefreshing(false)
    }
  }

  // Memeriksa reservasi sebelum fasilitas dinonaktifkan.
  async function checkReservations(facility: Facility) {
    const request = ++requestRef.current

    setReservations([])
    setCheckError('')
    setChecking(true)

    try {
      const result =
        await getUpcomingReservationsForFacility(facility.id)

      if (request === requestRef.current) {
        setReservations(result)
      }
    } catch {
      if (request === requestRef.current) {
        setCheckError(
          'Pemeriksaan reservasi gagal. Klik Periksa lagi untuk mencoba kembali.'
        )
      }
    } finally {
      if (request === requestRef.current) {
        setChecking(false)
      }
    }
  }

  function initiateDeactivate(facility: Facility) {
    if (busy || submittingRef.current || readError) return

    setActionError('')
    setMessage('')
    setSelectedFacility(facility)

    void checkReservations(facility)
  }

  // Mengubah status fasilitas.
  async function changeStatus(
    facility: Facility,
    status: 'aktif' | 'nonaktif'
  ) {
    if (busy || submittingRef.current || readError) return

    if (
      status === 'nonaktif' &&
      (checking || checkError || reservations.length)
    ) {
      return
    }

    submittingRef.current = true
    setSaving(true)
    setActionError('')
    setMessage('')

    try {
      const result = await setFacilityStatusAction(
        facility.id,
        status,
        facility.updated_at ?? null
      )

      if (!result.success) {
        if (status === 'nonaktif') {
          setCheckError(
            result.error ?? 'Gagal menonaktifkan fasilitas.'
          )
        } else {
          setActionError(
            result.error ?? 'Gagal mengaktifkan fasilitas.'
          )
        }

        if (result.needsReload) {
          setSelectedFacility(null)

          setActionError(
            result.error ??
              'Data fasilitas berubah. Muat ulang daftar.'
          )

          await refreshFacilities()
        }

        return
      }

      setSelectedFacility(null)
      requestRef.current += 1

      setMessage(
        `Fasilitas "${facility.name}" berhasil ${
          status === 'aktif'
            ? 'diaktifkan'
            : 'dinonaktifkan'
        }.`
      )

      await refreshFacilities()
    } catch {
      setSelectedFacility(null)

      setActionError(
        'Hasil perubahan belum dapat dipastikan. Daftar dimuat ulang agar status terbaru dapat diperiksa.'
      )

      await refreshFacilities()
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  // Badge status fasilitas.
  function badge(facility: Facility) {
    if (
      ['nonaktif', 'inactive'].includes(facility.status)
    ) {
      return (
        <span className={styles.badgeInactive}>
          NONAKTIF
        </span>
      )
    }

    if (
      [
        'dalam_perbaikan',
        'under_maintenance',
      ].includes(facility.status)
    ) {
      return (
        <span className={styles.badgeMaintenance}>
          DALAM PERBAIKAN
        </span>
      )
    }

    if (['aktif', 'active'].includes(facility.status)) {
      return (
        <span className={styles.badgeActive}>
          AKTIF
        </span>
      )
    }

    return (
      <span className={extra.neutralBadge}>
        STATUS TIDAK DIKENALI
      </span>
    )
  }

  return (
    <main className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            MANAJEMEN DATA MASTER
          </p>

          <h1 className={styles.title}>
            Kelola Fasilitas Kampus
          </h1>

          <p className={styles.subtitle}>
            Tambah, ubah, atau nonaktifkan fasilitas.
            Pengaturan fasilitas memengaruhi akses pemesanan.
          </p>
        </div>

        <Link
          href="/admin/fasilitas/tambah"
          className={styles.createButton}
        >
          + Tambah Fasilitas Baru
        </Link>
      </header>

      {/* SEARCH BAR DAN TOMBOL MUAT ULANG */}
      <div className={extra.facilitySearchTools}>
        <div className={extra.facilitySearchBox}>
          <Search
            size={18}
            strokeWidth={1.8}
            className={extra.facilitySearchIcon}
            aria-hidden="true"
          />

          <input
            type="search"
            aria-label="Cari fasilitas"
            placeholder="Cari nama, lokasi, tipe, ID, atau status..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            className={extra.facilitySearchInput}
            autoComplete="off"
          />

          {searchQuery.length > 0 && (
            <button
              type="button"
              className={extra.facilitySearchClearButton}
              aria-label="Hapus pencarian"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <span
          className={extra.facilitySearchResultCount}
          aria-live="polite"
        >
          {searchQuery.trim()
            ? `${filteredFacilities.length} dari ${facilities.length} fasilitas`
            : `${facilities.length} fasilitas`}
        </span>
      </div>

      {/* PESAN ERROR DAN SUKSES */}
      {readError && (
        <p className={extra.error} role="alert">
          {readError}
        </p>
      )}

      {actionError && (
        <p className={extra.error} role="alert">
          {actionError}
        </p>
      )}

      {message && (
        <p className={extra.success} role="status">
          {message}
        </p>
      )}

      {/* TABEL FASILITAS */}
      {facilities.length === 0 ? (
        !readError && (
          <div className={styles.emptyState}>
            Belum ada data fasilitas. Silakan tambah fasilitas baru.
          </div>
        )
      ) : filteredFacilities.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            Tidak ditemukan fasilitas yang cocok dengan
            pencarian &quot;{searchQuery}&quot;.
          </p>

          <button
            type="button"
            className={extra.secondaryButton}
            onClick={() => setSearchQuery('')}
          >
            Hapus pencarian
          </button>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Fasilitas</th>
                  <th>Tipe</th>
                  <th>Lokasi</th>
                  <th>Kapasitas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredFacilities.map((facility) => {
                  const inactive = [
                    'nonaktif',
                    'inactive',
                  ].includes(facility.status)

                  const knownStatus = [
                    'aktif',
                    'active',
                    'nonaktif',
                    'inactive',
                    'dalam_perbaikan',
                    'under_maintenance',
                  ].includes(facility.status)

                  return (
                    <tr key={facility.id}>
                      <td>#{facility.id}</td>

                      <td className={styles.facilityName}>
                        {facility.name}
                      </td>

                      <td>{facility.type || '-'}</td>

                      <td>{facility.location || '-'}</td>

                      <td>
                        {facility.capacity == null
                          ? '-'
                          : `${facility.capacity} Orang`}
                      </td>

                      <td>{badge(facility)}</td>

                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/admin/fasilitas/${facility.id}/edit`}
                            className={styles.editButton}
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            disabled={
                              busy ||
                              !!readError ||
                              !!selectedFacility ||
                              !knownStatus
                            }
                            className={
                              inactive
                                ? styles.activateButton
                                : styles.toggleButton
                            }
                            onClick={() =>
                              inactive
                                ? void changeStatus(
                                    facility,
                                    'aktif'
                                  )
                                : initiateDeactivate(facility)
                            }
                          >
                            {inactive
                              ? 'Aktifkan'
                              : 'Nonaktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NONAKTIFKAN FASILITAS */}
      {selectedFacility && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
        >
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-modal-title"
          >
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.eyebrow}>
                  KONFIRMASI TINDAKAN
                </p>

                <h2 id="deactivate-modal-title">
                  Nonaktifkan Fasilitas
                </h2>

                <p>
                  Fasilitas:{' '}
                  <strong>{selectedFacility.name}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className={styles.closeModalButton}
                aria-label="Tutup modal"
                disabled={saving}
              >
                ×
              </button>
            </header>

            <div className={extra.modalContent}>
              {checking ? (
                <p
                  className={styles.loadingState}
                  role="status"
                >
                  Memeriksa reservasi yang belum berakhir...
                </p>
              ) : checkError ? (
                <div>
                  <p className={extra.error} role="alert">
                    {checkError}
                  </p>

                  <button
                    type="button"
                    className={extra.secondaryButton}
                    disabled={saving}
                    onClick={() =>
                      void checkReservations(selectedFacility)
                    }
                  >
                    Periksa lagi
                  </button>
                </div>
              ) : reservations.length ? (
                <div>
                  <p className={styles.warningBox}>
                    Fasilitas ini masih memiliki{' '}
                    {reservations.length} reservasi menunggu
                    atau disetujui yang belum berakhir.
                  </p>

                  <div className={styles.reservationList}>
                    {reservations.map((reservation) => (
                      <article
                        key={reservation.id}
                        className={styles.reservationItem}
                      >
                        <div>
                          <strong>Pemesan:</strong>{' '}
                          {reservation.user_name}
                        </div>

                        <div>
                          <strong>Tanggal:</strong>{' '}
                          {new Intl.DateTimeFormat('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            timeZone: 'Asia/Jakarta',
                          }).format(
                            new Date(
                              `${reservation.reservation_date}T00:00:00+07:00`
                            )
                          )}
                        </div>

                        <div>
                          <strong>Waktu:</strong>{' '}
                          {reservation.start_time.slice(0, 5)}
                          –
                          {reservation.end_time.slice(0, 5)} WIB
                        </div>

                        <div>
                          <strong>Status:</strong>{' '}
                          {statusLabels[reservation.status] ??
                            reservation.status}
                        </div>
                      </article>
                    ))}
                  </div>

                  <p className={extra.pendingHint}>
                    Petugas perlu menolak pengajuan menunggu
                    atau membatalkan reservasi disetujui yang
                    terdampak terlebih dahulu. Penanganan ini
                    disertai alasan; admin tidak memproses
                    reservasi dari halaman ini.
                  </p>
                </div>
              ) : (
                <p className={styles.modalDescription}>
                  Tidak ada reservasi menunggu atau disetujui
                  yang belum berakhir. Fasilitas akan ditarik
                  dari pemesanan publik; riwayatnya tetap tersimpan.
                </p>
              )}

              {[
                'dalam_perbaikan',
                'under_maintenance',
              ].includes(selectedFacility.status) && (
                <p className={extra.pendingHint}>
                  Kegiatan perbaikan petugas tetap berjalan.
                  Setelah perbaikan selesai, fasilitas tetap
                  Nonaktif sampai admin mengaktifkannya kembali.
                </p>
              )}
            </div>

            <footer className={styles.modalActions}>
              <button
                type="button"
                onClick={closeModal}
                className={styles.cancelModalButton}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="button"
                className={styles.confirmDeactivateButton}
                disabled={
                  saving ||
                  checking ||
                  !!checkError ||
                  reservations.length > 0
                }
                onClick={() =>
                  void changeStatus(
                    selectedFacility,
                    'nonaktif'
                  )
                }
              >
                {saving ? 'Menyimpan...' : 'Ya, Nonaktifkan'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  )
}