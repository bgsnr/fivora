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
  description:
    'Kelola status perbaikan fasilitas dan reservasi terdampak.',
}

const TYPE_LABELS: Record<string, string> = {
  ruang_kelas: 'Ruang Kelas',
  laboratorium: 'Laboratorium',
  aula: 'Aula',
  lapangan: 'Lapangan',
  alat: 'Peralatan',
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  aktif: {
    label: 'Aktif',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  dalam_perbaikan: {
    label: 'Dalam Perbaikan',
    className:
      'border-amber-200 bg-amber-50 text-amber-700',
  },
  nonaktif: {
    label: 'Nonaktif',
    className:
      'border-slate-200 bg-slate-100 text-slate-600',
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
      <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
        <Navbar />

        <main className="container mx-auto flex max-w-md flex-1 items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-red-600" />

            <h1 className="text-xl font-bold text-[#010736]">
              Akses Dibatasi (403)
            </h1>

            <p className="mt-2 text-sm text-[#52627D]">
              Halaman pengelolaan fasilitas ini khusus untuk staf Petugas
              FIVORA.
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

  const facilities = await getActiveFacilities()

  const facility = facilities.find(
    (item) => item.id === facilityId
  )

  if (!facility) {
    notFound()
  }

  const upcomingReservations =
    await getUpcomingActiveReservationsForFacility(facilityId)

  const badge =
    STATUS_BADGE[facility.status] ?? STATUS_BADGE.aktif

  const isInMaintenance =
    facility.status === 'dalam_perbaikan'

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar />

      <main className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:py-12">
        <Link
          href="/petugas/fasilitas"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#22396F] hover:text-[#010736]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Fasilitas
        </Link>

        <div className="rounded-2xl border border-[#D8DFEA] bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-medium text-[#718097]">
                FAC-{String(facility.id).padStart(3, '0')}
              </span>

              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-[#010736] sm:text-2xl">
                {facility.name}
              </h1>

              <p className="mt-1 text-sm text-[#52627D]">
                {TYPE_LABELS[facility.type] ?? facility.type}

                {facility.location && (
                  <>
                    {' '}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#22396F]" />
                      {facility.location}
                    </span>
                  </>
                )}
              </p>
            </div>

            <span
              className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#52627D]">
            {facility.capacity != null && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#718097]" />
                Kapasitas: {facility.capacity}
              </span>
            )}

            {facility.description && (
              <p className="basis-full text-xs text-[#52627D]">
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
          <h2 className="mb-3 text-base font-bold text-[#010736]">
            Reservasi Mendatang (Menunggu / Disetujui)
          </h2>

          {upcomingReservations.length === 0 ? (
            <p className="rounded-2xl border border-[#D8DFEA] bg-white p-6 text-center text-sm text-[#52627D]">
              Tidak ada reservasi mendatang berstatus menunggu/disetujui
              pada fasilitas ini.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D8DFEA] bg-white p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[#718097]">
                          ID: {res.id}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            res.status === 'disetujui'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          }`}
                        >
                          {res.status === 'disetujui'
                            ? 'Disetujui'
                            : 'Menunggu'}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#52627D]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-[#718097]" />
                          {res.reservation_date}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#718097]" />
                          {res.start_time.slice(0, 5)} -{' '}
                          {res.end_time.slice(0, 5)} WIB
                        </span>

                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-[#718097]" />
                          {res.users?.name || 'Pengguna'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isInMaintenance &&
            upcomingReservations.length > 0 && (
              <p className="mt-3 text-xs text-[#52627D]">
                Menandai fasilitas dalam perbaikan akan otomatis menolak{' '}
                <strong className="text-[#010736]">
                  {upcomingReservations.length}
                </strong>{' '}
                pengajuan menunggu terdampak dan membatalkan reservasi
                disetujui yang belum berakhir.
              </p>
            )}
        </div>
      </main>

      <Footer />
    </div>
  )
}