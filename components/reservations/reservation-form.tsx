'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  createReservationAction,
  type FacilityOption,
} from '@/lib/actions/reservations'

import { reservationInputSchema } from '@/lib/validations/reservations'
import { Button } from '@/components/ui/button'

import {
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

interface ReservationFormProps {
  facilities: FacilityOption[]
  defaultFacilityId?: number
}

// Slot operasional kelipatan 30 menit (07:00 - 20:00 WIB)
const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
]

export function ReservationForm({
  facilities,
  defaultFacilityId,
}: ReservationFormProps) {
  const router = useRouter()

  const [facilityId, setFacilityId] = useState<string>(
    defaultFacilityId
      ? String(defaultFacilityId)
      : facilities[0]?.id
        ? String(facilities[0].id)
        : ''
  )

  const [reservationDate, setReservationDate] =
    useState<string>(() =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    )

  const [startTime, setStartTime] =
    useState<string>('08:00')

  const [endTime, setEndTime] =
    useState<string>('10:00')

  const [purpose, setPurpose] =
    useState<string>('')

  const [isLoading, setIsLoading] =
    useState<boolean>(false)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  const [successReservationId, setSuccessReservationId] =
    useState<string | number | null>(null)

  // Tanggal minimal pengajuan adalah hari ini
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  const selectedFacility = facilities.find(
    (f) => String(f.id) === facilityId
  )

  // Validasi inline real-time sebelum submit
  const inlineErrors: string[] = []

  if (!facilityId) {
    inlineErrors.push('Pilih fasilitas terlebih dahulu.')
  }

  if (!reservationDate) {
    inlineErrors.push('Tanggal penggunaan wajib diisi.')
  }

  if (startTime >= endTime) {
    inlineErrors.push(
      'Waktu selesai harus lebih besar dari waktu mulai.'
    )
  }

  if (!purpose.trim()) {
    inlineErrors.push(
      'Tujuan penggunaan wajib diisi.'
    )
  }

  const isFormInvalid = inlineErrors.length > 0

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault()

    setErrorMessage(null)

    // Validasi Client-Side menggunakan skema Zod yang sama dengan server
    const clientValidation =
      reservationInputSchema.safeParse({
        facilityId: facilityId
          ? Number(facilityId)
          : '',
        reservationDate,
        startTime,
        endTime,
        purpose: purpose.trim(),
      })

    if (!clientValidation.success) {
      const firstIssue =
        clientValidation.error.issues[0]

      setErrorMessage(
        firstIssue?.message ||
          'Data formulir tidak valid.'
      )

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
        setErrorMessage(
          result.error ||
            'Gagal mengajukan reservasi.'
        )

        setIsLoading(false)
        return
      }

      if (result.data) {
        setSuccessReservationId(result.data.id)
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : String(err)

      setErrorMessage(
        `Terjadi kesalahan teknis: ${msg}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (successReservationId) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-[#010736]">
          Pengajuan Reservasi Berhasil
        </h2>

        <p className="mt-2 text-sm text-[#52627D]">
          Reservasi Anda telah tercatat dengan status{' '}
          <strong>Menunggu Konfirmasi</strong>. Petugas akan
          memproses antrean pengajuan Anda.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={`/reservations/${successReservationId}`}
            className="w-full sm:w-auto"
          >
            <Button className="w-full bg-[#010736] text-white hover:bg-[#0D1C42] sm:w-auto">
              Lihat Detail Pengajuan
            </Button>
          </a>

          <a
            href="/reservations"
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="w-full border-[#D8DFEA] text-[#010736] hover:bg-[#F8FAFC] sm:w-auto"
            >
              Buka Riwayat Reservasi
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-[#D8DFEA] bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#010736]">
          Form Pengajuan Reservasi Fasilitas
        </h1>

        <p className="mt-1 text-sm text-[#52627D]">
          Jam operasional reservasi: 07:00 sampai 20:00 WIB.
          Setiap slot berdurasi 30 menit.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Pengajuan Belum Dapat Diproses
            </p>

            <p className="mt-0.5">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Pilihan Fasilitas */}
      <div className="space-y-2">
        <label
          htmlFor="facility"
          className="block text-sm font-semibold text-[#010736]"
        >
          Pilih Fasilitas Kampus
        </label>

        <select
          id="facility"
          value={facilityId}
          onChange={(e) =>
            setFacilityId(e.target.value)
          }
          className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3.5 py-2.5 text-sm text-[#010736] focus:border-[#22396F] focus:outline-none focus:ring-1 focus:ring-[#22396F]"
          required
        >
          {facilities.map((fac) => (
            <option
              key={fac.id}
              value={fac.id}
              disabled={fac.status !== 'aktif'}
            >
              {fac.name} ({fac.location}){' '}
              {fac.status !== 'aktif'
                ? `[${fac.status}]`
                : ''}
            </option>
          ))}
        </select>

        {selectedFacility &&
          selectedFacility.status !== 'aktif' && (
            <p className="font-medium text-xs text-amber-700">
              Perhatian: Fasilitas ini sedang dalam
              status {selectedFacility.status}.
            </p>
          )}
      </div>

      {/* Tanggal Reservasi */}
      <div className="space-y-2">
        <label
          htmlFor="reservationDate"
          className="block text-sm font-semibold text-[#010736]"
        >
          Tanggal Penggunaan
        </label>

        <div className="relative">
          <input
            id="reservationDate"
            type="date"
            min={todayStr}
            value={reservationDate}
            onChange={(e) =>
              setReservationDate(e.target.value)
            }
            className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3.5 py-2.5 text-sm text-[#010736] focus:border-[#22396F] focus:outline-none focus:ring-1 focus:ring-[#22396F]"
            required
          />
        </div>

        <p className="text-xs text-[#52627D]">
          Reservasi hanya berlaku pada hari yang sama
          (tidak lintas tanggal).
        </p>
      </div>

      {/* Rentang Waktu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="startTime"
            className="block text-sm font-semibold text-[#010736]"
          >
            Waktu Mulai (WIB)
          </label>

          <select
            id="startTime"
            value={startTime}
            onChange={(e) =>
              setStartTime(e.target.value)
            }
            className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3.5 py-2.5 text-sm text-[#010736] focus:border-[#22396F] focus:outline-none focus:ring-1 focus:ring-[#22396F]"
            required
          >
            {TIME_SLOTS.slice(0, -1).map((time) => (
              <option
                key={`start-${time}`}
                value={time}
              >
                {time} WIB
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="endTime"
            className="block text-sm font-semibold text-[#010736]"
          >
            Waktu Selesai (WIB)
          </label>

          <select
            id="endTime"
            value={endTime}
            onChange={(e) =>
              setEndTime(e.target.value)
            }
            className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3.5 py-2.5 text-sm text-[#010736] focus:border-[#22396F] focus:outline-none focus:ring-1 focus:ring-[#22396F]"
            required
          >
            {TIME_SLOTS.slice(1).map((time) => (
              <option
                key={`end-${time}`}
                value={time}
              >
                {time} WIB
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tujuan Penggunaan */}
      <div className="space-y-2">
        <label
          htmlFor="purpose"
          className="block text-sm font-semibold text-[#010736]"
        >
          Tujuan Penggunaan Fasilitas
        </label>

        <textarea
          id="purpose"
          rows={3}
          value={purpose}
          onChange={(e) =>
            setPurpose(e.target.value)
          }
          placeholder="Contoh: Kuliah Pengganti Mata Kuliah PPK, Praktikum Mandiri, Rapat Ormawa..."
          className="w-full rounded-xl border border-[#D8DFEA] bg-white px-3.5 py-2.5 text-sm text-[#010736] placeholder:text-[#718097] focus:border-[#22396F] focus:outline-none focus:ring-1 focus:ring-[#22396F]"
          required
        />
      </div>

      {/* Validasi Inline */}
      {isFormInvalid && (
        <ul className="list-disc space-y-1 rounded-xl border border-red-200 bg-red-50/70 p-4 pl-8 text-xs text-red-700">
          {inlineErrors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}

      {/* Informasi Ketentuan Pembatalan */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

        <div>
          <span className="font-semibold text-amber-950">
            Ketentuan Pembatalan:
          </span>{' '}
          Reservasi hanya dapat dibatalkan oleh pemesan
          paling lambat <strong>3 jam sebelum</strong>{' '}
          waktu mulai reservasi. Perubahan jadwal dilakukan
          dengan membatalkan pengajuan lama dan membuat
          pengajuan baru.
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="border-[#D8DFEA] text-[#010736] hover:bg-[#F8FAFC]"
        >
          Batal
        </Button>

        <Button
          type="submit"
          disabled={isLoading || isFormInvalid}
          className="min-w-[140px] bg-[#010736] text-white hover:bg-[#0D1C42] disabled:opacity-60"
        >
          {isLoading
            ? 'Memproses...'
            : 'Kirim Pengajuan'}
        </Button>
      </div>
    </form>
  )
}