'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  markFacilityForMaintenanceAction,
  restoreFacilityAction,
} from '@/lib/actions/facilities'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Power,
} from 'lucide-react'

interface MaintenanceFormProps {
  facilityId: number
  currentStatus: string
  upcomingActiveCount: number
}

export function MaintenanceForm({
  facilityId,
  currentStatus,
  upcomingActiveCount,
}: MaintenanceFormProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const [showMarkModal, setShowMarkModal] = useState(false)
  const [reason, setReason] = useState('')

  const isInMaintenance = currentStatus === 'dalam_perbaikan'

  async function handleConfirmMark() {
    if (!reason.trim()) {
      setErrorMessage('Alasan penandaan fasilitas wajib diisi.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await markFacilityForMaintenanceAction(
        facilityId,
        reason.trim()
      )

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menandai fasilitas.')
        setIsLoading(false)
        return
      }

      setShowMarkModal(false)

      const pendingText =
        res.rejectedPendingCount && res.rejectedPendingCount > 0
          ? ` ${res.rejectedPendingCount} pengajuan menunggu dibatalkan (fasilitas dalam perbaikan).`
          : ''
      const approvedText =
        res.cancelledApprovedCount && res.cancelledApprovedCount > 0
          ? ` ${res.cancelledApprovedCount} reservasi disetujui dibatalkan petugas.`
          : ''

      setSuccessNotice(
        `Fasilitas berhasil ditandai dalam perbaikan.${pendingText}${approvedText}`
      )
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Terjadi kesalahan sistem: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRestore() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await restoreFacilityAction(facilityId)

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal mengaktifkan kembali fasilitas.')
        setIsLoading(false)
        return
      }

      setSuccessNotice(
        'Fasilitas kembali aktif dan dapat menerima reservasi baru.'
      )
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Terjadi kesalahan sistem: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {successNotice && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          <p>{successNotice}</p>
        </div>
      )}

      {isInMaintenance ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-2.5">
            <Wrench className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Fasilitas Sedang Dalam Perbaikan
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                Fasilitas ini tidak menerima pengajuan atau persetujuan baru
                sampai petugas mengaktifkannya kembali.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleRestore}
            disabled={isLoading}
            className="mt-4 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Power className="h-4 w-4 mr-1.5" />
            {isLoading ? 'Menyimpan...' : 'Aktifkan Kembali Fasilitas'}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5">
          <div className="flex items-start gap-2.5">
            <Wrench className="h-5 w-5 text-[#5318eb] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#0c021c]">
                Kelola Status Perbaikan Fasilitas
              </h3>
              <p className="text-xs text-[#4a454d] mt-1">
                Tandai fasilitas dalam perbaikan berdasarkan laporan kerusakan
                yang ditangani. Sistem akan menolak pengajuan{' '}
                <strong>menunggu</strong> serta membatalkan reservasi{' '}
                <strong>disetujui</strong> yang terdampak.
              </p>
              {upcomingActiveCount > 0 && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-amber-700" />
                  Terdapat <strong>{upcomingActiveCount}</strong> reservasi
                  mendatang berstatus menunggu/disetujui pada fasilitas ini.
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setErrorMessage(null)
              setShowMarkModal(true)
            }}
            disabled={isLoading}
            className="mt-4 bg-[#5318eb] text-white hover:bg-[#4413c4]"
          >
            <Wrench className="h-4 w-4 mr-1.5" />
            Tandai Dalam Perbaikan
          </Button>
        </div>
      )}

      {/* Modal Tandai Perbaikan */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border">
            <div className="flex items-center gap-2.5 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-bold text-[#0c021c]">
                Tandai Fasilitas Dalam Perbaikan
              </h3>
            </div>
            <p className="text-xs text-[#4a454d]">
              Gunakan fitur ini jika fasilitas dilaporkan rusak dan perlu
              perbaikan. Semua pengajuan <strong>menunggu</strong> mendatang
              ditolak, dan reservasi <strong>disetujui</strong> yang belum
              berakhir dibatalkan dengan alasan ini.
            </p>

            <div className="mt-4 space-y-1.5">
              <label
                htmlFor="maintenanceReason"
                className="block text-xs font-semibold text-[#0c021c]"
              >
                Alasan Perbaikan (Wajib)
              </label>
              <textarea
                id="maintenanceReason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: AC laboratorium mati total, atap aula bocor saat hujan..."
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-[#0c021c] focus:border-[#5318eb] focus:outline-none"
                required
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMarkModal(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmMark}
                disabled={isLoading}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                {isLoading ? 'Menyimpan...' : 'Konfirmasi Perbaikan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}