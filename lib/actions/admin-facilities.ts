'use server'

import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Facility } from '@/types/facility'

export interface PendingReservationInfo {
  id: number
  user_name: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
}

async function requireAdmin() {
  const user = await getCurrentUser()

  if (
    !user ||
    user.role !== 'admin' ||
    user.status !== 'aktif'
  ) {
    throw new Error(
      'Akses hanya untuk administrator aktif.'
    )
  }

  return user
}

export async function getAllFacilitiesAdmin(): Promise<
  Facility[]
> {
  await requireAdmin()

  const { data, error } = await supabaseAdmin
    .from('facilities')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw new Error(
      'Gagal memuat fasilitas: ' + error.message
    )
  }

  return (data ?? []) as Facility[]
}

/* Reservasi mendatang berstatus menunggu/disetujui untuk satu fasilitas */
export async function getUpcomingReservationsForFacility(
  facilityId: number
): Promise<PendingReservationInfo[]> {
  await requireAdmin()

  if (!Number.isSafeInteger(facilityId) || facilityId <= 0) {
    throw new Error('ID fasilitas tidak valid.')
  }

  // Waktu sekarang dalam WIB
  const nowWib = new Date(
    new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    })
  )

  const pad = (n: number) => String(n).padStart(2, '0')

  const today = `${nowWib.getFullYear()}-${pad(
    nowWib.getMonth() + 1
  )}-${pad(nowWib.getDate())}`

  const currentTime = `${pad(
    nowWib.getHours()
  )}:${pad(nowWib.getMinutes())}:${pad(
    nowWib.getSeconds()
  )}`

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(
      'id, user_name, reservation_date, start_time, end_time, status'
    )
    .eq('facility_id', facilityId)
    .in('status', [
      'menunggu',
      'pending',
      'disetujui',
      'approved',
    ])
    .gte('reservation_date', today)
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    throw new Error(
      'Gagal memeriksa reservasi: ' + error.message
    )
  }

  return (data ?? []).filter((reservation) => {
    if (reservation.reservation_date > today) {
      return true
    }

    return reservation.end_time >= currentTime
  }) as PendingReservationInfo[]
}

export async function setFacilityStatusAction(
  facilityId: number,
  status: 'aktif' | 'nonaktif'
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  if (
    !Number.isSafeInteger(facilityId) ||
    facilityId <= 0 ||
    (status !== 'aktif' && status !== 'nonaktif')
  ) {
    return { success: false, error: 'Data tidak valid.' }
  }

  const { error } = await supabaseAdmin
    .from('facilities')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', facilityId)

  if (error) {
    return {
      success: false,
      error:
        (status === 'nonaktif'
          ? 'Gagal menonaktifkan fasilitas: '
          : 'Gagal mengaktifkan fasilitas: ') +
        error.message,
    }
  }

  return { success: true }
}
