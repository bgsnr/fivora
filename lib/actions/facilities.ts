'use server'

import { getCurrentUser } from '@/lib/auth'

export interface FacilityMaintenanceState {
  success: boolean
  error?: string
  facilityUpdated?: boolean
  rejectedPendingCount?: number
  cancelledApprovedCount?: number
}

export async function markFacilityForMaintenanceAction(
  facilityId: number,
  reason: string
): Promise<FacilityMaintenanceState> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'petugas' || user.status !== 'aktif') {
    return {
      success: false,
      error: 'Hanya petugas aktif yang dapat mengelola perbaikan.',
    }
  }

  if (
    !Number.isSafeInteger(facilityId) ||
    facilityId <= 0 ||
    typeof reason !== 'string'
  ) {
    return { success: false, error: 'Data perbaikan tidak valid.' }
  }

  return {
    success: false,
    error:
      'Buka detail laporan berstatus Diproses untuk memulai perbaikan fasilitas.',
  }
}

export async function restoreFacilityAction(
  facilityId: number
): Promise<FacilityMaintenanceState> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'petugas' || user.status !== 'aktif') {
    return {
      success: false,
      error: 'Hanya petugas aktif yang dapat mengelola perbaikan.',
    }
  }

  if (!Number.isSafeInteger(facilityId) || facilityId <= 0) {
    return { success: false, error: 'ID fasilitas tidak valid.' }
  }

  return {
    success: false,
    error:
      'Buka detail laporan terkait untuk menyelesaikan kegiatan perbaikan.',
  }
}