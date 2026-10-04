'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Users,
} from 'lucide-react'

import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/client'
import { useCurrentUserName } from '@/lib/use-current-user-name'

type Room = {
  id: number
  name: string
  description: string
  location: string
  capacity: number
  status: string
}

const fallbackRooms: Room[] = [
  {
    id: 1,
    name: 'Ruang Kelas A101',
    description: 'Ruang kelas nyaman untuk perkuliahan dan diskusi kelompok.',
    location: 'Gedung A, Lantai 1',
    capacity: 40,
    status: 'aktif',
  },
  {
    id: 2,
    name: 'Laboratorium Komputer 1',
    description: 'Laboratorium komputer lengkap dengan 30 PC workstation.',
    location: 'Gedung C Lt. 2',
    capacity: 30,
    status: 'aktif',
  },
  {
    id: 3,
    name: 'Aula Gedung B',
    description: 'Aula serbaguna dengan panggung dan sound system.',
    location: 'Gedung B Lt. 3',
    capacity: 200,
    status: 'aktif',
  },
]

function getLocalDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function getLocalTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5)
}

export default function CatalogPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateInput(new Date()))
  const [selectedTime, setSelectedTime] = useState(() => getLocalTimeInput(new Date()))
  const [search, setSearch] = useState('')
  const [rooms, setRooms] = useState<Room[]>(fallbackRooms)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userName = useCurrentUserName()

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('facilities')
          .select('id, name, description, location, capacity, status')
          .neq('status', 'nonaktif')
          .order('name', { ascending: true })

        if (fetchError) {
          setError('Gagal memuat data fasilitas dari database.')
          setRooms(fallbackRooms)
          return
        }

        const mappedRooms = (data ?? []).map((item) => ({
          id: Number(item.id),
          name: item.name || 'Fasilitas',
          description: item.description || 'Fasilitas kampus untuk kebutuhan reservasi.',
          location: item.location || 'Lokasi belum diatur',
          capacity: Number(item.capacity ?? 0),
          status: item.status || 'aktif',
        }))

        setRooms(mappedRooms.length > 0 ? mappedRooms : fallbackRooms)
        setError(null)
      } catch {
        setError('Koneksi database tidak tersedia saat ini.')
        setRooms(fallbackRooms)
      } finally {
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [supabase])

  const filteredRooms = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return rooms.filter((room) => {
      const matchesSearch =
        normalized.length === 0 ||
        [room.name, room.description, room.location]
          .join(' ')
          .toLowerCase()
          .includes(normalized)

      return matchesSearch
    })
  }, [rooms, search])

  const handleReserve = (room: Room) => {
    const payload = {
      ...room,
      date: selectedDate,
      time: selectedTime,
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('fivora-selected-room', JSON.stringify(payload))
    }

    const params = new URLSearchParams({
      room: encodeURIComponent(JSON.stringify(room)),
      date: selectedDate,
      time: selectedTime,
    })

    router.push(`/reservations?${params.toString()}`)
  }

  return (
    <AppLayout userName={userName}>
      <div className="space-y-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            KATALOG RUANG
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Cari ruang yang siap digunakan
          </h1>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              <span>Tanggal</span>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              <span>Waktu</span>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <Clock3 className="h-4 w-4 text-[var(--primary)]" />
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
              <span>Pencarian</span>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <Search className="h-4 w-4 text-[var(--primary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama ruangan atau kata kunci"
                  className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                />
              </div>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            Memuat katalog ruang...
          </div>
        ) : (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredRooms.map((room) => {
              const available = room.status === 'aktif'

              return (
                <article
                  key={room.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--foreground)]">{room.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{room.description}</p>
                    </div>

                    <div className="border-t border-[var(--border)]" />

                    <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[var(--primary)]" />
                        <span>{room.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--primary)]" />
                        <span>{room.capacity} orang</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          available
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                            : 'bg-red-100 text-red-700 ring-1 ring-red-200'
                        }`}
                      >
                        {available ? 'Available' : 'Unavailable'}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
                        {room.location.includes('Gedung') ? 'Ruang' : 'Fasilitas'}
                      </span>
                    </div>

                    <div className="border-t border-[var(--border)]" />

                    <button
                      type="button"
                      onClick={() => handleReserve(room)}
                      disabled={!available}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reservasi
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Tidak ada ruang yang cocok</h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Coba ubah kata kunci pencarian atau pilih waktu lain.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
