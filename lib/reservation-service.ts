import 'server-only'

import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  validateReservationTimeRules,
  isReservationExpiredForApproval,
  canUserCancelReservation,
  getWIBDateTime,
} from '@/lib/validations/reservation-time'
import {
  checkFacilityConflict,
  checkUserDoubleBooking,
  isFacilityBookable,
  autoRejectConflictingPendingReservations,
} from '@/lib/conflict-engine'
import {
  createReservation,
  updateReservationStatus,
  getReservationById,
} from '@/lib/reservation-repository'
import { reservationInputSchema } from '@/lib/validations/reservations'
import type { Reservation } from '@/types/reservation'

/**
 * Reservation Service (Chapter 6, 8, 10, 11)
 *
 * Lapisan logika bisnis reservasi.
 * Modul ini hanya digunakan di server, bukan Client Component
 * atau sebagai Server Action yang langsung diekspos ke client.
 *
 * Identitas userId/staffId berasal dari pemanggil tepercaya,
 * yaitu Server Action yang memeriksa sesi dan hak akses pengguna.
 */

// ============================================================
// FASILITAS
// ============================================================

export interface FacilityOption {
  id: number
  name: string
  type: string
  location: string
  capacity: number
  status: string
  description?: string | null
}

export async function getActiveFacilities(): Promise<FacilityOption[]> {
  const { data, error } = await supabaseAdmin
    .from('facilities')
    .select('id, name, type, location, capacity, description, status')
    .order('name', { ascending: true })

  if (error || !data) {
    console.error('Gagal mengambil fasilitas:', error)
    return []
  }

  // Fasilitas nonaktif tidak ditampilkan.
  // Fasilitas dalam perbaikan tetap dapat ditampilkan sebagai informasi.
  return (data as FacilityOption[]).filter((facility) => {
    const status = String(facility.status ?? '')
      .toLowerCase()
      .trim()

    return !['nonaktif', 'inactive'].includes(status)
  })
}

// ============================================================
// TIPE HASIL
// ============================================================

export interface CreateReservationState {
  success: boolean
  error?: string
  data?: Reservation
}

export interface SweepExpiredResult {
  success: boolean
  error?: string
  sweptCount: number
  sweptIds: (string | number)[]
}

export interface CreateReservationParams {
  facility_id: number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
}

export interface ApproveReservationResult {
  success: boolean
  error?: string
  warning?: string
  autoRejected?: boolean
  autoRejectedCount?: number
  data?: Reservation
}

// ============================================================
// SWEEP RESERVASI KEDALUWARSA
// ============================================================

/**
 * Reservasi berstatus menunggu yang waktu mulainya sudah terlewati
 * otomatis ditolak.
 *
 * Reservasi yang sudah disetujui tidak diubah oleh proses ini.
 * Query pembaruan tetap memeriksa status menunggu untuk mencegah
 * perubahan terhadap reservasi yang sudah diproses.
 */
