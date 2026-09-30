import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getActiveFacilities } from '@/lib/actions/reservations'
import { getUpcomingActiveReservationsForFacility } from '@/lib/integration'
import { MaintenanceForm } from '@/components/petugas/maintenance-form'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Users,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Clock,
  User,
} from 'lucide-react'

export const metadata = {
  title: 'Detail Fasilitas - Portal Petugas FIVORA',
  description: 'Kelola status perbaikan fasilitas dan reservasi terdampak.',
}

const TYPE_LABELS: Record<string, string> = {
  ruang_kelas: 'Ruang Kelas',
  laboratorium: 'Laboratorium',
  aula: 'Aula',
  lapangan: 'Lapangan',
  alat: 'Peralatan',
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  aktif: {
    label: 'Aktif',
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  dalam_perbaikan: {
    label: 'Dalam Perbaikan',
    className: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  nonaktif: {
    label: 'Nonaktif',
    className: 'bg-slate-100 border-slate-200 text-slate-600',
  },
}

export default async function PetugasFasilitasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const facilityId = Number(id)

  if (!Number.isInteger(facilityId) || facilityId <= 0) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user || user.role !== 'petugas') {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-red-950">Akses Dibatasi (403)</h1>
            <p className="text-sm text-red-800 mt-2">
              Halaman pengelolaan fasilitas ini khusus untuk staf Petugas FIVORA.
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button className="bg-[#5318eb] text-white">
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

  const facilities = await getActiveFacilities()
  const facility = facilities.find((item) => item.id === facilityId)

  if (!facility) {
    notFound()
  }

  const upcomingReservations =
    await getUpcomingActiveReservationsForFacility(facilityId)

  const badge = STATUS_BADGE[facility.status] ?? STATUS_BADGE.aktif
  const isInMaintenance = facility.status === 'dalam_perbaikan'

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <Link
          href="/petugas/fasilitas"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5318eb] hover:text-[#4312c4] mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Fasilitas
        </Link>

        <div className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs text-slate-500 font-medium">
                FAC-{String(facility.id).padStart(3, '0')}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0c021c] tracking-tight mt-0.5">
                {facility.name}
              </h1>
              <p className="text-sm text-[#4a454d] mt-1">
                {TYPE_LABELS[facility.type] ?? facility.type}
                {facility.location && (
                  <>
                    {' '}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#5318eb]" />
                      {facility.location}
                    </span>
                  </>
                )}
              </p>
            </div>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#4a454d]">
            {facility.capacity != null && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Kapasitas: {facility.capacity}
              </span>
            )}
            {facility.description && (
              <p className="text-xs text-slate-600 basis-full">
                {facility.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <MaintenanceForm
            facilityId={facility.id}
            currentStatus={facility.status}
            upcomingActiveCount={upcomingReservations.length}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-base font-bold text-[#0c021c] mb-3">
            Reservasi Mendatang (Menunggu / Disetujui)
          </h2>

          {upcomingReservations.length === 0 ? (
            <p className="text-sm text-[#4a454d] bg-white border border-border rounded-2xl p-6 text-center">
              Tidak ada reservasi mendatang berstatus menunggu/disetujui pada
              fasilitas ini.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-border bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-500 font-medium">
                          ID: {res.id}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            res.status === 'disetujui'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          {res.status === 'disetujui' ? 'Disetujui' : 'Menunggu'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#4a454d] mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {res.reservation_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)} WIB
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {res.users?.name || 'Pengguna'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isInMaintenance && upcomingReservations.length > 0 && (
            <p className="text-xs text-[#4a454d] mt-3">
              Menandai fasilitas dalam perbaikan akan otomatis menolak{' '}
              <strong>{upcomingReservations.length}</strong> pengajuan
              menunggu terdampak dan membatalkan reservasi disetujui yang belum
              berakhir.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}