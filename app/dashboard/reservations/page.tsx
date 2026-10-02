import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getPendingReservationsQueue } from '@/lib/actions/reservations'
import { Button } from '@/components/ui/button'

import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Antrean Reservasi Petugas - FIVORA',
  description:
    'Dashboard pemrosesan antrean reservasi fasilitas kampus untuk petugas.',
}

export default async function StaffReservationsDashboardPage() {
  const user = await getCurrentUser()

  // Proteksi Akses Petugas (Chapter 9: Hanya role 'petugas' atau 'admin')
  if (!user || (user.role !== 'petugas' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />

        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-[#22396F]/30 bg-[#FCF1D0] p-8 shadow-sm">
            <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-[#22396F]" />

            <h1 className="text-xl font-bold text-[#010736]">
              Akses Dibatasi (403)
            </h1>

            <p className="mt-2 text-sm text-[#22396F]">
              Halaman antrean pemrosesan ini khusus untuk staf Petugas dan
              Administrator FIVORA.
            </p>

            <div className="mt-6">
              <Link href="/login">
                <Button className="bg-[#010736] text-white hover:bg-[#0D1C42]">
                  Masuk sebagai Petugas
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  // Mengambil antrean reservasi 'menunggu', diurutkan created_at ASC (FIFO)
  const queue = await getPendingReservationsQueue()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar />

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

                  <Link href={`/dashboard/reservations/${item.id}`}>
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
      </main>
      <Footer />
    </div>
  )
}