export async function sweepExpiredPendingReservations(): Promise<SweepExpiredResult> {
  try {
    const now = new Date()
    const wibNow = getWIBDateTime(now)

    const { data: expiredPending, error: fetchError } =
      await supabaseAdmin
        .from('reservations')
        .select('id, reservation_date, start_time')
        .eq('status', 'menunggu')
        .lte('reservation_date', wibNow.dateStr)

    if (fetchError) {
      return {
        success: false,
        error: `Gagal mencari reservasi kedaluwarsa: ${fetchError.message}`,
        sweptCount: 0,
        sweptIds: [],
      }
    }

    if (!expiredPending || expiredPending.length === 0) {
      return {
        success: true,
        sweptCount: 0,
        sweptIds: [],
      }
    }

    const targetIds = (
      expiredPending as Pick<
        Reservation,
        'id' | 'reservation_date' | 'start_time'
      >[]
    )
      .filter((row) => isReservationExpiredForApproval(row, now))
      .map((row) => row.id)

    if (targetIds.length === 0) {
      return {
        success: true,
        sweptCount: 0,
        sweptIds: [],
      }
    }

    const { data: rejected, error: updateError } =
      await supabaseAdmin
        .from('reservations')
        .update({
          status: 'ditolak',
          rejection_reason: 'waktu mulai reservasi telah terlewati',
          processed_at: now.toISOString(),
        })
        .in('id', targetIds)
        .eq('status', 'menunggu')
        .select('id')

    if (updateError) {
      return {
        success: false,
        error: `Gagal menandai reservasi kedaluwarsa: ${updateError.message}`,
        sweptCount: 0,
        sweptIds: [],
      }
    }

    const sweptIds = (
      (rejected as Pick<Reservation, 'id'>[] | null) ?? []
    ).map((row) => row.id)

    return {
      success: true,
      sweptCount: sweptIds.length,
      sweptIds,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Gagal menjalankan sweep reservasi kedaluwarsa: ${errorMsg}`,
      sweptCount: 0,
      sweptIds: [],
    }
  }
}

// ============================================================
// PENGAJUAN RESERVASI
// ============================================================

/**
 * Validasi pengajuan:
 * 1. Kelengkapan dan format input
 * 2. Status fasilitas
 * 3. Aturan waktu dan jam operasional
 * 4. Bentrok jadwal fasilitas
 * 5. Double-booking pengguna
 * 6. Simpan reservasi dengan status menunggu
 */
export async function submitReservation(
  params: CreateReservationParams,
  userId: number,
): Promise<CreateReservationState> {
  try {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return {
        success: false,
        error:
          'Harap masuk (login) terlebih dahulu untuk mengajukan reservasi.',
      }
    }

    // 1. Validasi input dengan Zod.
    const normalizedInput = {
      facilityId:
        params.facility_id !== undefined
          ? Number(params.facility_id)
          : '',
      reservationDate: params.reservation_date?.trim() || '',
      startTime: params.start_time?.trim() || '',
      endTime: params.end_time?.trim() || '',
      purpose: params.purpose?.trim() || '',
    }

    const zodResult =
      reservationInputSchema.safeParse(normalizedInput)

    if (!zodResult.success) {
      const firstIssue = zodResult.error.issues[0]

      return {
        success: false,
        error:
          firstIssue?.message ||
          'Data pengajuan reservasi tidak valid.',
      }
    }

    const facilityId = Number(normalizedInput.facilityId)
    const reservationDate = normalizedInput.reservationDate
    const startTime = normalizedInput.startTime
    const endTime = normalizedInput.endTime
    const purpose = normalizedInput.purpose

    // 2. Pastikan fasilitas tersedia untuk diajukan.
    const { data: facility, error: facilityError } =
      await supabaseAdmin
        .from('facilities')
        .select('id, name, status')
        .eq('id', facilityId)
        .maybeSingle()

    if (facilityError || !facility) {
      return {
        success: false,
        error: 'Fasilitas tidak ditemukan dalam sistem.',
      }
    }

    if (!isFacilityBookable(facility.status)) {
      const facilityStatus = String(facility.status ?? '')
        .toLowerCase()
        .trim()

      const isMaintenance = [
        'dalam_perbaikan',
        'under_maintenance',
        'maintenance',
      ].includes(facilityStatus)

      const statusText = isMaintenance
        ? 'sedang dalam perbaikan'
        : 'sedang dinonaktifkan'

      return {
        success: false,
        error: `Fasilitas "${facility.name}" ${statusText} dan tidak dapat direservasi.`,
      }
    }

    // 3. Validasi aturan tanggal dan waktu.
    const timeValidation = validateReservationTimeRules(
      reservationDate,
      startTime,
      endTime,
      new Date(),
    )

    if (!timeValidation.valid) {
      return {
        success: false,
        error:
          timeValidation.error ||
          'Waktu atau slot reservasi tidak valid.',
      }
    }

    // 4. Cek bentrok dengan reservasi fasilitas yang telah disetujui.
    const facilityConflicts = await checkFacilityConflict(
      facilityId,
      reservationDate,
      startTime,
      endTime,
    )

    if (facilityConflicts.length > 0) {
      return {
        success: false,
        error:
          'Jadwal fasilitas pada rentang waktu ini telah terisi oleh reservasi lain yang disetujui.',
      }
    }

    // 5. Cek bentrok reservasi pengguna pada fasilitas lain.
    const userConflicts = await checkUserDoubleBooking(
      userId,
      reservationDate,
      startTime,
      endTime,
    )

    if (userConflicts.length > 0) {
      return {
        success: false,
        error:
          'Anda sudah memiliki reservasi aktif (menunggu atau disetujui) pada waktu yang bertabrakan di fasilitas lain.',
      }
    }

    // 6. Simpan dengan identitas dari sesi dan status awal menunggu.
    const newReservation = await createReservation({
      user_id: userId,
      facility_id: facilityId,
      reservation_date: reservationDate,
      start_time:
        startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time:
        endTime.length === 5 ? `${endTime}:00` : endTime,
      purpose,
      status: 'menunggu',
    })

    return {
      success: true,
      data: newReservation,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Terjadi kesalahan saat memproses reservasi: ${errorMsg}`,
    }
  }
}

