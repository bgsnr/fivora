'use server'

import { getCurrentUser } from '@/lib/auth'
import { canCreateReservation } from '@/lib/reservation-access'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getActiveFacilities as getActiveFacilitiesFromService,
  submitReservation,
  cancelReservationForUser,
  approveReservation,
  rejectReservation,
  emergencyCancelByStaff,
  sweepExpiredPendingReservations,
  type FacilityOption as FacilityOptionFromService,
  type CreateReservationState as CreateReservationStateFromService,
  type CreateReservationParams as CreateReservationParamsFromService,
} from '@/lib/reservation-service'
import type { Reservation } from '@/types/reservation'
import { getReservationById as getReservationByIdRecord } from '@/lib/reservation-repository'

/**
 * Chapter 3 — Data Access Layer (Server Actions Reservasi)
 */


export async function getReservationById(
  id: string | number
): Promise<Reservation | null> {
  const user = await getCurrentUser()

  // Hanya akun aktif yang boleh mengakses detail.
  if (!user || user.status !== 'aktif') {
    return null
  }

  const reservation = await getReservationByIdRecord(id)

  if (!reservation) {
    return null
  }

  const isOwner =
    String(user.id) === String(reservation.user_id)

  // Petugas aktif boleh melihat detail untuk pemrosesan.
  const isActiveStaff = user.role === 'petugas'

  if (!isOwner && !isActiveStaff) {
    return null
  }

  return reservation
}

export async function getPendingReservationsQueue(): Promise<Reservation[]> {
  const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
      return []
    }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('status', 'menunggu')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Gagal mengambil antrean reservasi: ${error.message}`)
  }
  return (data as Reservation[]) || []
}


export async function getApprovedReservationsQueue(): Promise<Reservation[]> {
  const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
      return []
    }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('status', 'disetujui')
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(
      `Gagal mengambil reservasi yang disetujui: ${error.message}`
    )
  }

  return (data as Reservation[]) || []
}

// Identitas (userId/staffId) TIDAK pernah diterima dari client.
// Seluruh Server Action menurunkannya dari sesi via getCurrentUser().
// Logika bisnis ada di lib/reservation-service.ts (bukan server action),
// sehingga tidak ada jalur jaringan yang bisa memalsukan identitas.

export type FacilityOption = FacilityOptionFromService
export type CreateReservationState = CreateReservationStateFromService
export type CreateReservationParams = CreateReservationParamsFromService

export async function getActiveFacilities(): Promise<FacilityOption[]> {
  return getActiveFacilitiesFromService()
}

/**
 * Server Action: Batalkan Reservasi oleh Pengguna (Chapter 8)
 * Identitas diambil dari sesi, bukan dari parameter client.
 */
export async function cancelReservationByUserAction(
  reservationId: number,
  reason?: string
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'Harap masuk (login) terlebih dahulu untuk membatalkan reservasi',
      }
    }

    if (user.status !== 'aktif' || user.role !== 'pengguna') {
      return {
        success: false,
        error: 'Hanya pengguna aktif yang dapat membatalkan reservasi sendiri',
      }
    }

    return await cancelReservationForUser(reservationId, reason, Number(user.id))
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal membatalkan reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Server Action: Sweep Reservasi Kedaluwarsa (Aturan 9)
 *
 * Pengajuan 'menunggu' yang waktu mulainya sudah lewat otomatis ditolak dengan
 * alasan "waktu mulai reservasi telah terlewati". Dipanggil saat memuat antrean
 * petugas dan riwayat pengguna. Tidak memerlukan parameter — tidak mengubah
 * data di luar status 'menunggu' yang sudah kedaluwarsa.
 */
export async function sweepExpiredPendingReservationsAction(): Promise<{
  success: boolean
  error?: string
  sweptCount: number
}> {
  const user = await getCurrentUser()

  if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
    return {
      success: false,
      error: 'Hanya petugas aktif yang dapat menjalankan proses ini',
      sweptCount: 0,
    }
  }

  try {
    const result = await sweepExpiredPendingReservations()
    return {
      success: result.success,
      error: result.error,
      sweptCount: result.sweptCount,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menjalankan sweep reservasi kedaluwarsa: ${errorMsg}`,
      sweptCount: 0,
    }
  }
}

/**
 * Server Action: Menyetujui Reservasi oleh Petugas (Chapter 10)
 * Role & identitas diambil dari sesi.
 */
export async function approveReservationAction(
  reservationId: number
): Promise<{
    success: boolean
    error?: string
    warning?: string
    autoRejected?: boolean
    autoRejectedCount?: number
    data?: Reservation
}> {
  try {
    const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang untuk menyetujui reservasi',
      }
    }

    return await approveReservation(reservationId, Number(user.id))
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menyetujui reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Server Action: Menolak Reservasi oleh Petugas (Chapter 10)
 * Role & identitas diambil dari sesi.
 */
export async function rejectReservationAction(
  reservationId: number,
  reason: string
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang untuk menolak reservasi',
      }
    }

    return await rejectReservation(reservationId, reason, Number(user.id))
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menolak reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Server Action: Pembatalan Darurat oleh Petugas (Chapter 11)
 */
export async function cancelReservationByStaffAction(
  reservationId: number,
  reason: string
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
  try {
    const user = await getCurrentUser()
    if (!user || user.status !== 'aktif' || user.role !== 'petugas') {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang membatalkan reservasi secara darurat',
      }
    }

    return await emergencyCancelByStaff(reservationId, Number(user.id), reason)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal melakukan pembatalan darurat: ${errorMsg}`,
    }
  }
}

/**
 * Server Action: Mengajukan Reservasi Baru (Chapter 6)
 */
export async function createReservationAction(
  params: CreateReservationParams
): Promise<CreateReservationState> {
  try {
    const currentUser = await getCurrentUser()

    // Pastikan pengguna sudah login.
    if (!currentUser) {
      return {
        success: false,
        error:
          'Harap masuk (login) terlebih dahulu untuk mengajukan reservasi.',
      }
    }

    // Hanya role pengguna yang boleh mengajukan reservasi.
    if (currentUser.role !== 'pengguna') {
      return {
        success: false,
        error: 'Hanya pengguna yang dapat mengajukan reservasi.',
      }
    }

    if (!canCreateReservation(currentUser)) {
      return {
        success: false,
        error: 'Akun kamu belum aktif sehingga belum bisa mengajukan reservasi.',
      }
    }

    // Identitas pengguna berasal dari sesi, bukan input dari browser.
    return await submitReservation(params, Number(currentUser.id))
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Terjadi kesalahan saat memproses reservasi: ${errorMsg}`,
    }
  }
}