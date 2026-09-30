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
  description: 'Dashboard pemrosesan antrean reservasi fasilitas kampus untuk petugas.',
}

export default async function StaffReservationsDashboardPage() {
  const user = await getCurrentUser()

  // Proteksi Akses Petugas (Chapter 9: Hanya role 'petugas' atau 'admin')
  if (!user || (user.role !== 'petugas' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-red-950">Akses Dibatasi (403)</h1>
            <p className="text-sm text-red-800 mt-2">
              Halaman antrean pemrosesan ini khusus untuk staf Petugas dan Administrator FIVORA.
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button className="bg-[#5318eb] text-white">Masuk sebagai Petugas</Button>
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
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full bg-purple-100 text-[#5318eb] px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            Portal Petugas
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c021c] tracking-tight">
            Antrean Pengajuan Reservasi
          </h1>
          <p className="text-sm text-[#4a454d] mt-1">
            Pengajuan diproses berdasarkan urutan waktu pengajuan (FIFO). Reservasi teratas adalah pengajuan paling awal.
          </p>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-[#0c021c]">
              Antrean Bersih
            </h3>
            <p className="text-sm text-[#4a454d] mt-1">
              Saat ini tidak ada pengajuan reservasi berstatus menunggu yang perlu diproses.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#4a454d] px-2">
              <span>Menampilkan {queue.length} pengajuan dalam antrean</span>
              <span className="font-medium text-[#5318eb]">Urutan: Pengajuan Terlama di Atas (FIFO)</span>
            </div>

            {queue.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-white p-5 sm:p-6 transition-all hover:border-[#5318eb]/40 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 font-bold text-[#5318eb] text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-500 font-medium">
                          ID: {item.id}
                        </span>
                        <h2 className="text-base font-bold text-[#0c021c]">
                          {item.facilities?.name}
                        </h2>
                        <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                          Menunggu Persetujuan
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#4a454d] mt-1.5">
                        <span className="flex items-center gap-1 font-medium text-[#0c021c]">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {item.users?.name || 'Pengguna'} ({item.users?.email})
                        </span>
                        {item.facilities?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#5318eb]" />
                            {item.facilities.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/dashboard/reservations/${item.id}`}>
                    <Button
                      size="sm"
                      className="bg-[#5318eb] text-white hover:bg-[#4312c4] text-xs flex items-center gap-1.5 whitespace-nowrap"
                    >
                      Proses Pengajuan
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-[#4a454d]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-[#0c021c]">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {item.reservation_date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)} WIB
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Diajukan:{' '}
                    {new Date(item.created_at).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}{' '}
                    WIB
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-900">Tujuan: </span>
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
