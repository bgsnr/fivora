'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { validateFacilityMaster, validFacilityId, validFacilityVersion } from '@/lib/validations/facilities'
import type { Facility } from '@/types/facility'

export interface PendingReservationInfo {
  id: number
  user_name: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
}

export type FacilityActionResult = {
  success: boolean
  error?: string
  needsReload?: boolean
  facilityId?: number
}

const facilityColumns = 'id,name,type,location,capacity,description,status,created_at,updated_at'

async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin' || user.status !== 'aktif') {
    throw new Error('Akses hanya untuk administrator aktif.')
  }
  return user
}

function refreshFacilityPages(id?: number) {
  try {
    for (const route of ['/', '/admin/fasilitas', '/fasilitas', '/catalog', '/reservations', '/laporan/buat', '/petugas/fasilitas']) {
      revalidatePath(route)
    }
    if (id) {
      revalidatePath(`/fasilitas/${id}`)
      revalidatePath(`/admin/fasilitas/${id}/edit`)
      revalidatePath(`/petugas/fasilitas/${id}`)
    }
  } catch (error) {
    // Penyimpanan sudah berhasil; kegagalan refresh bukan kegagalan simpan.
    console.error('Gagal memperbarui halaman fasilitas:', error)
  }
}

function rpcFailure(error: { code?: string; message?: string }): FacilityActionResult {
  if (error.code === '40001') {
    return { success: false, needsReload: true, error: 'Data fasilitas sudah berubah. Muat ulang sebelum melanjutkan.' }
  }
  if (error.code === 'P0001' && error.message) {
    return { success: false, error: error.message }
  }
  console.error('Operasi fasilitas gagal:', error)
  return { success: false, error: 'Perubahan gagal disimpan. Silakan coba lagi.' }
}

export async function getAllFacilitiesAdmin(): Promise<Facility[]> {
  await requireAdmin()
  const facilities: Facility[] = []
  const batchSize = 250
  for (let from = 0; ; from += batchSize) {
    const { data, error } = await supabaseAdmin.from('facilities')
      .select(facilityColumns).order('id', { ascending: true }).range(from, from + batchSize - 1)
    if (error) throw new Error('Gagal memuat data fasilitas.')
    const batch = (data ?? []) as Facility[]
    facilities.push(...batch)
    if (batch.length < batchSize) break
  }
  return facilities
}

export async function getFacilityAdmin(facilityId: number): Promise<Facility | null> {
  await requireAdmin()
  if (!validFacilityId(facilityId)) throw new Error('ID fasilitas tidak valid.')
  const { data, error } = await supabaseAdmin.from('facilities')
    .select(facilityColumns).eq('id', facilityId).maybeSingle()
  if (error) throw new Error('Gagal memuat data fasilitas.')
  return data as Facility | null
}

export async function getUpcomingReservationsForFacility(facilityId: number): Promise<PendingReservationInfo[]> {
  await requireAdmin()
  if (!validFacilityId(facilityId)) throw new Error('ID fasilitas tidak valid.')
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_facility_pending_reservations', { p_facility_id: facilityId })
  if (error) throw new Error('Gagal memeriksa reservasi fasilitas.')
  return (data ?? []) as PendingReservationInfo[]
}

export async function createFacilityAdminAction(input: unknown, initialStatus: unknown): Promise<FacilityActionResult> {
  await requireAdmin()
  const validation = validateFacilityMaster(input)
  if (!validation.success) return validation
  if (initialStatus !== 'aktif' && initialStatus !== 'nonaktif') {
    return { success: false, error: 'Status awal harus Aktif atau Nonaktif.' }
  }
  const supabase = await createClient()
  const value = validation.data
  const { data, error } = await supabase.rpc('admin_create_facility', {
    p_name: value.name, p_type: value.type, p_location: value.location,
    p_capacity: value.capacity, p_description: value.description, p_status: initialStatus,
  })
  if (error) return rpcFailure(error)
  const id = Number(data?.facility_id)
  if (!validFacilityId(id)) {
    return { success: false, needsReload: true, error: 'Hasil penyimpanan belum dapat dipastikan. Periksa daftar fasilitas sebelum mencoba lagi.' }
  }
  refreshFacilityPages(id)
  return { success: true, facilityId: id }
}

export async function updateFacilityAdminAction(facilityId: number, input: unknown, expectedUpdatedAt: unknown): Promise<FacilityActionResult> {
  await requireAdmin()
  if (!validFacilityId(facilityId) || !validFacilityVersion(expectedUpdatedAt)) {
    return { success: false, error: 'Data fasilitas tidak valid. Muat ulang halaman.' }
  }
  const validation = validateFacilityMaster(input)
  if (!validation.success) return validation
  const value = validation.data
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_update_facility', {
    p_facility_id: facilityId, p_name: value.name, p_type: value.type,
    p_location: value.location, p_capacity: value.capacity,
    p_description: value.description, p_expected_updated_at: expectedUpdatedAt,
  })
  if (error) return rpcFailure(error)
  refreshFacilityPages(facilityId)
  return { success: true, facilityId }
}

export async function setFacilityStatusAction(facilityId: number, status: 'aktif' | 'nonaktif', expectedUpdatedAt?: string | null): Promise<FacilityActionResult> {
  await requireAdmin()
  if (!validFacilityId(facilityId) || !validFacilityVersion(expectedUpdatedAt) || (status !== 'aktif' && status !== 'nonaktif')) {
    return { success: false, error: 'Data fasilitas tidak valid. Muat ulang daftar fasilitas.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_set_facility_status', {
    p_facility_id: facilityId, p_status: status, p_expected_updated_at: expectedUpdatedAt,
  })
  if (error) return rpcFailure(error)
  refreshFacilityPages(facilityId)
  return { success: true, facilityId }
}
