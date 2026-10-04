'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelReservationByUserAction } from '@/lib/actions/reservations'
import { formatMinutesRemaining } from '@/lib/validations/reservation-time'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface CancelReservationButtonProps {
  reservationId: number
  /** Alasan pembatalan tidak diperbolehkan; tombol dinonaktifkan bila diisi. */
  disabledReason?: string | null
  /** Sisa waktu (menit) sebelum waktu mulai reservasi. */
  minutesUntilStart?: number | null
}

export function CancelReservationButton({
  reservationId,
  disabledReason = null,
  minutesUntilStart = null,
}: CancelReservationButtonProps) {
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isBlocked = Boolean(disabledReason)

  async function handleConfirmCancel() {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await cancelReservationByUserAction(
        reservationId,
        reason.trim() || 'Dibatalkan oleh pemesan'
      )

      if (!res.success) {
        setErrorMessage(
          res.error || 'Gagal membatalkan reservasi.'
        )
        setIsLoading(false)
        return
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err)

      setErrorMessage(`Terjadi kesalahan: ${msg}`)
      setIsLoading(false)
    }
  }

  return (
    <>
      {isBlocked && (
        <p
          className="max-w-xs text-xs text-amber-800"
          title={disabledReason ?? undefined}
        >
          {disabledReason}
        </p>
      )}

      <span title={disabledReason ?? undefined}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={isBlocked}
          className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          Batalkan Reservasi
        </Button>
      </span>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010736]/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#D8DFEA] bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <h3 className="text-lg font-bold text-[#010736]">
                Batalkan Reservasi?
              </h3>
            </div>

            <p className="text-sm text-[#52627D]">
              Apakah Anda yakin ingin membatalkan reservasi ini?
              Slot waktu akan dilepaskan dan pengajuan tidak dapat
              diaktifkan kembali.
            </p>

            {typeof minutesUntilStart === 'number' &&
              minutesUntilStart > 0 && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Sisa waktu untuk membatalkan:{' '}
                  <strong>
                    {formatMinutesRemaining(minutesUntilStart)}
                  </strong>{' '}
                  sebelum waktu mulai. Batas pembatalan paling
                  lambat 3 jam sebelum waktu mulai.
                </div>
              )}

            {errorMessage && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {errorMessage}
              </div>
            )}

            <div className="mt-4 space-y-1.5">
              <label
                htmlFor="cancelReason"
                className="block text-xs font-semibold text-[#010736]"
              >
                Alasan Pembatalan (Opsional)
              </label>

              <textarea
                id="cancelReason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Perubahan jadwal kegiatan, pembatalan agenda..."
                className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3 py-2 text-xs text-[#010736] placeholder:text-[#718097] focus:border-[#22396F] focus:outline-none focus:ring-2 focus:ring-[#22396F]/20"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="border-[#D8DFEA] text-[#010736] hover:bg-[#F8FAFC]"
              >
                Kembali
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isLoading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isLoading ? 'Membatalkan...' : 'Ya, Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}