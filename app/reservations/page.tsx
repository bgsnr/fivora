import Link from 'next/link'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getReservationsByUser } from '@/lib/actions/reservations'
import { getDisplayStatusLabel } from '@/lib/validations/reservation-time'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Plus, ArrowRight, AlertCircle, FileText } from 'lucide-react'

export const metadata = {
  title: 'Riwayat Reservasi Saya - FIVORA',
  description: 'Daftar pengajuan dan riwayat reservasi fasilitas kampus Anda.',
}

export default async function ReservationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-border bg-white p-8 max-w-md mx-auto shadow-sm">
            <AlertCircle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-[#0c021c]">Perlu Masuk Akun</h1>
            <p className="text-sm text-[#4a454d] mt-2">
              Silakan masuk dengan akun mahasiswa, dosen, atau staf Anda untuk melihat riwayat reservasi.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login">
                <Button className="bg-[#5318eb] text-white hover:bg-[#4312c4]">
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
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0c021c] tracking-tight">
              Riwayat Reservasi Fasilitas
            </h1>
            <p className="text-sm text-[#4a454d] mt-1">
              Pantau status pengajuan, jadwal penggunaan, dan riwayat peminjaman Anda.
            </p>
          </div>

          <Link href="/reservations/new">
            <Button className="bg-[#5318eb] text-white hover:bg-[#4312c4] flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajukan Reservasi Baru
            </Button>
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5318eb] mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-[#0c021c]">
              Belum Ada Reservasi
            </h3>
            <p className="text-sm text-[#4a454d] mt-1">
              Anda belum memiliki riwayat pengajuan peminjaman fasilitas kampus.
            </p>
            <div className="mt-6">
              <Link href="/reservations/new">
                <Button className="bg-[#5318eb] text-white hover:bg-[#4312c4]">
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
                  className="rounded-2xl border border-border bg-white p-5 sm:p-6 transition-all hover:border-[#5318eb]/40 hover:shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-[#4a454d]">
                          #{r.id}
                        </span>
                        <h2 className="text-lg font-bold text-[#0c021c]">
                          {r.facilities?.name || 'Fasilitas Kampus'}
                        </h2>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            r.status === 'disetujui'
                              ? displayInfo.isPast
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'menunggu'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : r.status === 'ditolak'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {displayInfo.label}
                        </span>
                      </div>

                      {r.facilities?.location && (
                        <p className="text-xs text-[#4a454d] flex items-center gap-1.5 mt-1">
                          <MapPin className="h-3.5 w-3.5 text-[#5318eb]" />
                          {r.facilities.location}
                        </p>
                      )}
                    </div>

                    <Link href={`/reservations/${r.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-medium text-[#0c021c] flex items-center gap-1.5 hover:bg-slate-50"
                      >
                        Lihat Detail
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4a454d]">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1.5 font-medium text-[#0c021c]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {r.reservation_date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)} WIB
                      </span>
                    </div>

                    <div className="truncate max-w-md text-slate-600 italic">
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