// ============================================================
// PEMBATALAN OLEH PENGGUNA
// ============================================================

export async function cancelReservationForUser(
  reservationId: number,
  reason: string | undefined,
  userId: number,
): Promise<{
  success: boolean
  error?: string
  data?: Reservation
}> {
  try {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return {
        success: false,
        error:
          'Harap masuk (login) terlebih dahulu untuk membatalkan reservasi.',
      }
    }

    const reservation = await getReservationById(reservationId)

    if (!reservation) {
      return {
        success: false,
        error: 'Data reservasi tidak ditemukan.',
      }
    }

    const cancelCheck = canUserCancelReservation(
      reservation,
      userId,
      new Date(),
    )

    if (!cancelCheck.allowed) {
      return {
        success: false,
        error:
          cancelCheck.reason || 'Pembatalan tidak diizinkan.',
      }
    }

    const cancelReason =
      reason?.trim() ||
      'Dibatalkan oleh pemesan melalui sistem'

    // Status harus tetap sama dengan status yang diperiksa sebelumnya.
    const updated = await updateReservationStatus(
      reservationId,
      'dibatalkan',
      {
        rejection_reason: cancelReason,
      },
      [reservation.status],
    )

    return {
      success: true,
      data: updated,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Gagal membatalkan reservasi: ${errorMsg}`,
    }
  }
}

// ============================================================
// PERSETUJUAN OLEH PETUGAS
// ============================================================

/**
 * Sebelum menyetujui:
 * 1. Pastikan reservasi masih menunggu
 * 2. Tolak otomatis jika waktu sudah terlewati
 * 3. Periksa status fasilitas
 * 4. Terapkan aturan FIFO pada pengajuan yang bertabrakan
 * 5. Periksa bentrok dengan reservasi disetujui
 * 6. Ubah status secara bersyarat
 * 7. Tolak otomatis pengajuan lain yang bentrok
 */
export async function approveReservation(
  reservationId: number,
  staffId: number,
): Promise<ApproveReservationResult> {
  try {
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      return {
        success: false,
        error:
          'Hanya petugas yang memiliki wewenang untuk menyetujui reservasi.',
      }
    }

    const reservation = await getReservationById(reservationId)

    if (!reservation) {
      return {
        success: false,
        error: 'Reservasi tidak ditemukan.',
      }
    }

    if (reservation.status !== 'menunggu') {
      return {
        success: false,
        error:
          `Hanya reservasi berstatus "menunggu" yang dapat disetujui ` +
          `(status saat ini: ${reservation.status}).`,
      }
    }

    const now = new Date()

    // 1. Tolak otomatis HANYA apabila waktu mulai sudah terlewati.
    if (isReservationExpiredForApproval(reservation, now)) {
      const rejectedExpired = await updateReservationStatus(
        reservationId,
        'ditolak',
        {
          rejection_reason:
            'waktu mulai reservasi telah terlewati',
          processed_by: staffId,
          processed_at: now.toISOString(),
        },
        ['menunggu'],
      )

      return {
        success: false,
        autoRejected: true,
        error:
          'Persetujuan dibatalkan: waktu mulai reservasi telah terlewati. Status otomatis diubah menjadi "ditolak".',
        data: rejectedExpired,
      }
    }

    // 2. Periksa ulang status fasilitas.
    const { data: facility, error: facilityError } =
      await supabaseAdmin
        .from('facilities')
        .select('id, name, status')
        .eq('id', reservation.facility_id)
        .maybeSingle()

    if (facilityError) {
      throw new Error(
        `Gagal memeriksa fasilitas: ${facilityError.message}`,
      )
    }

    if (!facility || !isFacilityBookable(facility.status)) {
      const rejectedRepair = await updateReservationStatus(
        reservationId,
        'ditolak',
        {
          rejection_reason: !facility
            ? 'fasilitas tidak ditemukan'
            : 'fasilitas dalam perbaikan atau tidak aktif',
          processed_by: staffId,
          processed_at: now.toISOString(),
        },
        ['menunggu'],
      )

      return {
        success: false,
        autoRejected: true,
        error: !facility
          ? 'Fasilitas tidak ditemukan. Pengajuan otomatis ditolak.'
          : 'Fasilitas sedang dalam perbaikan atau tidak aktif. Pengajuan otomatis ditolak.',
        data: rejectedRepair,
      }
    }

    // 3. FIFO: periksa apakah ada pengajuan lebih lama
    // pada fasilitas dan rentang waktu yang bertabrakan.
    const { data: overlappingPending, error: pendingQueryError } =
      await supabaseAdmin
        .from('reservations')
        .select('id, created_at')
        .eq('facility_id', reservation.facility_id)
        .eq('reservation_date', reservation.reservation_date)
        .eq('status', 'menunggu')
        .neq('id', reservation.id)
        .lt('start_time', reservation.end_time)
        .gt('end_time', reservation.start_time)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

    if (pendingQueryError) {
      throw new Error(
        `Gagal memeriksa prioritas antrean: ${pendingQueryError.message}`,
      )
    }

    const currentCreatedAt = new Date(
      reservation.created_at,
    ).getTime()

    const currentId = Number(reservation.id)

    const olderPending = (overlappingPending ?? []).find(
      (candidate) => {
        const candidateCreatedAt = new Date(
          candidate.created_at,
        ).getTime()

        return (
          candidateCreatedAt < currentCreatedAt ||
          (candidateCreatedAt === currentCreatedAt &&
            Number(candidate.id) < currentId)
        )
      },
    )

    if (olderPending) {
      return {
        success: false,
        error:
          `Reservasi belum dapat disetujui karena masih ada ` +
          `pengajuan lebih awal (#${olderPending.id}) yang ` +
          `waktunya bertabrakan. Proses pengajuan berdasarkan ` +
          `urutan waktu pengajuan.`,
      }
    }

    // 4. Periksa ulang bentrok dengan reservasi yang disetujui.
    const conflicts = await checkFacilityConflict(
      reservation.facility_id,
      reservation.reservation_date,
      reservation.start_time,
      reservation.end_time,
      reservation.id,
    )

    if (conflicts.length > 0) {
      return {
        success: false,
        error:
          'Persetujuan ditolak: jadwal fasilitas pada rentang waktu ini telah terisi oleh reservasi lain yang disetujui.',
      }
    }

    // 5. Status harus masih menunggu saat diubah.
    // Ini mencegah dua petugas memproses reservasi yang sama
    // lalu saling menimpa statusnya.
    const approved = await updateReservationStatus(
      reservationId,
      'disetujui',
      {
        processed_by: staffId,
        processed_at: now.toISOString(),
      },
      ['menunggu'],
    )

    // 6. Tolak otomatis pengajuan menunggu lain yang bertabrakan.
    let autoRejectedCount = 0
    let warning: string | undefined

    try {
      const autoRejectedList =
        await autoRejectConflictingPendingReservations({
          id: approved.id,
          facility_id: approved.facility_id,
          reservation_date: approved.reservation_date,
          start_time: approved.start_time,
          end_time: approved.end_time,
          processed_by: staffId,
        })

      autoRejectedCount = autoRejectedList.length
    } catch (err: unknown) {
      console.error(
        '[approveReservation] Persetujuan berhasil, tetapi auto-reject gagal:',
        err,
      )

      warning =
        'Reservasi berhasil disetujui, tetapi penolakan otomatis terhadap pengajuan lain yang bentrok gagal. Periksa antrean reservasi secara manual.'
    }

    return {
      success: true,
      data: approved,
      autoRejectedCount,
      ...(warning ? { warning } : {}),
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Gagal menyetujui reservasi: ${errorMsg}`,
    }
  }
}

// ============================================================
// PENOLAKAN OLEH PETUGAS
// ============================================================

export async function rejectReservation(
  reservationId: number,
  reason: string,
  staffId: number,
): Promise<{
  success: boolean
  error?: string
  data?: Reservation
}> {
  try {
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      return {
        success: false,
        error:
          'Hanya petugas yang memiliki wewenang untuk menolak reservasi.',
      }
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error:
          'Alasan penolakan reservasi wajib diisi oleh petugas.',
      }
    }

    const reservation = await getReservationById(reservationId)

    if (!reservation) {
      return {
        success: false,
        error: 'Reservasi tidak ditemukan.',
      }
    }

    if (reservation.status !== 'menunggu') {
      return {
        success: false,
        error:
          `Hanya reservasi berstatus "menunggu" yang dapat ditolak ` +
          `(status saat ini: ${reservation.status}).`,
      }
    }

    const updated = await updateReservationStatus(
      reservationId,
      'ditolak',
      {
        rejection_reason: reason.trim(),
        processed_by: staffId,
        processed_at: new Date().toISOString(),
      },
      ['menunggu'],
    )

    return {
      success: true,
      data: updated,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Gagal menolak reservasi: ${errorMsg}`,
    }
  }
}

