import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  validateReservationTimeRules,
  isReservationExpiredForApproval,
  canUserCancelReservation,
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
} from '@/lib/actions/reservations'
import { reservationInputSchema } from '@/lib/validations/reservations'
import type { Reservation } from '@/types/reservation'

/**
 * Reservation Service (Chapter 6, 8, 10, 11)
 *
 * Lapisan logika bisnis reservasi. Modul ini TIDAK boleh diekspor sebagai
 * Server Action dan TIDAK pernah menerima identitas dari client.
 *
 * Identitas (userId / staffId) selalu ditentukan oleh pemanggil:
 * - Server Action (`lib/actions/reservations.ts`) menurunkannya dari sesi
 *   (`getCurrentUser()`), satu-satunya sumber yang dipercaya.
 * - Unit test memanggil fungsi ini langsung dengan identitas eksplisit
 *   tanpa melalui jalur jaringan.
 *
 * Dengan pemisahan ini, client tidak bisa lagi memalsukan `user_id`/`staffId`
 * (temuan audit-002 No. 02).
 */

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
  const supabase = supabaseAdmin
  const { data, error } = await supabase
    .from('facilities')
    .select('id, name, type, location, capacity, description, status')
    .order('name', { ascending: true })

  if (error || !data) {
    return []
  }

  return data as FacilityOption[]
}

export interface CreateReservationState {
  success: boolean
  error?: string
  data?: Reservation
}

export interface CreateReservationParams {
  facility_id: number
  reservation_date: string
  start_time: string
  end_time: string
  purpose: string
}

/**
 * Mengajukan Reservasi Baru (Chapter 6)
 * Validasi berurutan di server:
 * 1. Kelengkapan field wajib
 * 2. Ketersediaan status fasilitas (aktif / bukan dalam perbaikan)
 * 3. Aturan jam operasional & slot waktu (Chapter 4)
 * 4. Deteksi bentrok jadwal & double-booking pengguna (Chapter 5)
 */
