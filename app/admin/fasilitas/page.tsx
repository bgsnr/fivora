'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'

import {
  Facility,
  FacilityStatus,
} from '@/types/facility'

import styles from './adminFasilitas.module.css'

interface PendingReservation {
  id: number
  user_name: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
}

const supabase = createClient()

function getTodayLocal() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getCurrentTimeLocal() {
  const now = new Date()

  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  /* State Modal Penonaktifan */
  const [selectedFacility, setSelectedFacility] =
    useState<Facility | null>(null)

  const [pendingReservations, setPendingReservations] =
    useState<PendingReservation[]>([])

  const [isModalOpen, setIsModalOpen] =
    useState<boolean>(false)

  const [checkingReservations, setCheckingReservations] =
    useState<boolean>(false)

  const [reservationCheckError, setReservationCheckError] =
    useState<string>('')

  /* Fetch Semua Fasilitas */
  const fetchFacilities = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error(
        'Error fetching facilities:',
        error
      )
    } else {
      setFacilities(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchFacilities()
  }, [])

  /* Handle Klik Menonaktifkan Fasilitas */
  const handleInitiateDeactivate = async (
    facility: Facility
  ) => {
    setSelectedFacility(facility)
    setPendingReservations([])
    setReservationCheckError('')
    setCheckingReservations(true)
    setIsModalOpen(true)

    const today = getTodayLocal()
    const currentTime = getCurrentTimeLocal()

    /*
     * Ambil semua reservasi mulai hari ini ke depan.
     *
     * reservation_date = DATE
     * start_time       = TIME
     * end_time         = TIME
     */
    const { data, error } = await supabase
      .from('reservations')
      .select(
        'id, user_name, reservation_date, start_time, end_time, status'
      )
      .eq('facility_id', facility.id)
      .in('status', [
        'menunggu',
        'pending',
        'disetujui',
        'approved',
      ])
      .gte('reservation_date', today)
      .order('reservation_date', {
        ascending: true,
      })
      .order('start_time', {
        ascending: true,
      })

    if (error) {
      console.error(
        'Error checking reservations:',
        error
      )

      setReservationCheckError(
        'Gagal memeriksa reservasi mendatang. Silakan coba lagi.'
      )
    } else {
      /*
       * Untuk reservasi hari ini:
       * hanya anggap masih mendatang bila end_time
       * belum lewat waktu sekarang.
       *
       * Untuk tanggal setelah hari ini:
       * semuanya masih mendatang.
       */
      const futureReservations = (data || []).filter(
        (reservation) => {
          if (
            reservation.reservation_date > today
          ) {
            return true
          }

          return reservation.end_time >= currentTime
        }
      )

      setPendingReservations(
        futureReservations
      )
    }

    setCheckingReservations(false)
  }

  /* Konfirmasi Eksekusi Menonaktifkan */
  const confirmDeactivate = async () => {
    if (!selectedFacility) {
      return
    }

    if (
      checkingReservations ||
      reservationCheckError ||
      pendingReservations.length > 0
    ) {
      return
    }

    const { error } = await supabase
      .from('facilities')
      .update({
        status: 'nonaktif',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedFacility.id)

    if (error) {
      alert(
        'Gagal menonaktifkan fasilitas: ' +
          error.message
      )
      return
    }

    setIsModalOpen(false)
    setSelectedFacility(null)
    setPendingReservations([])
    setReservationCheckError('')

    fetchFacilities()
  }

  /* Handle Mengaktifkan Kembali Fasilitas */
  const handleActivate = async (id: number) => {
    const { error } = await supabase
      .from('facilities')
      .update({
        status: 'aktif',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert(
        'Gagal mengaktifkan fasilitas: ' +
          error.message
      )
      return
    }

    fetchFacilities()
  }

  /* Tutup Modal */
  const closeModal = () => {
    if (checkingReservations) {
      return
    }

    setIsModalOpen(false)
    setSelectedFacility(null)
    setPendingReservations([])
    setReservationCheckError('')
  }

  /* Render Helper Badge Status */
  const renderBadge = (
    status: FacilityStatus
  ) => {
    if (
      status === 'nonaktif' ||
      status === 'inactive'
    ) {
      return (
        <span
          className={styles.badgeInactive}
        >
          NONAKTIF
        </span>
      )
    }

    if (
      status === 'dalam_perbaikan' ||
      status === 'under_maintenance'
    ) {
      return (
        <span
          className={styles.badgeMaintenance}
        >
          DALAM PERBAIKAN
        </span>
      )
    }

    return (
      <span className={styles.badgeActive}>
        AKTIF
      </span>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            MANAJEMEN DATA MASTER
          </p>

          <h1 className={styles.title}>
            Kelola Fasilitas Kampus
          </h1>

          <p className={styles.subtitle}>
            Tambah, ubah, atau nonaktifkan fasilitas.
            Pengaturan fasilitas memengaruhi akses
            pemesanan.
          </p>
        </div>

        <Link
          href="/admin/fasilitas/tambah"
          className={styles.createButton}
        >
          + Tambah Fasilitas Baru
        </Link>
      </div>

      {/* State Loading */}
      {loading ? (
        <div className={styles.loadingState}>
          Memuat data fasilitas...
        </div>
      ) : facilities.length === 0 ? (
        <div className={styles.emptyState}>
          Belum ada data fasilitas. Silakan tambah
          fasilitas baru.
        </div>
      ) : (
        /* Tabel Fasilitas */
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
                {facilities.map((facility) => {
                  const isInactive =
                    facility.status ===
                      'nonaktif' ||
                    facility.status ===
                      'inactive'

                  const isMaintenance =
                    facility.status ===
                      'dalam_perbaikan' ||
                    facility.status ===
                      'under_maintenance'

                  return (
                    <tr key={facility.id}>
                      <td>
                        #{facility.id}
                      </td>

                      <td
                        className={
                          styles.facilityName
                        }
                      >
                        {facility.name}
                      </td>

                      <td>
                        {facility.type || '-'}
                      </td>

                      <td>
                        {facility.location || '-'}
                      </td>

                      <td>
                        {facility.capacity
                          ? `${facility.capacity} Orang`
                          : '-'}
                      </td>

                      <td>
                        {renderBadge(
                          facility.status
                        )}
                      </td>

                      <td>
                        <div
                          className={
                            styles.actions
                          }
                        >
                          <Link
                            href={`/admin/fasilitas/${facility.id}/edit`}
                            className={
                              styles.editButton
                            }
                          >
                            Edit
                          </Link>

                          {isInactive ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleActivate(
                                  facility.id
                                )
                              }
                              className={
                                styles.activateButton
                              }
                            >
                              Aktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleInitiateDeactivate(
                                  facility
                                )
                              }
                              disabled={
                                isMaintenance
                              }
                              className={
                                styles.toggleButton
                              }
                              title={
                                isMaintenance
                                  ? 'Fasilitas dalam perbaikan'
                                  : 'Nonaktifkan fasilitas'
                              }
                            >
                              Nonaktifkan
                            </button>
                          )}
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

      {/* Modal Konfirmasi Menonaktifkan */}
      {isModalOpen &&
        selectedFacility && (
          <div
            className={
              styles.modalBackdrop
            }
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal()
              }
            }}
          >
            <div className={styles.modal}>
              {/* Header Modal */}
              <div
                className={
                  styles.modalHeader
                }
              >
                <div>
                  <p
                    className={
                      styles.eyebrow
                    }
                  >
                    KONFIRMASI TINDAKAN
                  </p>

                  <h2>
                    Nonaktifkan Fasilitas
                  </h2>

                  <p>
                    Fasilitas:{' '}
                    <strong>
                      {
                        selectedFacility.name
                      }
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className={
                    styles.closeModalButton
                  }
                  disabled={
                    checkingReservations
                  }
                >
                  ×
                </button>
              </div>

              {/* Isi Modal */}
              {checkingReservations ? (
                <div
                  className={
                    styles.loadingState
                  }
                >
                  Memeriksa reservasi
                  mendatang...
                </div>
              ) : reservationCheckError ? (
                <div
                  className={
                    styles.errorBox
                  }
                >
                  {reservationCheckError}
                </div>
              ) : pendingReservations.length >
                0 ? (
                <div>
                  {/* Warning */}
                  <div
                    className={
                      styles.warningBox
                    }
                  >
                    <strong>
                      Perhatian:
                    </strong>{' '}
                    Fasilitas ini masih memiliki{' '}
                    {
                      pendingReservations.length
                    }{' '}
                    reservasi mendatang yang
                    belum diselesaikan oleh
                    petugas.
                  </div>

                  {/* Reservation List */}
                  <div
                    className={
                      styles.reservationList
                    }
                  >
                    {pendingReservations.map(
                      (reservation) => (
                        <div
                          key={
                            reservation.id
                          }
                          className={
                            styles.reservationItem
                          }
                        >
                          <div>
                            <strong>
                              Pemesan:
                            </strong>{' '}
                            {
                              reservation.user_name
                            }
                          </div>

                          <div>
                            <strong>
                              Tanggal:
                            </strong>{' '}
                            {new Intl.DateTimeFormat(
                              'id-ID',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            ).format(
                              new Date(
                                `${reservation.reservation_date}T00:00:00`
                              )
                            )}
                          </div>

                          <div>
                            <strong>
                              Waktu:
                            </strong>{' '}
                            {reservation.start_time.slice(
                              0,
                              5
                            )}{' '}
                            -{' '}
                            {reservation.end_time.slice(
                              0,
                              5
                            )} WIB
                          </div>

                          <div>
                            <strong>
                              Status:
                            </strong>{' '}
                            {reservation.status}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <p
                    className={
                      styles.modalHint
                    }
                  >
                    Petugas harus memproses atau
                    membatalkan reservasi ini
                    terlebih dahulu sebelum
                    fasilitas dapat dinonaktifkan.
                  </p>
                </div>
              ) : (
                <p
                  className={
                    styles.modalDescription
                  }
                >
                  Tidak ada reservasi mendatang
                  yang masih aktif. Apakah Anda
                  yakin ingin menonaktifkan
                  fasilitas ini?
                  <br />
                  <br />
                  Fasilitas yang nonaktif tidak
                  akan muncul pada pemesanan publik.
                </p>
              )}

              {/* Modal Actions */}
              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className={
                    styles.cancelModalButton
                  }
                  disabled={
                    checkingReservations
                  }
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={
                    confirmDeactivate
                  }
                  disabled={
                    checkingReservations ||
                    reservationCheckError !==
                      '' ||
                    pendingReservations.length >
                      0
                  }
                  className={
                    styles.confirmDeactivateButton
                  }
                >
                  {checkingReservations
                    ? 'Memeriksa...'
                    : 'Ya, Nonaktifkan'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}