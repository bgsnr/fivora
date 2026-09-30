import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Reservation } from '@/types/reservation'

/**
 * Chapter 5 — Mesin Deteksi Bentrok Jadwal
 * Logika deteksi konflik jadwal (rentang waktu beririsan), penguncian slot,
 * pencegahan double-booking pengguna lintas fasilitas, dan auto-reject pending yang bertabrakan.
 */

/**
 * Memeriksa apakah status fasilitas mengizinkan pemesanan.
 * Fasilitas hanya bisa dipesan jika berstatus 'aktif' (bukan 'dalam_perbaikan' atau 'nonaktif').
 */
export function isFacilityBookable(facilityStatus: string): boolean {
  return facilityStatus === 'aktif'
}

/**
 * 1. checkFacilityConflict
 * Memeriksa bentrok pada fasilitas yang sama untuk tanggal dan rentang waktu yang diajukan.
 * HANYA reservasi berstatus 'disetujui' yang mengunci slot.
 * Rumus irisan waktu [a_start, a_end) & [b_start, b_end):
 * start_time < endTime AND end_time > startTime
 */
export async function checkFacilityConflict(
  facilityId: number | string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: number | string
): Promise<Reservation[]> {
  const supabase = supabaseAdmin

  let query = supabase
    .from('reservations')
    .select(
      `
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name)
    `
    )
    .eq('facility_id', facilityId)
    .eq('reservation_date', date)
    .eq('status', 'disetujui')
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId)
  }

  const { data, error } = await query.order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Gagal memeriksa konflik fasilitas: ${error.message}`)
  }

  return (data as Reservation[]) || []
}

/**
 * 2. checkUserDoubleBooking
 * Memeriksa apakah pengguna memiliki reservasi lain (berstatus 'menunggu' ATAU 'disetujui')
 * yang waktunya bertabrakan pada tanggal yang sama, baik di fasilitas sama maupun BERBEDA.
 */
export async function checkUserDoubleBooking(
  userId: number | string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: number | string
): Promise<Reservation[]> {
  const supabase = supabaseAdmin

  let query = supabase
    .from('reservations')
    .select(
      `
      *,
      facilities:facility_id(id, name, location)
    `
    )
    .eq('user_id', userId)
    .eq('reservation_date', date)
    .in('status', ['menunggu', 'disetujui'])
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  if (excludeReservationId) {
    query = query.neq('id', excludeReservationId)
  }

  const { data, error } = await query.order('start_time', { ascending: true })

  if (error) {
    throw new Error(`Gagal memeriksa double booking pengguna: ${error.message}`)
  }

  return (data as Reservation[]) || []
}

/**
 * 3. autoRejectConflictingPendingReservations
 * Ketika petugas menyetujui satu reservasi, sistem mencari semua reservasi lain
 * yang masih 'menunggu' dan waktunya bentrok pada fasilitas yang sama, lalu
 * mengubah statusnya menjadi 'ditolak' dengan alasan "jadwal telah terisi".
 */
export async function autoRejectConflictingPendingReservations(
  approvedReservation: {
    id: number | string
    facility_id: number | string
    reservation_date: string
    start_time: string
    end_time: string
    processed_by?: number | string | null
  }
): Promise<Reservation[]> {
  const supabase = supabaseAdmin

  // 1. Cari reservasi pending yang beririsan
  const { data: pendingConflicts, error: searchError } = await supabase
    .from('reservations')
    .select('*')
    .eq('facility_id', approvedReservation.facility_id)
    .eq('reservation_date', approvedReservation.reservation_date)
    .eq('status', 'menunggu')
    .neq('id', approvedReservation.id)
    .lt('start_time', approvedReservation.end_time)
    .gt('end_time', approvedReservation.start_time)

  if (searchError) {
    throw new Error(`Gagal mencari reservasi pending yang bentrok: ${searchError.message}`)
  }

  if (!pendingConflicts || pendingConflicts.length === 0) {
    return []
  }

  const conflictIds = pendingConflicts.map((item) => item.id)
  const nowIso = new Date().toISOString()

  // 2. Update status semua reservasi bentrok menjadi 'ditolak'
  const { data: rejectedReservations, error: updateError } = await supabase
    .from('reservations')
    .update({
      status: 'ditolak',
      rejection_reason: 'jadwal telah terisi',
      processed_by: approvedReservation.processed_by || null,
      processed_at: nowIso,
    })
    .in('id', conflictIds)
    .select()

  if (updateError) {
    throw new Error(`Gagal mengubah status reservasi bentrok: ${updateError.message}`)
  }

  return (rejectedReservations as Reservation[]) || []
}
