'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock3, MapPin, Plus, Eye } from 'lucide-react'

import { AppLayout } from '@/components/layout/app-layout'
import { getOwnReservationHistory } from '@/lib/actions/live-data'
import { useAutoRefresh, canApplyRefresh } from '@/lib/use-auto-refresh'

type ReservationStatus =
  | 'Menunggu'
  | 'Disetujui'
  | 'Ditolak'
  | 'Dibatalkan'

type StatusFilter = 'Semua' | ReservationStatus

type ReservationHistoryItem = {
  id: number
  roomName: string
  location: string
  date: string
  time: string
  status: ReservationStatus
}

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Menunggu', value: 'Menunggu' },
  { label: 'Disetujui', value: 'Disetujui' },
  { label: 'Ditolak', value: 'Ditolak' },
  { label: 'Dibatalkan', value: 'Dibatalkan' },
]

function normalizeStatus(status: string | null): ReservationStatus {
  const value = (status || 'menunggu').toLowerCase().trim()

  if (
    [
      'menunggu',
      'menunggu persetujuan',
      'menunggu_persetujuan',
      'pending',
      'pending_approval',
    ].includes(value)
  ) {
    return 'Menunggu'
  }

  if (['disetujui', 'approved'].includes(value)) {
    return 'Disetujui'
  }

  if (['ditolak', 'rejected'].includes(value)) {
    return 'Ditolak'
  }

  if (['dibatalkan', 'cancelled', 'canceled'].includes(value)) {
    return 'Dibatalkan'
  }

  return 'Menunggu'
}

function formatDate(dateString: string) {
  if (!dateString) return '-'

  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) return dateString

  return `${day}-${month}-${year}`
}

function formatTime(timeString: string | null) {
  if (!timeString) return '00:00'

  return timeString.slice(0, 5)
}

function getStatusStyle(status: ReservationStatus) {
  switch (status) {
    case 'Disetujui':
      return 'bg-emerald-100 text-emerald-700'
    case 'Ditolak':
      return 'bg-red-100 text-red-700'
    case 'Dibatalkan':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-amber-100 text-amber-700'
  }
}

export default function ReservationHistoryPage() {
  const router = useRouter()

  const [reservations, setReservations] = useState<
    ReservationHistoryItem[]
  >([])
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState('')
  const [userName, setUserName] = useState('Pengguna')
  const [selectedStatus, setSelectedStatus] =
    useState<StatusFilter>('Semua')

  useAutoRefresh(async (signal, automatic) => {
    try {
      const result = await getOwnReservationHistory()
      if (!canApplyRefresh(signal, automatic)) return
      if (!result.success) {
        if (result.unauthorized) {
          setReservations([])
          router.replace('/login?redirect=%2Fhistory')
        } else setReadError(result.error)
        return
      }
      setUserName(result.userName || 'Pengguna')
      setReservations(result.reservations.map((item) => ({
        id: Number(item.id),
        roomName: item.facility?.name || 'Fasilitas',
        location: item.facility?.location || 'Lokasi belum diatur',
        date: item.reservation_date || '',
        time: `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
        status: normalizeStatus(item.status),
      })))
      setReadError('')
    } catch {
      if (canApplyRefresh(signal, automatic)) setReadError('Riwayat reservasi gagal dimuat. Coba lagi.')
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, { immediate: true })

  const filteredReservations =
    selectedStatus === 'Semua'
      ? reservations
      : reservations.filter(
          (item) => item.status === selectedStatus,
        )

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'Semua') return reservations.length

    return reservations.filter(
      (item) => item.status === status,
    ).length
  }

  return (
    <AppLayout userName={userName}>
      <div className="space-y-6">
        {readError && <p role="alert" className="text-sm text-red-700">{readError}</p>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              RIWAYAT RESERVASI
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Reservasi Saya
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push('/catalog')}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Buat Reservasi Baru
          </button>
        </div>

        {/* Filter status */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Filter Status
          </h2>

          <div
            className="flex flex-nowrap gap-2 overflow-x-auto pb-1"
            aria-label="Filter status reservasi"
          >
            {statusFilters.map(({ label, value }) => {
              const isSelected = selectedStatus === value

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedStatus(value)}
                  aria-pressed={isSelected}
                  className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {label}

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isSelected ? 'bg-white/20' : 'bg-[var(--muted)]'
                    }`}
                  >
                    {getStatusCount(value)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            Memuat riwayat reservasi...
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-9 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--foreground)]">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Anda belum pernah reservasi ruang
              </h2>

              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                Riwayat reservasi Anda akan muncul di sini.
              </p>

              <button
                type="button"
                onClick={() => router.push('/catalog')}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
              >
                Mulai Reservasi
              </button>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <h2 className="font-semibold text-[var(--foreground)]">
              Tidak ada reservasi dengan status ini
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Coba pilih filter status yang lain.
            </p>

            <button
              type="button"
              onClick={() => setSelectedStatus('Semua')}
              className="mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Tampilkan Semua
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[var(--foreground)]">
                <thead className="bg-[var(--muted)] text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Ruangan
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Lokasi
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Tanggal
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Waktu
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReservations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[var(--border)]"
                    >
                      <td className="px-5 py-4 font-medium text-[var(--foreground)]">
                        {item.roomName}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          {item.location}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 whitespace-nowrap text-[var(--muted-foreground)]">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          {formatDate(item.date)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 whitespace-nowrap text-[var(--muted-foreground)]">
                          <Clock3 className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          {item.time}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/reservations/${item.id}`)
                          }
                          className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}