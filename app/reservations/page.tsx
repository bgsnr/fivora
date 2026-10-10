'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Users,
} from 'lucide-react'

import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/client'
import { createReservationAction } from '@/lib/actions/reservations'
import { useCurrentUserName } from '@/lib/use-current-user-name'

type SelectedRoom = {
  id: string | number
  name: string
  description?: string
  location: string
  capacity: number
  type?: string
  status?: string
  date?: string
  time?: string
  startTime?: string
  endTime?: string
}

function addMinutesToTime(time: string, minutes: number) {
  const [hours, mins] = time.split(':').map(Number)
  const total = hours * 60 + mins + minutes
  const nextHours = Math.floor(total / 60)
  const nextMinutes = total % 60

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`
}

function formatDate(dateString: string) {
  if (!dateString) return '-'

  const [year, month, day] = dateString.split('-')

  if (!year || !month || !day) return dateString

  return `${day}-${month}-${year}`
}

export default function ReservationsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const userName = useCurrentUserName()

  const [authChecked, setAuthChecked] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Periksa sesi, status akun, dan role sebelum menampilkan halaman.
  useEffect(() => {
    let isMounted = true

    async function checkAccess() {
      const supabase = createClient()

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!isMounted) return

        // Pengunjung yang belum login wajib masuk terlebih dahulu.
        if (authError || !user) {
          router.replace('/login?redirect=%2Freservations')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, status')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!isMounted) return

        if (profileError || !profile) {
          router.replace('/login?redirect=%2Freservations')
          return
        }

        // Hanya akun aktif yang boleh melanjutkan.
        const accountStatus = String(profile.status ?? '')
          .toLowerCase()
          .trim()

        if (!['aktif', 'active'].includes(accountStatus)) {
          router.replace('/login?redirect=%2Freservations')
          return
        }

        // Halaman reservasi hanya dapat diakses oleh pengguna.
        if (profile.role !== 'pengguna') {
          router.replace(
            profile.role === 'admin' ? '/admin' : '/petugas',
          )
          return
        }

        if (isMounted) {
          setAuthChecked(true)
        }
      } catch (error) {
        console.error('Gagal memeriksa akses reservasi:', error)

        if (isMounted) {
          router.replace('/login?redirect=%2Freservations')
        }
      }
    }

    void checkAccess()

    return () => {
      isMounted = false
    }
  }, [router])

  // Mengambil fasilitas dan jadwal dari parameter URL.
  // Tetap mendukung parameter "time" lama.
  const selectedRoom = useMemo<SelectedRoom | null>(() => {
    const rawRoom = params.get('room')

    if (rawRoom) {
      try {
        const parsed = JSON.parse(
          rawRoom,
        ) as SelectedRoom

        return {
          ...parsed,
          date: params.get('date') || parsed.date || '',
          startTime:
            params.get('startTime') ||
            parsed.startTime ||
            params.get('time') ||
            parsed.time ||
            '',
          endTime:
            params.get('endTime') ||
            parsed.endTime ||
            '',
        }
      } catch {
        return null
      }
    }

    if (typeof window === 'undefined') {
      return null
    }

    const fallback = window.sessionStorage.getItem(
      'fivora-selected-room',
    )

    if (!fallback) {
      return null
    }

    try {
      return JSON.parse(fallback) as SelectedRoom
    } catch {
      return null
    }
  }, [params])

  const selectedStartTime =
    selectedRoom?.startTime ||
    selectedRoom?.time ||
    '09:00'

  const selectedEndTime =
    selectedRoom?.endTime ||
    addMinutesToTime(selectedStartTime, 30)

  const handleConfirm = async () => {
    if (!selectedRoom) {
      router.push('/catalog')
      return
    }

    const date = selectedRoom.date || ''
    const startTime = selectedStartTime
    const endTime = selectedEndTime

    if (!date) {
      setErrorMessage('Tanggal reservasi wajib diisi.')
      return
    }

    if (startTime >= endTime) {
      setErrorMessage(
        'Waktu selesai harus lebih besar dari waktu mulai.',
      )
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const result = await createReservationAction({
        facility_id: Number(selectedRoom.id),
        reservation_date: date,
        start_time: startTime,
        end_time: endTime,
        purpose: `Reservasi ${selectedRoom.name}`,
      })

      if (!result.success) {
        setErrorMessage(
          result.error || 'Reservasi gagal dibuat.',
        )
        return
      }

      setIsSubmitted(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err)

      setErrorMessage(`Terjadi kesalahan sistem: ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Jangan tampilkan detail atau form reservasi sebelum akses diperiksa.
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted-foreground)]">
        Memeriksa sesi pengguna...
      </div>
    )
  }

  if (!selectedRoom) {
    return (
      <AppLayout userName={userName}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Reservasi tidak tersedia
            </h1>

            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Silakan pilih ruang dari katalog terlebih dahulu.
            </p>

            <button
              type="button"
              onClick={() => router.push('/catalog')}
              className="mt-6 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
            >
              Kembali ke Katalog
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            DETAIL RESERVASI
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Konfirmasi Reservasi
          </h1>
        </div>

        {!isSubmitted ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <div className="space-y-5">
              {/* Informasi fasilitas */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ruangan
                </p>

                <h2 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
                  {selectedRoom.name}
                </h2>

                {selectedRoom.type && (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {selectedRoom.type}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <MapPin className="h-4 w-4 text-[var(--primary)]" />
                    Lokasi
                  </div>

                  <p className="mt-2 font-medium text-[var(--foreground)]">
                    {selectedRoom.location}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Users className="h-4 w-4 text-[var(--primary)]" />
                    Kapasitas
                  </div>

                  <p className="mt-2 font-medium text-[var(--foreground)]">
                    {selectedRoom.capacity} orang
                  </p>
                </div>
              </div>

              {/* Tanggal dan rentang waktu */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
                  Tanggal &amp; Waktu
                </div>

                <p className="mt-2 font-medium text-[var(--foreground)]">
                  {formatDate(selectedRoom.date || '')}
                </p>

                <p className="mt-1 text-lg font-semibold text-[var(--primary)]">
                  {selectedStartTime}–{selectedEndTime} WIB
                </p>

                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Durasi{' '}
                  {(() => {
                    const [startHour, startMinute] =
                      selectedStartTime.split(':').map(Number)

                    const [endHour, endMinute] =
                      selectedEndTime.split(':').map(Number)

                    const totalMinutes =
                      endHour * 60 +
                      endMinute -
                      (startHour * 60 + startMinute)

                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = totalMinutes % 60

                    return [
                      hours > 0 ? `${hours} jam` : '',
                      minutes > 0 ? `${minutes} menit` : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  })()}
                </p>
              </div>

              {/* Informasi persetujuan */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-center gap-2 font-medium">
                  <Clock3 className="h-4 w-4" />
                  Informasi penting
                </div>

                <p className="mt-2">
                  Reservasi membutuhkan persetujuan manual oleh
                  petugas. Setelah diajukan, status reservasi
                  akan menjadi menunggu persetujuan.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-base font-semibold text-[var(--primary-foreground)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Memproses...'
                : 'Konfirmasi Reservasi'}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-[#010736]">
              Reservasi berhasil
            </h2>

            <p className="mt-3 text-base text-emerald-900">
              Reservasi berhasil diajukan. Silakan menunggu
              persetujuan oleh petugas.
            </p>

            <button
              type="button"
              onClick={() => router.push('/history')}
              className="mt-6 rounded-xl bg-[#010736] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0D1C42]"
            >
              Lihat Riwayat Reservasi
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}