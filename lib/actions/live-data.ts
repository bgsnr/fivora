'use server'

import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { Facility } from '@/types/facility'
import type { FacilityItem } from '@/components/landing/facility-showcase'
import { getFacilityCategory, isEquipmentFacility } from '@/lib/facility-categories'
import { getWIBDateTime } from '@/lib/validations/reservation-time'

export async function getCatalogFacilities() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('facilities')
    .select('*').order('name', { ascending: true })
  if (error) return { success: false as const, error: 'Daftar fasilitas gagal dimuat. Coba lagi.' }
  return { success: true as const, facilities: (data ?? []) as Facility[] }
}

export async function getPublicFacilityCatalog() {
  const supabase = await createClient()
  const wib = getWIBDateTime(new Date())
  const [facilities, reservations] = await Promise.all([
    supabase.from('facilities').select('*').order('name', { ascending: true }),
    supabase.from('reservations').select('facility_id, start_time, end_time')
      .eq('reservation_date', wib.dateStr).in('status', ['disetujui', 'approved']),
  ])
  if (facilities.error || reservations.error) {
    return { success: false as const, error: 'Daftar fasilitas dan jadwal gagal dimuat. Coba lagi.' }
  }
  return {
    success: true as const,
    currentTime: wib.timeStr.slice(0, 5),
    facilities: (facilities.data ?? []) as Facility[],
    reservations: (reservations.data ?? []) as {
      facility_id: number; start_time: string; end_time: string
    }[],
  }
}

export async function getLandingFacilities() {
  const result = await getPublicFacilityCatalog()
  if (!result.success) return result
  const currentTime = result.currentTime

  const facilities: FacilityItem[] = result.facilities.map((facility) => {
    let status: FacilityItem['status']
    let operationalInfo: string
    if (facility.status === 'nonaktif' || facility.status === 'inactive') {
      status = 'inactive'
      operationalInfo = 'Tidak menerima reservasi'
    } else if (facility.status === 'dalam_perbaikan' || facility.status === 'under_maintenance') {
      status = 'maintenance'
      operationalInfo = 'Sedang dalam perbaikan oleh petugas'
    } else if (facility.status === 'aktif' || facility.status === 'active') {
      const inUse = result.reservations.some((reservation) =>
        String(reservation.facility_id) === String(facility.id) &&
        reservation.start_time.slice(0, 5) <= currentTime &&
        currentTime < reservation.end_time.slice(0, 5)
      )
      status = inUse ? 'in_use' : 'available'
      operationalInfo = inUse
        ? 'Sedang dipakai pada slot jadwal saat ini'
        : 'Jam layanan 07.00–20.00 WIB'
    } else {
      status = 'unavailable'
      operationalInfo = 'Tidak menerima reservasi'
    }
    return {
      id: facility.id,
      code: `FAC-${String(facility.id).padStart(3, '0')}`,
      name: facility.name,
      type: getFacilityCategory(facility.type),
      location: facility.location ?? 'Lokasi belum dicantumkan',
      capacity: facility.capacity,
      capacityUnit: isEquipmentFacility(facility.type, facility.name) ? 'unit' : 'orang',
      description: facility.description ?? '',
      status,
      operationalInfo,
    }
  })
  return { success: true as const, facilities }
}

export async function getFacilityAvailability(facilityId: string, date: string) {
  if (!/^[1-9]\d{0,18}$/.test(facilityId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false as const, error: 'Fasilitas atau tanggal tidak valid.' }
  }
  const supabase = await createClient()
  const [facility, reservations] = await Promise.all([
    supabase.from('facilities').select('*').eq('id', facilityId).maybeSingle(),
    supabase.from('reservations').select('start_time, end_time')
      .eq('facility_id', facilityId).eq('reservation_date', date)
      .in('status', ['disetujui', 'approved']),
  ])
  if (facility.error || reservations.error || !facility.data) {
    return { success: false as const, error: 'Data fasilitas dan jadwal gagal dimuat. Coba lagi.' }
  }
  return {
    success: true as const,
    facility: facility.data as Facility,
    reservations: reservations.data ?? [],
  }
}

type HistoryRow = {
  id: number
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  facility: { name: string; location: string | null } | null
}

export async function getOwnReservationHistory() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'pengguna' || user.status !== 'aktif') {
    return { success: false as const, unauthorized: true, error: 'Masuk dengan akun pengguna aktif.' }
  }
  const supabase = await createClient()
  const { data, error } = await supabase.from('reservations')
    .select('id, reservation_date, start_time, end_time, status, facility:facilities!facility_id(name, location)')
    .eq('user_id', user.id)
    .order('reservation_date', { ascending: false })
    .order('start_time', { ascending: false }).returns<HistoryRow[]>()
  if (error) return { success: false as const, unauthorized: false, error: 'Riwayat reservasi gagal dimuat. Coba lagi.' }
  return { success: true as const, userName: user.name, reservations: data ?? [] }
}