export async function submitReservation(
  params: CreateReservationParams,
  userId: number
): Promise<CreateReservationState> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'Harap masuk (login) terlebih dahulu untuk mengajukan reservasi',
      }
    }

    // 1. Validasi Zod reservationInputSchema (Chapter 6)
    const normalizedInput = {
      facilityId: params.facility_id !== undefined ? Number(params.facility_id) : '',
      reservationDate: params.reservation_date?.trim() || '',
      startTime: params.start_time?.trim() || '',
      endTime: params.end_time?.trim() || '',
      purpose: params.purpose?.trim() || '',
    }

    const zodResult = reservationInputSchema.safeParse(normalizedInput)
    if (!zodResult.success) {
      const firstIssue = zodResult.error.issues[0]
      return {
        success: false,
        error: firstIssue?.message || 'Data pengajuan reservasi tidak valid',
      }
    }

    const facilityId = Number(normalizedInput.facilityId)
    const reservationDate = normalizedInput.reservationDate
    const startTime = normalizedInput.startTime
    const endTime = normalizedInput.endTime
    const purpose = normalizedInput.purpose

    // 2. Cek Status Fasilitas
    const supabase = supabaseAdmin
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, status')
      .eq('id', facilityId)
      .single()

    if (facilityError || !facility) {
      return { success: false, error: 'Fasilitas tidak ditemukan dalam sistem' }
    }

    if (!isFacilityBookable(facility.status)) {
      const statusText =
        facility.status === 'dalam_perbaikan'
          ? 'sedang dalam perbaikan'
          : 'sedang dinonaktifkan'
      return {
        success: false,
        error: `Fasilitas "${facility.name}" ${statusText} dan tidak dapat direservasi`,
      }
    }

    // 3. Validasi Aturan Waktu & Slot (Chapter 4)
    const timeValidation = validateReservationTimeRules(
      reservationDate,
      startTime,
      endTime,
      new Date()
    )
    if (!timeValidation.valid) {
      return {
        success: false,
        error: timeValidation.error || 'Waktu atau slot reservasi tidak valid',
      }
    }

    // 4. Validasi Bentrok Jadwal Fasilitas (Chapter 5)
    // HANYA reservasi disetujui yang mengunci slot fasilitas
    const facilityConflicts = await checkFacilityConflict(
      facilityId,
      reservationDate,
      startTime,
      endTime
    )
    if (facilityConflicts.length > 0) {
      return {
        success: false,
        error: 'Jadwal fasilitas pada rentang waktu ini telah terisi oleh reservasi lain yang telah disetujui',
      }
    }

    // 5. Validasi Double-Booking Pengguna Lintas Fasilitas (Chapter 5)
    const userConflicts = await checkUserDoubleBooking(
      userId,
      reservationDate,
      startTime,
      endTime
    )
    if (userConflicts.length > 0) {
      return {
        success: false,
        error:
          'Anda sudah memiliki reservasi aktif (menunggu atau disetujui) pada waktu yang bertabrakan di fasilitas lain',
      }
    }

    // 6. Simpan Reservasi Baru (Status default 'menunggu')
    const newReservation = await createReservation({
      user_id: userId,
      facility_id: facilityId,
      reservation_date: reservationDate,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
      purpose,
      status: 'menunggu',
    })

    return {
      success: true,
      data: newReservation,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Terjadi kesalahan saat memproses reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Batalkan Reservasi oleh Pengguna (Chapter 8)
 */
export async function cancelReservationForUser(
  reservationId: number,
  reason: string | undefined,
  userId: number
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'Harap masuk (login) terlebih dahulu untuk membatalkan reservasi',
      }
    }

    const reservation = await getReservationById(reservationId)
    if (!reservation) {
      return {
        success: false,
        error: 'Data reservasi tidak ditemukan',
      }
    }

    const cancelCheck = canUserCancelReservation(reservation, userId, new Date())
    if (!cancelCheck.allowed) {
      return {
        success: false,
        error: cancelCheck.reason || 'Pembatalan tidak diizinkan',
      }
    }

    const cancelReason =
      reason?.trim() || 'Dibatalkan oleh pemesan melalui sistem'

    // Update status ke 'dibatalkan' (TIDAK menghapus data dari DB)
    const updated = await updateReservationStatus(reservationId, 'dibatalkan', {
      rejection_reason: cancelReason,
    })

    return {
      success: true,
      data: updated,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal membatalkan reservasi: ${errorMsg}`,
    }
  }
}

export interface ApproveReservationResult {
  success: boolean
  error?: string
  autoRejected?: boolean
  autoRejectedCount?: number
  data?: Reservation
}

/**
 * Menyetujui Reservasi oleh Petugas (Chapter 10)
 * Verifikasi ulang sebelum approve:
 * 1. Cek apakah start_time sudah terlewati (auto-reject jika ya)
 * 2. Cek ketersediaan status fasilitas
 * 3. Cek bentrok dengan reservasi 'disetujui' lain (anti race condition)
 * 4. Update status ke 'disetujui'
 * 5. Auto-reject pending lain yang bertabrakan
 */
export async function approveReservation(
  reservationId: number,
  staffId: number
): Promise<ApproveReservationResult> {
  try {
    if (!staffId) {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang untuk menyetujui reservasi',
      }
    }

    const reservation = await getReservationById(reservationId)
    if (!reservation) {
      return { success: false, error: 'Reservasi tidak ditemukan' }
    }

    if (reservation.status !== 'menunggu') {
      return {
        success: false,
        error: `Hanya reservasi berstatus "menunggu" yang dapat disetujui (status saat ini: ${reservation.status})`,
      }
    }

    const now = new Date()

    // 1. Re-check: Waktu mulai terlewati (Chapter 4 & 10)
    if (isReservationExpiredForApproval(reservation, now)) {
      const rejectedExpired = await updateReservationStatus(
        reservationId,
        'ditolak',
        {
          rejection_reason: 'waktu mulai reservasi telah terlewati',
          processed_by: staffId,
          processed_at: now.toISOString(),
        }
      )
      return {
        success: false,
        autoRejected: true,
        error:
          'Persetujuan dibatalkan: waktu mulai reservasi telah terlewati. Status otomatis diubah menjadi "ditolak".',
        data: rejectedExpired,
      }
    }

    // 2. Re-check: Status Fasilitas
    const supabase = supabaseAdmin
    const { data: facility } = await supabase
      .from('facilities')
      .select('id, name, status')
      .eq('id', reservation.facility_id)
      .single()

    if (!facility || !isFacilityBookable(facility.status)) {
      const rejectedRepair = await updateReservationStatus(
        reservationId,
        'ditolak',
        {
          rejection_reason: 'fasilitas dalam perbaikan',
          processed_by: staffId,
          processed_at: now.toISOString(),
        }
      )
      return {
        success: false,
        autoRejected: true,
        error: `Fasilitas sedang ${facility?.status || 'tidak aktif'}. Pengajuan otomatis ditolak.`,
        data: rejectedRepair,
      }
    }

    // 3. Re-check: Bentrok Jadwal dengan reservasi disetujui lain (Chapter 5 & 10)
    const conflicts = await checkFacilityConflict(
      reservation.facility_id,
      reservation.reservation_date,
      reservation.start_time,
      reservation.end_time,
      reservation.id
    )

    if (conflicts.length > 0) {
      return {
        success: false,
        error:
          'Persetujuan ditolak: Jadwal fasilitas pada rentang waktu ini telah terisi oleh reservasi lain yang disetujui sebelumnya.',
      }
    }

    // 4. Update status ke 'disetujui'
    const approved = await updateReservationStatus(reservationId, 'disetujui', {
      processed_by: staffId,
      processed_at: now.toISOString(),
    })

    // 5. Auto-reject seluruh reservasi pending lain yang bentrok pada fasilitas yang sama
    const autoRejectedList = await autoRejectConflictingPendingReservations({
      id: approved.id,
      facility_id: approved.facility_id,
      reservation_date: approved.reservation_date,
      start_time: approved.start_time,
      end_time: approved.end_time,
      processed_by: staffId,
    })

    return {
      success: true,
      data: approved,
      autoRejectedCount: autoRejectedList.length,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menyetujui reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Menolak Reservasi oleh Petugas (Chapter 10)
 * Alasan penolakan WAJIB diisi.
 */
export async function rejectReservation(
  reservationId: number,
  reason: string,
  staffId: number
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
  try {
    if (!staffId) {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang untuk menolak reservasi',
      }
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: 'Alasan penolakan reservasi wajib diisi oleh petugas',
      }
    }

    const reservation = await getReservationById(reservationId)
    if (!reservation) {
      return { success: false, error: 'Reservasi tidak ditemukan' }
    }

    if (reservation.status !== 'menunggu') {
      return {
        success: false,
        error: `Hanya reservasi berstatus "menunggu" yang dapat ditolak (status saat ini: ${reservation.status})`,
      }
    }

    const updated = await updateReservationStatus(reservationId, 'ditolak', {
      rejection_reason: reason.trim(),
      processed_by: staffId,
      processed_at: new Date().toISOString(),
    })

    return {
      success: true,
      data: updated,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menolak reservasi: ${errorMsg}`,
    }
  }
}