// ============================================================
// PEMBATALAN DARURAT OLEH PETUGAS
// ============================================================

/**
 * Hanya reservasi yang disetujui yang dapat dibatalkan secara darurat.
 * Petugas wajib menyertakan alasan pembatalan.
 */
export async function emergencyCancelByStaff(
  reservationId: number,
  staffId: number,
  reason: string,
): Promise<{
  success: boolean
  error?: string
  data?: Reservation
}> {
  try {
    if (!Number.isSafeInteger(staffId) || staffId <= 0) {
      return {
        success: false,
        error:
          'Hanya petugas yang memiliki wewenang untuk membatalkan reservasi secara darurat.',
      }
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error:
          'Alasan pembatalan darurat wajib diisi oleh petugas.',
      }
    }

    const reservation = await getReservationById(reservationId)

    if (!reservation) {
      return {
        success: false,
        error: 'Reservasi tidak ditemukan.',
      }
    }

    if (reservation.status !== 'disetujui') {
      return {
        success: false,
        error:
          `Hanya reservasi berstatus "disetujui" yang dapat ` +
          `dibatalkan darurat oleh petugas ` +
          `(status saat ini: ${reservation.status}).`,
      }
    }

    const updated = await updateReservationStatus(
      reservationId,
      'dibatalkan',
      {
        rejection_reason: reason.trim(),
        processed_by: staffId,
        processed_at: new Date().toISOString(),
      },
      ['disetujui'],
    )

    return {
      success: true,
      data: updated,
    }
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : String(err)

    return {
      success: false,
      error: `Gagal melakukan pembatalan darurat: ${errorMsg}`,
    }
  }
}