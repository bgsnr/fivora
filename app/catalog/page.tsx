'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react'

import { FACILITY_CAPACITY_NOTE, getFacilityCategory, formatFacilityCapacity } from '@/lib/facility-categories'

import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUserName } from '@/lib/use-current-user-name'
import { createReservationAction } from '@/lib/actions/reservations'
import { getReservationCreationAccessAction } from '@/lib/actions/reservation-access'

type Room = {
  id: number
  name: string
  description: string
  location: string
  capacity: number | null
  status: string
  type: string
}

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
]

const START_TIME_SLOTS = TIME_SLOTS.slice(0, -1)

const CATEGORIES = [
  'Semua',
  'Ruang Kelas',
  'Laboratorium',
  'Aula',
  'Lapangan',
  'Lainnya',
] as const

function getJakartaDateInput(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

function getJakartaMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const hours = Number(
    parts.find((part) => part.type === 'hour')?.value ?? 0
  )

  const minutes = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0
  )

  const seconds = Number(
    parts.find((part) => part.type === 'second')?.value ?? 0
  )

  return (
    hours * 60 +
    minutes +
    seconds / 60 +
    date.getMilliseconds() / 60000
  )
}

function addDaysToDateString(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)

  const date = new Date(Date.UTC(year, month - 1, day + days))

  return date.toISOString().slice(0, 10)
}

function addMonthsToDateString(dateString: string, months: number) {
  const [year, month, day] = dateString.split('-').map(Number)

  const targetMonthIndex = month - 1 + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = targetMonthIndex % 12

  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0)
  ).getUTCDate()

  const targetDay = Math.min(day, lastDayOfTargetMonth)

  return [
    targetYear,
    String(normalizedMonth + 1).padStart(2, '0'),
    String(targetDay).padStart(2, '0'),
  ].join('-')
}

function formatDate(dateString: string) {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) return ''

  return `${day}-${month}-${year}`
}

