'use server'

import { getCurrentUser } from '@/lib/auth'
import {
  setFacilityInMaintenance,
  restoreFacilityFromMaintenance,
} from '@/lib/integration'

export interface FacilityMaintenanceState {
  success: boolean
  error?: string
  facilityUpdated?: boolean
  rejectedPendingCount?: number
  cancelledApprovedCount?: number
}

/**
 * Server Action: Petugas menandai fasilitas "dalam perbaikan".
 * Hanya role 'petugas' (AGENTS.md — admin tidak mengelola status perbaikan).
 * Aksi ini juga memproses reservasi aktif yang terdampak (Chapter 12).
 */
export async function markFacilityForMaintenanceAction(
  facilityId: number,
  reason: string
): Promise<FacilityMaintenanceState> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'petugas') {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang menandai fasilitas dalam perbaikan',
      }
    }

    if (!reason || !reason.trim()) {
      return {
        success: false,
        error: 'Alasan perbaikan fasilitas wajib diisi oleh petugas',
      }
    }

    const result = await setFacilityInMaintenance(
      facilityId,
      Number(user.id),
      reason.trim()
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        facilityUpdated: result.facilityUpdated,
      }
    }

    return {
      success: true,
      facilityUpdated: result.facilityUpdated,
      rejectedPendingCount: result.rejectedPendingCount,
      cancelledApprovedCount: result.cancelledApprovedCount,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal menandai fasilitas dalam perbaikan: ${errorMsg}`,
    }
  }
}

/**
 * Server Action: Petugas mengembalikan fasilitas ke status 'aktif'.
 * Berlaku sampai petugas mengaktifkan kembali (AGENTS.md).
 */
export async function restoreFacilityAction(
  facilityId: number
): Promise<FacilityMaintenanceState> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'petugas') {
      return {
        success: false,
        error: 'Hanya petugas yang memiliki wewenang mengaktifkan kembali fasilitas',
      }
    }

    const result = await restoreFacilityFromMaintenance(facilityId)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      error: `Gagal mengaktifkan kembali fasilitas: ${errorMsg}`,
    }
  }
}