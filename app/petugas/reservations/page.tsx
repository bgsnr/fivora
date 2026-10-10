import Link from 'next/link'
import { Footer } from '@/components/landing/footer'
import { requireReportRole } from '@/lib/report-access'
import {
  getPendingReservationsQueue,
  getApprovedReservationsQueue,
  sweepExpiredPendingReservationsAction,
} from '@/lib/actions/reservations'
import { Button } from '@/components/ui/button'

import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Antrean Reservasi Petugas - FIVORA',
  description:
    'Dashboard pemrosesan antrean reservasi fasilitas kampus untuk petugas.',
}

function getScheduleState(
  date: string,
  startTime: string,
  endTime: string
) {
  const normalizeTime = (time: string) =>
    time.length === 5 ? `${time}:00` : time.slice(0, 8)

  const startAt = new Date(
    `${date}T${normalizeTime(startTime)}+07:00`
  ).getTime()

  const endAt = new Date(
    `${date}T${normalizeTime(endTime)}+07:00`
  ).getTime()

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt)) {
    return {
      label: 'Jadwal tidak valid',
      className: 'border-red-200 bg-red-50 text-red-700',
    }
  }

  const now = Date.now()

  if (now < startAt) {
    return {
      label: 'Akan Datang',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    }
  }

  if (now < endAt) {
    return {
      label: 'Sedang Berlangsung',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    }
  }

  return {
    label: 'Sudah Lewat',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  }
}

export default async function StaffReservationsDashboardPage() {
  await requireReportRole('petugas')

  // Sweep pengajuan 'menunggu' yang waktu mulainya sudah lewat sebelum membaca
  // antrean, agar petugas tidak melihat antrean yang sudah tidak bisa diproses.
  await sweepExpiredPendingReservationsAction()

  // Mengambil antrean reservasi 'menunggu', diurutkan created_at ASC (FIFO)
  const queue = await getPendingReservationsQueue()
  const approvedQueue = await getApprovedReservationsQueue()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#FCF1D0] selection:text-[#010736]">
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <span className="mb-2 inline-flex items-center rounded-full bg-[#FCF1D0] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#010736]">
            Portal Petugas
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-[#010736] sm:text-3xl">
            Antrean Pengajuan Reservasi
          </h1>

          <p className="mt-1 text-sm text-[#22396F]">
            Pengajuan diproses berdasarkan urutan waktu pengajuan (FIFO).
            Reservasi teratas adalah pengajuan paling awal.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-[#22396F]/30 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FCF1D0] text-[#22396F]">
              <CheckCircle className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-[#010736]">
              Antrean Bersih
            </h3>

            <p className="mt-1 text-sm text-[#22396F]">
              Saat ini tidak ada pengajuan reservasi berstatus menunggu yang
              perlu diproses.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 text-xs text-[#22396F]">
              <span>
                Menampilkan {queue.length} pengajuan dalam antrean
              </span>

              <span className="font-medium text-[#010736]">
                Urutan: Pengajuan Terlama di Atas (FIFO)
              </span>
            </div>

            {queue.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-white p-5 transition-all hover:border-[#22396F]/60 hover:shadow-sm sm:p-6"
              >
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCF1D0] text-sm font-bold text-[#010736]">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[#22396F]">
                          ID: {item.id}
                        </span>

                        <h2 className="text-base font-bold text-[#010736]">
                          {item.facilities?.name}
                        </h2>

                        <span className="rounded-full border border-[#22396F]/30 bg-[#FCF1D0] px-2 py-0.5 text-xs font-semibold text-[#010736]">
                          Menunggu Persetujuan
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#22396F]">
                        <span className="flex items-center gap-1 font-medium text-[#010736]">
                          <User className="h-3.5 w-3.5 text-[#22396F]" />
                          {item.users?.name || 'Pengguna'} ({item.users?.email})
                        </span>

                        {item.facilities?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#22396F]" />
                            {item.facilities.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/petugas/reservations/${item.id}`}>
                    <Button
                      size="sm"
                      className="flex items-center gap-1.5 whitespace-nowrap bg-[#010736] text-xs text-white hover:bg-[#0D1C42]"
                    >
                      Proses Pengajuan
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#22396F]/15 pt-3.5 text-xs text-[#22396F]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-[#010736]">
                      <Calendar className="h-3.5 w-3.5 text-[#22396F]" />
                      {item.reservation_date}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#22396F]" />
                      {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} WIB
                    </span>
                  </div>

                  <div className="text-xs text-[#22396F]">
                    Diajukan:{' '}
                    {new Date(item.created_at).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}{' '}
                    WIB
                  </div>
                </div>

                <div className="mt-2 rounded-lg border border-[#22396F]/15 bg-[#FCF1D0]/50 p-2.5 text-xs text-[#22396F]">
                  <span className="font-semibold text-[#010736]">
                    Tujuan:{' '}
                  </span>
                  {item.purpose}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <section className="mt-12 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#010736] sm:text-2xl">
                Reservasi Disetujui
              </h2>
              <p className="mt-1 text-sm text-[#22396F]">
                Pantau jadwal reservasi yang telah disetujui, termasuk jadwal yang sudah lewat.
              </p>
            </div>

            <span className="text-sm font-medium text-[#22396F]">
              {approvedQueue.length} reservasi
            </span>
          </div>

          {approvedQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#22396F]/30 bg-white p-8 text-center">
              <p className="font-semibold text-[#010736]">
                Belum ada reservasi disetujui
              </p>
              <p className="mt-1 text-sm text-[#22396F]">
                Reservasi yang disetujui petugas akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedQueue.map((item) => {
                const schedule = getScheduleState(
                  item.reservation_date,
                  item.start_time,
                  item.end_time
                )

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-mono text-xs text-[#22396F]">
                          ID Reservasi: {item.id}
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-[#010736]">
                          {item.facilities?.name || 'Fasilitas'}
                        </h3>

                        <p className="mt-1 text-sm text-[#22396F]">
                          {item.users?.name || 'Pengguna'}
                          {item.users?.email ? ` (${item.users.email})` : ''}
                        </p>
                      </div>

                      <span
                        className={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-semibold ${schedule.className}`}
                      >
                        {schedule.label}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-[#22396F]/15 pt-4 text-sm sm:grid-cols-2">
                      <div className="flex items-start gap-2 text-[#22396F]">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{item.reservation_date}</span>
                      </div>

                      <div className="flex items-start gap-2 text-[#22396F]">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {item.start_time.slice(0, 5)} -{' '}
                          {item.end_time.slice(0, 5)} WIB
                        </span>
                      </div>

                      {item.facilities?.location && (
                        <div className="flex items-start gap-2 text-[#22396F]">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{item.facilities.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg bg-[#FCF1D0]/50 p-3 text-sm text-[#22396F]">
                      <span className="font-semibold text-[#010736]">
                        Tujuan:
                      </span>{' '}
                      {item.purpose}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link href={`/petugas/reservations/${item.id}`}>
                        <Button
                          size="sm"
                          className="flex items-center gap-1.5 bg-[#010736] text-white hover:bg-[#0D1C42]"
                        >
                          Lihat Detail
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}