// Mengubah DD-MM-YYYY menjadi YYYY-MM-DD.
// Mengembalikan string kosong jika format atau tanggalnya tidak valid.
function parseDateInput(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return ''
  }

  const [day, month, year] = value.split('-').map(Number)

  if (year < 1000 || month < 1 || month > 12) {
    return ''
  }

  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return ''
  }

  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function roundUpToNextSlot(minutes: number) {
  return Math.ceil(minutes / 30) * 30
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export default function CatalogPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const userName = useCurrentUserName()

  const [now, setNow] = useState(() => new Date())

  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<string>('Semua')

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const [reservationDate, setReservationDate] = useState('')
  const [dateInputText, setDateInputText] = useState('')
  const [requestedStartTime, setStartTime] = useState('09:00')
  const [requestedEndTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reservationId, setReservationId] =
    useState<string | number | null>(null)

  // Perbarui waktu secara berkala supaya slot besok tetap akurat.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const today = getJakartaDateInput(now)
  const tomorrow = addDaysToDateString(today, 1)
  const minDate = tomorrow
  const maxDate = addMonthsToDateString(today, 2)

  // Slot besok harus memenuhi jeda minimal 24 jam.
  const earliestTomorrowMinutes = roundUpToNextSlot(
    getJakartaMinutes(now)
  )

  const earliestTomorrowTime = minutesToTime(
    earliestTomorrowMinutes
  )

  const availableStartTimes = useMemo(() => {
    if (reservationDate === tomorrow) {
      return START_TIME_SLOTS.filter(
        (time) => time >= earliestTomorrowTime
      )
    }

    return START_TIME_SLOTS
  }, [reservationDate, tomorrow, earliestTomorrowTime])

  // Pilihan jam mengikuti slot yang tersedia tanpa memperbarui state dari effect.
  const startTime =
    availableStartTimes.length === 0 || availableStartTimes.includes(requestedStartTime)
      ? requestedStartTime
      : availableStartTimes[0]

  const availableEndTimes = useMemo(() => {
    return TIME_SLOTS.filter((time) => time > startTime)
  }, [startTime])

  const endTime = availableEndTimes.includes(requestedEndTime)
    ? requestedEndTime
    : availableEndTimes[0] ?? requestedEndTime

  useEffect(() => {
    let cancelled = false

    async function fetchFacilities() {
      try {
        setLoading(true)
        setFetchError(null)

        const { data, error } = await supabase
          .from('facilities')
          .select(
            'id, name, description, location, capacity, status, type'
          )
          .eq('status', 'aktif')
          .order('name', { ascending: true })

        if (error) {
          throw error
        }

        if (cancelled) return

        const mappedRooms: Room[] = (data ?? []).map((item) => ({
          id: Number(item.id),
          name: item.name || 'Fasilitas',
          description:
            item.description ||
            'Fasilitas kampus untuk kegiatan akademik dan nonakademik.',
          location: item.location || 'Lokasi belum diatur',
          capacity: item.capacity == null ? null : Number(item.capacity),
          status: item.status || '',
          type: item.type || 'Lainnya',
        }))

        setRooms(mappedRooms)
      } catch {
        if (!cancelled) {
          setRooms([])
          setFetchError(
            'Gagal memuat fasilitas. Periksa koneksi database lalu coba muat ulang halaman.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchFacilities()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const filteredRooms = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return rooms.filter((room) => {
      const matchesSearch =
        normalized.length === 0 ||
        [room.name, room.description, room.location, room.type]
          .join(' ')
          .toLowerCase()
          .includes(normalized)

      const matchesCategory =
        selectedCategory === 'Semua' ||
        getFacilityCategory(room.type) === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [rooms, search, selectedCategory])

  async function openReservationModal(room: Room) {
    try {
      const access = await getReservationCreationAccessAction()
      if (!access.allowed) {
        router.push(access.redirectTo ?? '/login')
        return
      }
    } catch {
      setFetchError('Akses reservasi gagal diperiksa. Coba lagi.')
      return
    }

    const currentNow = new Date()
    const currentDate = getJakartaDateInput(currentNow)
    const earliestDate = addDaysToDateString(currentDate, 1)

    const currentMinutes = getJakartaMinutes(currentNow)
    const earliestMinutes = roundUpToNextSlot(currentMinutes)

    const firstDateTime =
      earliestMinutes <= 19 * 60 + 30
        ? minutesToTime(earliestMinutes)
        : '09:00'

    setSelectedRoom(room)
    setReservationDate(earliestDate)
    setDateInputText(formatDate(earliestDate))
    setStartTime(firstDateTime)

    const firstEndTime = TIME_SLOTS.find(
      (time) => time > firstDateTime
    )

    setEndTime(firstEndTime ?? '10:00')
    setPurpose('')
    setModalError(null)
    setIsSubmitted(false)
    setReservationId(null)
  }

  function closeReservationModal() {
    if (isSubmitting) return

    setSelectedRoom(null)
    setReservationDate('')
    setDateInputText('')
    setPurpose('')
    setModalError(null)
    setIsSubmitted(false)
    setReservationId(null)
  }

  function handleDateTextChange(value: string) {
    setDateInputText(value)

    const parsedDate = parseDateInput(value)
    setReservationDate(parsedDate)
    setModalError(null)
  }

  async function handleSubmitReservation(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!selectedRoom) return

    setModalError(null)

    // Ambil waktu terbaru saat tombol pengajuan ditekan.
    const submitNow = new Date()
    const submitToday = getJakartaDateInput(submitNow)
    const submitTomorrow = addDaysToDateString(submitToday, 1)
    const submitMaxDate = addMonthsToDateString(submitToday, 2)

    const submitEarliestMinutes = roundUpToNextSlot(
      getJakartaMinutes(submitNow)
    )

    const submitEarliestTime = minutesToTime(
      submitEarliestMinutes
    )

    if (!reservationDate) {
      setModalError(
        dateInputText.trim()
          ? 'Format tanggal tidak valid. Gunakan format DD-MM-YYYY, misalnya 17-10-2026.'
          : 'Tanggal peminjaman wajib dipilih.'
      )
      return
    }

    if (
      reservationDate < submitTomorrow ||
      reservationDate > submitMaxDate
    ) {
      setModalError(
        'Tanggal peminjaman harus mulai besok dan maksimal dua bulan ke depan.'
      )
      return
    }

    if (
      reservationDate === submitTomorrow &&
      startTime < submitEarliestTime
    ) {
      setModalError(
        `Untuk pemesanan besok, jam mulai paling awal adalah ${submitEarliestTime} WIB.`
      )
      return
    }

    if (!START_TIME_SLOTS.includes(startTime)) {
      setModalError(
        'Jam mulai harus antara 07.00 dan 19.30 WIB.'
      )
      return
    }

    if (!TIME_SLOTS.includes(endTime)) {
      setModalError('Pilih jam selesai yang valid.')
      return
    }

    if (startTime >= endTime) {
      setModalError(
        'Jam selesai harus lebih akhir daripada jam mulai.'
      )
      return
    }

    if (!purpose.trim()) {
      setModalError(
        'Keterangan tujuan peminjaman wajib diisi.'
      )
      return
    }

    if (purpose.trim().length < 5) {
      setModalError(
        'Keterangan tujuan peminjaman minimal 5 karakter.'
      )
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createReservationAction({
        facility_id: Number(selectedRoom.id),
        // Supabase tetap menerima format YYYY-MM-DD.
        reservation_date: reservationDate,
        start_time: startTime,
        end_time: endTime,
        purpose: purpose.trim(),
      })

      if (!result.success) {
        setModalError(
          result.error || 'Reservasi gagal diajukan.'
        )
        return
      }

      setReservationId(result.data?.id ?? null)
      setIsSubmitted(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan yang tidak diketahui.'

      setModalError(`Reservasi gagal diajukan: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout userName={userName}>
      <div className="space-y-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            KATALOG FASILITAS
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Temukan Fasilitas Kampus
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
            Pilih fasilitas yang kamu butuhkan, tentukan jadwalnya,
            dan ajukan peminjaman langsung dari katalog.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[var(--muted-foreground)]">
            {FACILITY_CAPACITY_NOTE}
          </p>
        </div>

        {fetchError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{fetchError}</p>
          </div>
        )}

        <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
            <span>Pencarian Fasilitas</span>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-3">
              <Search className="h-4 w-4 shrink-0 text-[var(--primary)]" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama fasilitas, kategori, atau lokasi..."
                className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none"
              />
            </div>
          </label>

          <div>
            <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Kategori Fasilitas
            </p>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            Memuat daftar fasilitas...
          </div>
        ) : filteredRooms.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => (
              <article
                key={room.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div>
                    <span className="inline-flex rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                      {getFacilityCategory(room.type)}
                    </span>

                    <h2 className="mt-3 text-xl font-bold text-[var(--foreground)]">
                      {room.name}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {room.description}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border)]" />

                  <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span>{room.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span>Kapasitas {formatFacilityCapacity(room)}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Bisa dipesan
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openReservationModal(room)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  Reservasi
                  <ChevronRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />

            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {fetchError
                ? 'Daftar fasilitas belum dapat ditampilkan'
                : 'Tidak ada fasilitas yang cocok'}
            </h3>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {fetchError
                ? 'Coba muat ulang halaman setelah koneksi database tersedia.'
                : 'Coba kata kunci lain atau pilih kategori Semua.'}
            </p>

            {!fetchError && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('Semua')
                }}
                className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReservationModal()
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  FORMULIR PEMINJAMAN
                </p>

                <h2
                  id="reservation-modal-title"
                  className="mt-1.5 text-lg font-bold text-[var(--foreground)]"
                >
                  {isSubmitted
                    ? 'Reservasi Berhasil Diajukan'
                    : 'Ajukan Reservasi'}
                </h2>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {selectedRoom.name}
                </p>
              </div>

              {!isSubmitting && (
                <button
                  type="button"
                  onClick={closeReservationModal}
                  aria-label="Tutup pop-up"
                  className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isSubmitted ? (
              <div className="p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <h3 className="mt-4 text-lg font-bold text-[var(--foreground)]">
                  Pengajuan berhasil!
                </h3>

                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Reservasi {selectedRoom.name} untuk tanggal{' '}
                  {formatDate(reservationDate)}, pukul {startTime}–{endTime} WIB
                  telah diajukan. Silakan menunggu persetujuan petugas.
                </p>

                {reservationId !== null && (
                  <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                    Kode reservasi: #{reservationId}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push('/history')}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
                  >
                    Lihat Riwayat
                  </button>

                  <button
                    type="button"
                    onClick={closeReservationModal}
                    className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                  >
                    Kembali ke Katalog
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitReservation}
                className="space-y-4 p-4"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="reservation-date-text"
                    className="block text-sm font-semibold text-[var(--foreground)]"
                  >
                    Tanggal Peminjaman{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                    <input
                      id="reservation-date-text"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="DD-MM-YYYY"
                      maxLength={10}
                      value={dateInputText}
                      onChange={(event) =>
                        handleDateTextChange(event.target.value)
                      }
                      onBlur={() => {
                        if (
                          dateInputText.trim() &&
                          !parseDateInput(dateInputText)
                        ) {
                          setModalError(
                            'Format tanggal tidak valid. Gunakan DD-MM-YYYY, misalnya 17-10-2026.'
                          )
                        }
                      }}
                      required
                      className="w-full min-w-0 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                    />

                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] hover:bg-[var(--muted)]">
                      <CalendarDays className="h-4 w-4" />

                      <input
                        type="date"
                        aria-label="Pilih tanggal peminjaman dari kalender"
                        min={minDate}
                        max={maxDate}
                        value={reservationDate}
                        onChange={(event) => {
                          const value = event.target.value

                          setReservationDate(value)
                          setDateInputText(formatDate(value))
                          setModalError(null)
                        }}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                  </div>

                  <span className="block text-xs leading-5 text-[var(--muted-foreground)]">
                    Gunakan format DD-MM-YYYY. Pemesanan minimal 24 jam sebelumnya dan maksimal dua bulan ke depan.
                  </span>
                </div>

                <div>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Waktu Peminjaman{' '}
                    <span className="text-red-500">*</span>
                  </span>

                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <label className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                        <Clock3 className="h-3.5 w-3.5 text-[var(--primary)]" />
                        Jam Mulai
                      </span>

                      <select
                        value={startTime}
                        onChange={(event) => {
                          const nextStart = event.target.value

                          setStartTime(nextStart)

                          if (endTime <= nextStart) {
                            const nextEnd = TIME_SLOTS.find(
                              (time) => time > nextStart
                            )

                            if (nextEnd) {
                              setEndTime(nextEnd)
                            }
                          }

                          setModalError(null)
                        }}
                        required
                        disabled={availableStartTimes.length === 0}
                        className="mt-1.5 h-10 w-full min-w-0 cursor-pointer rounded-lg bg-[var(--background)] px-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      >
                        {availableStartTimes.map((time) => (
                          <option key={time} value={time}>
                            {time} WIB
                          </option>
                        ))}
                      </select>

                      <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">
                        Mulai penggunaan
                      </span>
                    </label>

                    <label className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                        <Clock3 className="h-3.5 w-3.5 text-[var(--primary)]" />
                        Jam Selesai
                      </span>

                      <select
                        value={endTime}
                        onChange={(event) => {
                          setEndTime(event.target.value)
                          setModalError(null)
                        }}
                        required
                        disabled={availableEndTimes.length === 0}
                        className="mt-1.5 h-10 w-full min-w-0 cursor-pointer rounded-lg bg-[var(--background)] px-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      >
                        {availableEndTimes.map((time) => (
                          <option key={time} value={time}>
                            {time} WIB
                          </option>
                        ))}
                      </select>

                      <span className="mt-1 block text-[10px] text-[var(--muted-foreground)]">
                        Selesai penggunaan
                      </span>
                    </label>
                  </div>

                  {reservationDate === tomorrow &&
                    availableStartTimes.length === 0 && (
                      <p className="mt-2 text-xs text-amber-700">
                        Tidak ada slot tersisa untuk besok. Silakan pilih tanggal berikutnya.
                      </p>
                    )}

                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                    Operasional 07.00–20.00 WIB, interval 30 menit. Jam mulai terakhir 19.30 WIB.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Keperluan / Tujuan Peminjaman{' '}
                    <span className="text-red-500">*</span>
                  </span>

                  <textarea
                    value={purpose}
                    onChange={(event) => {
                      setPurpose(event.target.value)
                      setModalError(null)
                    }}
                    placeholder="Contoh: Untuk rapat organisasi, praktikum, atau seminar..."
                    rows={3}
                    maxLength={1000}
                    required
                    className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--primary)]/30"
                  />

                  <span className="block text-right text-xs text-[var(--muted-foreground)]">
                    {purpose.length}/1000 karakter
                  </span>
                </label>

                {modalError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{modalError}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeReservationModal}
                    disabled={isSubmitting}
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !reservationDate ||
                      availableStartTimes.length === 0 ||
                      availableEndTimes.length === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Mengajukan...' : 'Ajukan Reservasi'}
                    {!isSubmitting && (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
