import { supabaseAdmin } from '@/lib/supabase/admin'
import { getWIBDateTime } from '@/lib/validations/reservation-time'
import { emergencyCancelByStaff } from '@/lib/reservation-service'
import { updateReservationStatus } from '@/lib/actions/reservations'
import type { Reservation } from '@/types/reservation'

/**
 * Chapter 12 — Integrasi Lintas Modul
 * 1. Alyssa: Akun & Role
 * 2. Arin: Laporan Kerusakan & Fasilitas dalam Perbaikan
 * 3. Eve: Ketersediaan Fasilitas & Validasi Penonaktifan Admin
 */

/**
 * 1. Integrasi Eve: Ketersediaan Slot Fasilitas Publik (Single Source of Truth)
 * Menghasilkan status ketersediaan seluruh 26 slot (07:00 - 20:00 WIB) untuk satu fasilitas dan tanggal.
 * HANYA reservasi 'disetujui' yang mengunci slot.
 */
export interface SlotAvailability {
  slotIndex: number // 1 - 26
  startTime: string // HH:mm
  endTime: string // HH:mm
  isBooked: boolean
  isPast: boolean
  available: boolean
}

const OPERATIONAL_SLOTS = [
  { startTime: '07:00', endTime: '07:30' },
  { startTime: '07:30', endTime: '08:00' },
  { startTime: '08:00', endTime: '08:30' },
  { startTime: '08:30', endTime: '09:00' },
  { startTime: '09:00', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:00' },
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '10:30', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:30' },
  { startTime: '11:30', endTime: '12:00' },
  { startTime: '12:00', endTime: '12:30' },
  { startTime: '12:30', endTime: '13:00' },
  { startTime: '13:00', endTime: '13:30' },
  { startTime: '13:30', endTime: '14:00' },
  { startTime: '14:00', endTime: '14:30' },
  { startTime: '14:30', endTime: '15:00' },
  { startTime: '15:00', endTime: '15:30' },
  { startTime: '15:30', endTime: '16:00' },
  { startTime: '16:00', endTime: '16:30' },
  { startTime: '16:30', endTime: '17:00' },
  { startTime: '17:00', endTime: '17:30' },
  { startTime: '17:30', endTime: '18:00' },
  { startTime: '18:00', endTime: '18:30' },
  { startTime: '18:30', endTime: '19:00' },
  { startTime: '19:00', endTime: '19:30' },
  { startTime: '19:30', endTime: '20:00' },
]

export async function getFacilitySlotAvailability(
  facilityId: number,
  date: string,
  now: Date = new Date()
): Promise<SlotAvailability[]> {
  const supabase = supabaseAdmin

  // Ambil hanya reservasi disetujui pada tanggal dan fasilitas tersebut
  const { data: approvedReservations, error } = await supabase
    .from('reservations')
    .select('start_time, end_time')
    .eq('facility_id', facilityId)
    .eq('reservation_date', date)
    .eq('status', 'disetujui')

  if (error) {
    throw new Error(`Gagal mengambil ketersediaan slot: ${error.message}`)
  }

  const wibNow = getWIBDateTime(now)
  const isDateInPast = date < wibNow.dateStr
  const isToday = date === wibNow.dateStr

  return OPERATIONAL_SLOTS.map((slot, index) => {
    const slotStartFormatted = `${slot.startTime}:00`
    const slotEndFormatted = `${slot.endTime}:00`

    // Periksa apakah slot beririsan dengan reservasi disetujui
    const isBooked = (approvedReservations || []).some((r) => {
      return r.start_time < slotEndFormatted && r.end_time > slotStartFormatted
    })

    // Periksa apakah slot sudah terlewat waktu
    let isPast = isDateInPast
    if (isToday) {
      const [h, m] = slot.startTime.split(':').map(Number)
      const slotStartMinutes = h * 60 + m
      isPast = wibNow.totalMinutes >= slotStartMinutes
    }

    return {
      slotIndex: index + 1,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked,
      isPast,
      available: !isBooked && !isPast,
    }
  })
}

/**
 * 2. Integrasi Eve / Admin: Proteksi Penonaktifan Fasilitas
 * Fasilitas hanya bisa dinonaktifkan jika tidak ada reservasi mendatang
 * yang masih 'menunggu' atau 'disetujui'.
 */
export async function getUpcomingActiveReservationsForFacility(
  facilityId: number,
  now: Date = new Date()
): Promise<Reservation[]> {
  const supabase = supabaseAdmin
  const wibNow = getWIBDateTime(now)

  const { data, error } = await supabase
    .from('reservations')
    .select(
      `
      *,
      users:user_id(id, name, email)
    `
    )
    .eq('facility_id', facilityId)
    .in('status', ['menunggu', 'disetujui'])
    .gte('reservation_date', wibNow.dateStr)
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(
      `Gagal memeriksa reservasi mendatang untuk fasilitas ${facilityId}: ${error.message}`
    )
  }

  return (data as Reservation[]) || []
}