/**
 * Pembatalan Darurat oleh Petugas (Chapter 11)
 * Hanya berlaku untuk reservasi berstatus 'disetujui'. Alasan pembatalan WAJIB diisi.
 * Tidak terikat batas waktu 3 jam.
 */
export async function emergencyCancelByStaff(
  reservationId: number,
  staffId: number,
  reason: string
): Promise<{ success: boolean; error?: string; data?: Reservation }> {
if (!staffId) {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang membatalkan reservasi secara darurat',
      }
    }

  if (!reason || !reason.trim()) {
    return {
      success: false,
      error: 'Alasan pembatalan darurat wajib diisi oleh petugas',
    }
  }

  const reservation = await getReservationById(reservationId)
  if (!reservation) {
    return { success: false, error: 'Reservasi tidak ditemukan' }
  }

  if (reservation.status !== 'disetujui') {
    return {
      success: false,
      error: `Hanya reservasi berstatus "disetujui" yang dapat dibatalkan darurat oleh petugas (status saat ini: ${reservation.status})`,
    }
  }

  const updated = await updateReservationStatus(reservationId, 'dibatalkan', {
    rejection_reason: reason.trim(),
    processed_by: staffId,
    processed_at: new Date().toISOString(),
  })

  return {
    success: true,
    data: updated,
  }
}