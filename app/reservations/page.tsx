import Link from 'next/link'

import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getReservationsByUser } from '@/lib/actions/reservations'
import { getDisplayStatusLabel } from '@/lib/validations/reservation-time'
import { Button } from '@/components/ui/button'

import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react'

export const metadata = {
  title: 'Riwayat Reservasi Saya - FIVORA',
  description:
    'Daftar pengajuan dan riwayat reservasi fasilitas kampus Anda.',
}

export default async function ReservationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
        <Navbar />

        <main className="container mx-auto flex max-w-4xl flex-1 items-center justify-center px-4 py-16 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-[#D8DFEA] bg-white p-8 shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-600" />

            <h1 className="text-xl font-bold text-[#010736]">
              Perlu Masuk Akun
            </h1>

            <p className="mt-2 text-sm text-[#52627D]">
              Silakan masuk dengan akun mahasiswa, dosen, atau staf
              Anda untuk melihat riwayat reservasi.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login">
                <Button className="bg-[#010736] text-white hover:bg-[#0D1C42]">
                  Masuk Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  const reservations = await getReservationsByUser(String(user.id))
  const now = new Date()

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar />

      <main className="container mx-auto max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#010736] sm:text-3xl">
              Riwayat Reservasi Fasilitas
            </h1>

            <p className="mt-1 text-sm text-[#52627D]">
              Pantau status pengajuan, jadwal penggunaan, dan riwayat
              peminjaman Anda.
            </p>
          </div>

          <Link href="/reservations/new">
            <Button className="flex items-center gap-2 bg-[#010736] text-white hover:bg-[#0D1C42]">
              <Plus className="h-4 w-4" />
              Ajukan Reservasi Baru
            </Button>
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-[#D8DFEA] bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FCF1D0] text-[#010736]">
              <FileText className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-[#010736]">
              Belum Ada Reservasi
            </h3>

            <p className="mt-1 text-sm text-[#52627D]">
              Anda belum memiliki riwayat pengajuan peminjaman
              fasilitas kampus.
            </p>

            <div className="mt-6">
              <Link href="/reservations/new">
                <Button className="bg-[#010736] text-white hover:bg-[#0D1C42]">
                  Buat Pengajuan Pertama
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => {
              const displayInfo = getDisplayStatusLabel(
                {
                  status: r.status,
                  reservation_date: r.reservation_date,
                  end_time: r.end_time,
                },
                now
              )

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-[#D8DFEA] bg-white p-5 transition-all hover:border-[#22396F] hover:shadow-sm sm:p-6"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-[#718097]">
                          #{r.id}
                        </span>

                        <h2 className="text-lg font-bold text-[#010736]">
                          {r.facilities?.name ||
                            'Fasilitas Kampus'}
                        </h2>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            r.status === 'disetujui'
                              ? displayInfo.isPast
                                ? 'border-slate-200 bg-slate-100 text-slate-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : r.status === 'menunggu'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : r.status === 'ditolak'
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}
                        >
                          {displayInfo.label}
                        </span>
                      </div>

                      {r.facilities?.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#52627D]">
                          <MapPin className="h-3.5 w-3.5 text-[#22396F]" />
                          {r.facilities.location}
                        </p>
                      )}
                    </div>

                    <Link href={`/reservations/${r.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 border-[#D8DFEA] text-xs font-medium text-[#010736] hover:bg-[#F8FAFC]"
                      >
                        Lihat Detail
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#D8DFEA] pt-3.5 text-xs text-[#52627D]">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium text-[#010736]">
                        <Calendar className="h-3.5 w-3.5 text-[#718097]" />
                        {r.reservation_date}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#718097]" />
                        {r.start_time.slice(0, 5)} -{' '}
                        {r.end_time.slice(0, 5)} WIB
                      </span>
                    </div>

                    <div className="max-w-md truncate italic text-[#718097]">
                      &ldquo;{r.purpose}&rdquo;
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}