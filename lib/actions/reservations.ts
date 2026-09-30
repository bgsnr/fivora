'use server'

import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getActiveFacilities as getActiveFacilitiesFromService,
  submitReservation,
  cancelReservationForUser,
  approveReservation,
  rejectReservation,
  emergencyCancelByStaff,
  type FacilityOption as FacilityOptionFromService,
  type CreateReservationState as CreateReservationStateFromService,
  type CreateReservationParams as CreateReservationParamsFromService,
} from '@/lib/reservation-service'
import type {
  Reservation,
  NewReservationInput,
  ReservationStatus,
  UpdateReservationStatusMeta,
} from '@/types/reservation'

/**
 * Chapter 3 — Data Access Layer (Server Actions Reservasi)
 * 8 Fungsi Wajib Disediakan
 */

export async function createReservation(data: NewReservationInput): Promise<Reservation> {
  const insertData = {
    user_id: data.user_id,
    facility_id: data.facility_id,
    reservation_date: data.reservation_date,
    start_time: data.start_time,
    end_time: data.end_time,
    purpose: data.purpose,
    status: data.status || 'menunggu',
  }

  const { data: result, error } = await supabaseAdmin
    .from('reservations')
    .insert(insertData)
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .single()

  if (error) {
    throw new Error(`Gagal membuat reservasi: ${error.message}`)
  }
  return result as Reservation
}

export async function getReservationById(id: string | number): Promise<Reservation | null> {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Gagal mengambil data reservasi: ${error.message}`)
  }
  return (data as Reservation) || null
}

export async function getReservationsByUser(userId: string | number): Promise<Reservation[]> {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('user_id', userId)
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) {
    throw new Error(`Gagal mengambil riwayat reservasi pengguna: ${error.message}`)
  }
  return (data as Reservation[]) || []
}

export async function getReservationsByFacilityAndDate(
  facilityId: string | number,
  date: string
): Promise<Reservation[]> {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('facility_id', facilityId)
    .eq('reservation_date', date)
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Gagal mengambil reservasi fasilitas: ${error.message}`)
  }
  return (data as Reservation[]) || []
}

export async function getPendingReservationsQueue(): Promise<Reservation[]> {
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

export const getPendingReservationsQueueSortedByCreatedAt = getPendingReservationsQueue

export async function updateReservationStatus(
  id: string | number,
  status: ReservationStatus,
  meta?: UpdateReservationStatusMeta
): Promise<Reservation> {
  const updatePayload: Record<string, unknown> = {
    status,
  }
  if (meta?.rejection_reason !== undefined) {
    updatePayload.rejection_reason = meta.rejection_reason
  }
  if (meta?.processed_by !== undefined) {
    updatePayload.processed_by = meta.processed_by
  }
  if (meta?.processed_at !== undefined) {
    updatePayload.processed_at = meta.processed_at
  } else if (status !== 'menunggu') {
    updatePayload.processed_at = new Date().toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .update(updatePayload)
    .eq('id', id)
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .single()

  if (error) {
    throw new Error(`Gagal memperbarui status reservasi: ${error.message}`)
  }
  return data as Reservation
}

export async function getOverlappingReservations(
  facilityId: string | number,
  date: string,
  startTime: string,
  endTime: string,
  statusFilter?: ReservationStatus | ReservationStatus[]
): Promise<Reservation[]> {
  let query = supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('facility_id', facilityId)
    .eq('reservation_date', date)
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  if (statusFilter) {
    if (Array.isArray(statusFilter)) {
      query = query.in('status', statusFilter)
    } else {
      query = query.eq('status', statusFilter)
    }
  }

  const { data, error } = await query.order('start_time', { ascending: true })
  if (error) {
    throw new Error(`Gagal memeriksa reservasi tumpang tindih: ${error.message}`)
  }
  return (data as Reservation[]) || []
}

export async function getUserReservationsOverlapping(
  userId: string | number,
  date: string,
  startTime: string,
  endTime: string
): Promise<Reservation[]> {
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .eq('user_id', userId)
    .eq('reservation_date', date)
    .in('status', ['menunggu', 'disetujui'])
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Gagal memeriksa tumpang tindih reservasi pengguna: ${error.message}`)
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
 * Server Action: Menyetujui Reservasi oleh Petugas (Chapter 10)
 * Role & identitas diambil dari sesi.
 */
export async function approveReservationAction(
  reservationId: number
): Promise<{
  success: boolean
  error?: string
  autoRejected?: boolean
  autoRejectedCount?: number
  data?: Reservation
}> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'petugas') {
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
    if (!user || user.role !== 'petugas') {
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
    if (!user || user.role !== 'petugas') {
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
    if (!currentUser) {
      return {
        success: false,
        error: 'Harap masuk (login) terlebih dahulu untuk mengajukan reservasi',
      }
    }

    return await submitReservation(params, Number(currentUser.id))
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Terjadi kesalahan saat memproses reservasi: ${errorMsg}`,
    }
  }
}