'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveReservationAction,
  rejectReservationAction,
  cancelReservationByStaffAction,
} from '@/lib/actions/reservations'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle, AlertCircle } from 'lucide-react'

interface StaffActionPanelProps {
  reservationId: number
  currentStatus: string
  isExpired: boolean
}

export function StaffActionPanel({
  reservationId,
  currentStatus,
  isExpired,
}: StaffActionPanelProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  // Dialog states
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  async function handleApprove() {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessNotice(null)

    try {
      const res = await approveReservationAction(reservationId)

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menyetujui reservasi.')
        setIsLoading(false)
        router.refresh()
        return
      }

      const autoRejectedText =
        res.autoRejectedCount && res.autoRejectedCount > 0
          ? ` (${res.autoRejectedCount} pengajuan pending lain yang bentrok otomatis ditolak)`
          : ''

      setSuccessNotice(`Reservasi berhasil disetujui!${autoRejectedText}`)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Terjadi kesalahan sistem: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmReject() {
    if (!rejectReason.trim()) {
      setErrorMessage('Alasan penolakan wajib diisi.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await rejectReservationAction(reservationId, rejectReason.trim())

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal menolak reservasi.')
        setIsLoading(false)
        return
      }

      setShowRejectModal(false)
      setSuccessNotice('Pengajuan reservasi telah ditolak.')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Terjadi kesalahan sistem: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmEmergencyCancel() {
    if (!cancelReason.trim()) {
      setErrorMessage('Alasan pembatalan darurat wajib diisi.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await cancelReservationByStaffAction(reservationId, cancelReason.trim())

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal membatalkan reservasi.')
        setIsLoading(false)
        return
      }

      setShowCancelModal(false)
      setSuccessNotice('Reservasi telah dibatalkan darurat oleh petugas.')
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

      {isExpired && currentStatus === 'menunggu' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <strong>Pemberitahuan Waktu:</strong> Waktu mulai reservasi ini telah terlewati. Sistem akan otomatis menolak pengajuan ini jika tombol Setujui ditekan.
          </p>
        </div>
      )}

      {/* Aksi untuk Status Menunggu */}
      {currentStatus === 'menunggu' && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isLoading}
            className="bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isLoading ? 'Memproses...' : 'Setujui Pengajuan'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorMessage(null)
              setShowRejectModal(true)
            }}
            disabled={isLoading}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Tolak Pengajuan
          </Button>
        </div>
      )}

      {/* Aksi untuk Status Disetujui (Cancel Darurat Petugas - Chapter 11) */}
      {currentStatus === 'disetujui' && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setErrorMessage(null)
              setShowCancelModal(true)
            }}
            disabled={isLoading}
            className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Pembatalan Darurat oleh Petugas
          </Button>
        </div>
      )}

      {/* Modal Tolak Pengajuan */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border">
            <h3 className="text-lg font-bold text-[#0c021c]">
              Tolak Pengajuan Reservasi
            </h3>
            <p className="text-xs text-[#4a454d] mt-1">
              Alasan penolakan wajib dicantumkan agar pemohon mengetahui alasan jadwal tidak dapat disetujui.
            </p>

            <div className="mt-4 space-y-1.5">
              <label htmlFor="rejectReason" className="block text-xs font-semibold text-[#0c021c]">
                Alasan Penolakan (Wajib)
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Jadwal bertabrakan dengan kegiatan universitas, ruangan dialihkan untuk ujian..."
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-[#0c021c] focus:border-[#5318eb] focus:outline-none"
                required
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmReject}
                disabled={isLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isLoading ? 'Menyimpan...' : 'Tolak Reservasi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancel Darurat Petugas */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-border">
            <div className="flex items-center gap-2.5 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-bold text-[#0c021c]">
                Pembatalan Darurat Fasilitas
              </h3>
            </div>
            <p className="text-xs text-[#4a454d]">
              Gunakan fitur ini jika fasilitas mendadak mengalami kerusakan atau kendala operasional tak terduga. Alasan pembatalan wajib dicatat.
            </p>

            <div className="mt-4 space-y-1.5">
              <label htmlFor="cancelEmergencyReason" className="block text-xs font-semibold text-[#0c021c]">
                Alasan Pembatalan Darurat (Wajib)
              </label>
              <textarea
                id="cancelEmergencyReason"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Terjadi kebocoran atap ruang kelas, AC laboratorium mati total..."
                className="w-full rounded-xl border border-border px-3 py-2 text-xs text-[#0c021c] focus:border-[#5318eb] focus:outline-none"
                required
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isLoading}
              >
                Kembali
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmEmergencyCancel}
                disabled={isLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isLoading ? 'Membatalkan...' : 'Eksekusi Pembatalan Darurat'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
