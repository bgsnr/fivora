'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createReservationAction,
  type FacilityOption,
} from '@/lib/actions/reservations'
import { reservationInputSchema } from '@/lib/validations/reservations'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

interface ReservationFormProps {
  facilities: FacilityOption[]
  defaultFacilityId?: number
}

// Slot operasional kelipatan 30 menit (07:00 - 20:00 WIB)
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
]

export function ReservationForm({
  facilities,
  defaultFacilityId,
}: ReservationFormProps) {
  const router = useRouter()

  const [facilityId, setFacilityId] = useState<string>(
    defaultFacilityId ? String(defaultFacilityId) : (facilities[0]?.id ? String(facilities[0].id) : '')
  )
  const [reservationDate, setReservationDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('08:00')
  const [endTime, setEndTime] = useState<string>('10:00')
  const [purpose, setPurpose] = useState<string>('')

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successReservationId, setSuccessReservationId] = useState<string | number | null>(null)

  // Tanggal minimal pengajuan adalah hari ini
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const selectedFacility = facilities.find((f) => String(f.id) === facilityId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage(null)

    // 1. Validasi Client-Side menggunakan skema Zod yang sama dengan server (Chapter 6)
    const clientValidation = reservationInputSchema.safeParse({
      facilityId: facilityId ? Number(facilityId) : '',
      reservationDate,
      startTime,
      endTime,
      purpose: purpose.trim(),
    })

    if (!clientValidation.success) {
      const firstIssue = clientValidation.error.issues[0]
      setErrorMessage(firstIssue?.message || 'Data formulir tidak valid.')
      return
    }

    setIsLoading(true)

    try {
      const result = await createReservationAction({
        facility_id: Number(facilityId),
        reservation_date: reservationDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim(),
      })

      if (!result.success) {
        setErrorMessage(result.error || 'Gagal mengajukan reservasi.')
        setIsLoading(false)
        return
      }

      if (result.data) {
        setSuccessReservationId(result.data.id)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(`Terjadi kesalahan teknis: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (successReservationId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center max-w-xl mx-auto shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#0c021c] tracking-tight">
          Pengajuan Reservasi Berhasil
        </h2>
        <p className="mt-2 text-sm text-[#4a454d]">
          Reservasi Anda telah tercatat dengan status <strong>Menunggu Konfirmasi</strong>. Petugas akan memproses antrean pengajuan Anda.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={`/reservasi/${successReservationId}`}>
            <Button className="w-full sm:w-auto bg-[#5318eb] text-white hover:bg-[#4312c4]">
              Lihat Detail Pengajuan
            </Button>
          </Link>
          <Link href="/reservasi">
            <Button variant="outline" className="w-full sm:w-auto">
              Buka Riwayat Reservasi
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-[#0c021c] tracking-tight">
          Form Pengajuan Reservasi Fasilitas
        </h1>
        <p className="text-sm text-[#4a454d] mt-1">
          Jam operasional reservasi: 07:00 sampai 20:00 WIB. Setiap slot berdurasi 30 menit.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Pengajuan Belum Dapat Diproses</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Pilihan Fasilitas */}
      <div className="space-y-2">
        <label htmlFor="facility" className="block text-sm font-semibold text-[#0c021c]">
          Pilih Fasilitas Kampus
        </label>
        <select
          id="facility"
          value={facilityId}
          onChange={(e) => setFacilityId(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-[#0c021c] focus:border-[#5318eb] focus:outline-none focus:ring-1 focus:ring-[#5318eb]"
          required
        >
          {facilities.map((fac) => (
            <option
              key={fac.id}
              value={fac.id}
              disabled={fac.status !== 'aktif'}
            >
              {fac.name} ({fac.location}) {fac.status !== 'aktif' ? `[${fac.status}]` : ''}
            </option>
          ))}
        </select>
        {selectedFacility && selectedFacility.status !== 'aktif' && (
          <p className="text-xs text-amber-700 font-medium">
            Perhatian: Fasilitas ini sedang dalam status {selectedFacility.status}.
          </p>
        )}
      </div>

      {/* Tanggal Reservasi */}
      <div className="space-y-2">
        <label htmlFor="reservationDate" className="block text-sm font-semibold text-[#0c021c]">
          Tanggal Penggunaan
        </label>
        <div className="relative">
          <input
            id="reservationDate"
            type="date"
            min={todayStr}
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-[#0c021c] focus:border-[#5318eb] focus:outline-none focus:ring-1 focus:ring-[#5318eb]"
            required
          />
        </div>
        <p className="text-xs text-[#4a454d]">
          Reservasi hanya berlaku pada hari yang sama (tidak lintas tanggal).
        </p>
      </div>

      {/* Rentang Waktu (Kelipatan 30 Menit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startTime" className="block text-sm font-semibold text-[#0c021c]">
            Waktu Mulai (WIB)
          </label>
          <select
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-[#0c021c] focus:border-[#5318eb] focus:outline-none focus:ring-1 focus:ring-[#5318eb]"
            required
          >
            {TIME_SLOTS.slice(0, -1).map((time) => (
              <option key={`start-${time}`} value={time}>
                {time} WIB
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="endTime" className="block text-sm font-semibold text-[#0c021c]">
            Waktu Selesai (WIB)
          </label>
          <select
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-[#0c021c] focus:border-[#5318eb] focus:outline-none focus:ring-1 focus:ring-[#5318eb]"
            required
          >
            {TIME_SLOTS.slice(1).map((time) => (
              <option key={`end-${time}`} value={time}>
                {time} WIB
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tujuan Penggunaan */}
      <div className="space-y-2">
        <label htmlFor="purpose" className="block text-sm font-semibold text-[#0c021c]">
          Tujuan Penggunaan Fasilitas
        </label>
        <textarea
          id="purpose"
          rows={3}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Contoh: Kuliah Pengganti Mata Kuliah PPK, Praktikum Mandiri, Rapat Ormawa..."
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-[#0c021c] focus:border-[#5318eb] focus:outline-none focus:ring-1 focus:ring-[#5318eb]"
          required
        />
      </div>

      {/* Informasi Ketentuan Pembatalan (Aturan 3 Jam) */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-950">Ketentuan Pembatalan:</span>{' '}
          Reservasi hanya dapat dibatalkan oleh pemesan paling lambat <strong>3 jam sebelum</strong> waktu mulai reservasi. Perubahan jadwal dilakukan dengan membatalkan pengajuan lama dan membuat pengajuan baru.
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#5318eb] text-white hover:bg-[#4312c4] min-w-[140px]"
        >
          {isLoading ? 'Memproses...' : 'Kirim Pengajuan'}
        </Button>
      </div>
    </form>
  )
}
