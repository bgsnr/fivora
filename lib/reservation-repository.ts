import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  NewReservationInput,
  Reservation,
  ReservationStatus,
  UpdateReservationStatusMeta,
} from '@/types/reservation'

/**
 * Repository internal untuk operasi database reservasi.
 * Gunakan hanya dari kode server, bukan dari Client Component.
 */

export async function createReservation(
  data: NewReservationInput
): Promise<Reservation> {
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

export async function getReservationById(
  id: string | number
): Promise<Reservation | null> {
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

export async function updateReservationStatus(
  id: string | number,
  status: ReservationStatus,
  meta?: UpdateReservationStatusMeta,
  expectedStatuses?: ReservationStatus[],
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

  let query = supabaseAdmin
    .from('reservations')
    .update(updatePayload)
    .eq('id', id)

  // Pastikan status belum berubah sejak reservasi diperiksa.
  if (expectedStatuses && expectedStatuses.length > 0) {
    query = query.in('status', expectedStatuses)
  }

  const { data, error } = await query
    .select(`
      *,
      users:user_id(id, name, email),
      facilities:facility_id(id, name, location, type, status)
    `)
    .maybeSingle()

  if (error) {
    if (error.code === '23P01') {
      throw new Error(
        'Jadwal bentrok: fasilitas sudah disetujui untuk reservasi lain pada rentang waktu tersebut.',
      )
    }

    throw new Error(
      `Gagal memperbarui status reservasi: ${error.message}`,
    )
  }

  if (!data) {
    if (expectedStatuses && expectedStatuses.length > 0) {
      throw new Error(
        'Status reservasi sudah berubah atau reservasi sudah diproses. Muat ulang halaman, lalu coba lagi.',
      )
    }

    throw new Error('Reservasi tidak ditemukan.')
  }

  return data as Reservation
}