/**
 * 3. Integrasi Arin: Penanganan Reservasi saat Fasilitas Ditandai "Dalam Perbaikan"
 * Saat fasilitas ditandai dalam perbaikan oleh petugas:
 * - Pengajuan 'menunggu' mendatang otomatis ditolak ("fasilitas dalam perbaikan")
 * - Reservasi 'disetujui' mendatang atau berlangsung dibatalkan petugas dengan alasan kerusakan
 * - Riwayat yang sudah lewat waktu TIDAK diubah
 */
export async function handleFacilityMaintenance(
  facilityId: number,
  staffId: number,
  damageReason: string,
  now: Date = new Date()
): Promise<{
  rejectedPendingCount: number
  cancelledApprovedCount: number
}> {
  const supabase = supabaseAdmin
  const wibNow = getWIBDateTime(now)
  const nowIso = now.toISOString()

  // 1. Ambil reservasi mendatang atau hari ini yang belum selesai
  const { data: activeReservations, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('facility_id', facilityId)
    .in('status', ['menunggu', 'disetujui'])
    .gte('reservation_date', wibNow.dateStr)

  if (error || !activeReservations) {
    throw new Error(`Gagal memuat reservasi aktif: ${error?.message || 'Data kosong'}`)
  }

  let rejectedPendingCount = 0
  let cancelledApprovedCount = 0

  for (const res of activeReservations) {
    // Abaikan jika reservasi hari ini tapi sudah lewat end_time (riwayat masa lalu tidak diubah)
    if (res.reservation_date === wibNow.dateStr) {
      const [eh, em] = res.end_time.split(':').map(Number)
      const endMinutes = eh * 60 + em
      if (wibNow.totalMinutes >= endMinutes) {
        continue
      }
    }

    if (res.status === 'menunggu') {
      await updateReservationStatus(res.id, 'ditolak', {
        rejection_reason: 'fasilitas dalam perbaikan',
        processed_by: staffId,
        processed_at: nowIso,
      })
      rejectedPendingCount++
    } else if (res.status === 'disetujui') {
      await emergencyCancelByStaff(
        res.id,
        staffId,
        `Fasilitas dalam perbaikan: ${damageReason.trim()}`
      )
      cancelledApprovedCount++
    }
  }

  return {
    rejectedPendingCount,
    cancelledApprovedCount,
  }
}

/**
 * Integrasi Arin (invocation point dari modul Petugas): Menandai fasilitas
 * sebagai "dalam perbaikan" lalu memproses reservasi aktif yang terdampak.
 * Diharuskan hanya dipanggil oleh role 'petugas' (dipastikan di Server Action).
 */
export async function setFacilityInMaintenance(
  facilityId: number,
  staffId: number,
  damageReason: string,
  now: Date = new Date()
): Promise<{
  success: boolean
  error?: string
  facilityUpdated: boolean
  rejectedPendingCount: number
  cancelledApprovedCount: number
}> {
  const supabase = supabaseAdmin

  const { data: facility, error: fetchError } = await supabase
    .from('facilities')
    .select('id, status')
    .eq('id', facilityId)
    .single()

  if (fetchError || !facility) {
    return {
      success: false,
      error: 'Fasilitas tidak ditemukan dalam sistem',
      facilityUpdated: false,
      rejectedPendingCount: 0,
      cancelledApprovedCount: 0,
    }
  }

  if (facility.status === 'dalam_perbaikan') {
    return {
      success: true,
      error: 'Fasilitas sudah berstatus dalam perbaikan',
      facilityUpdated: false,
      rejectedPendingCount: 0,
      cancelledApprovedCount: 0,
    }
  }

  const { error: updateError } = await supabase
    .from('facilities')
    .update({ status: 'dalam_perbaikan', updated_at: now.toISOString() })
    .eq('id', facilityId)

  if (updateError) {
    return {
      success: false,
      error: `Gagal memperbarui status fasilitas: ${updateError.message}`,
      facilityUpdated: false,
      rejectedPendingCount: 0,
      cancelledApprovedCount: 0,
    }
  }

  const maintenance = await handleFacilityMaintenance(
    facilityId,
    staffId,
    damageReason,
    now
  )

  return {
    success: true,
    facilityUpdated: true,
    rejectedPendingCount: maintenance.rejectedPendingCount,
    cancelledApprovedCount: maintenance.cancelledApprovedCount,
  }
}

/**
 * Integrasi Arin (invocation point): Petugas mengembalikan fasilitas dari
 * status perbaikan kembali ke 'aktif'. Hanya dipanggil oleh role 'petugas'.
 */
export async function restoreFacilityFromMaintenance(
  facilityId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = supabaseAdmin

  const { data: facility, error: fetchError } = await supabase
    .from('facilities')
    .select('id, status')
    .eq('id', facilityId)
    .single()

  if (fetchError || !facility) {
    return { success: false, error: 'Fasilitas tidak ditemukan dalam sistem' }
  }

  if (facility.status !== 'dalam_perbaikan') {
    return { success: true }
  }

  const { error: updateError } = await supabase
    .from('facilities')
    .update({ status: 'aktif', updated_at: new Date().toISOString() })
    .eq('id', facilityId)

  if (updateError) {
    return {
      success: false,
      error: `Gagal mengaktifkan kembali fasilitas: ${updateError.message}`,
    }
  }

  return { success: true }
}
