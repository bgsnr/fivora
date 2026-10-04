'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react'

import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/client'
import { sweepExpiredPendingReservationsAction } from '@/lib/actions/reservations'

type ReservationHistoryItem = {
  id: number
  roomName: string
  location: string
  date: string
  time: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
}

export default function ReservationHistoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [reservations, setReservations] = useState<ReservationHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Pengguna')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setReservations([])
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, name')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (profileError || !profile) {
          setReservations([])
          return
        }

        setUserName(profile.name || 'Pengguna')

        // Sweep kedaluwarsa di server agar status riwayat akurat tanpa
        // menunggu petugas menyentuh antrean.
        await sweepExpiredPendingReservationsAction().catch(() => null)

        const { data, error } = await supabase
          .from('reservations')
          .select('id, reservation_date, start_time, end_time, status, facilities:facility_id(name, location)')
          .eq('user_id', profile.id)
          .order('reservation_date', { ascending: false })
          .order('start_time', { ascending: false })

        if (error) {
          setReservations([])
          return
        }

        const mapped = (data ?? []).map((item) => {
          const facility = Array.isArray(item.facilities)
            ? item.facilities[0]
            : item.facilities

          const mapStatus = {
            menunggu: 'Pending',
            disetujui: 'Approved',
            ditolak: 'Rejected',
            dibatalkan: 'Cancelled',
          } as const

          return {
            id: Number(item.id),
            roomName: facility?.name || 'Fasilitas',
            location: facility?.location || 'Lokasi belum diatur',
            date: item.reservation_date || '',
            time: `${item.start_time || '00:00'} - ${item.end_time || '00:00'}`,
            status: mapStatus[(item.status as keyof typeof mapStatus) ?? 'menunggu'] || 'Pending',
          }
        })

        setReservations(mapped)
      } catch {
        setReservations([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [supabase])

  return (
    <AppLayout userName={userName}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              RIWAYAT RESERVASI
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Reservasi Saya</h1>
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

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
            Memuat riwayat reservasi...
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-9 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--foreground)]">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h2 className="text-xl font-bold text-[var(--foreground)]">Anda belum pernah reservasi ruang</h2>

              <button
                type="button"
                onClick={() => router.push('/catalog')}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
              >
                Mulai Reservasi
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-[var(--foreground)]">
                <thead className="bg-[var(--muted)] text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Ruangan</th>
                    <th className="px-5 py-4 font-semibold">Lokasi</th>
                    <th className="px-5 py-4 font-semibold">Tanggal</th>
                    <th className="px-5 py-4 font-semibold">Waktu</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.map((item) => (
                    <tr key={item.id} className="border-t border-[var(--border)]">
                      <td className="px-5 py-4 font-medium text-[var(--foreground)]">{item.roomName}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <MapPin className="h-4 w-4 text-[var(--primary)]" />
                          {item.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                          {item.date}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                          <Clock3 className="h-4 w-4 text-[var(--primary)]" />
                          {item.time}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'Rejected'
                                ? 'bg-red-100 text-red-700'
                                : item.status === 'Cancelled'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>
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
