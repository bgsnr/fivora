import Link from 'next/link'

import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getActiveFacilities } from '@/lib/actions/reservations'
import { Button } from '@/components/ui/button'

import {
  MapPin,
  Users,
  ShieldAlert,
  Wrench,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

export const metadata = {
  title: 'Kelola Fasilitas - Portal Petugas FIVORA',
  description:
    'Kelola status perbaikan fasilitas kampus untuk petugas FIVORA.',
}

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  aktif: {
    label: 'Aktif',
    className:
      'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  dalam_perbaikan: {
    label: 'Dalam Perbaikan',
    className:
      'bg-amber-50 border-amber-200 text-amber-700',
  },
  nonaktif: {
    label: 'Nonaktif',
    className:
      'bg-slate-100 border-slate-200 text-slate-600',
  },
}

const TYPE_LABELS: Record<string, string> = {
  ruang_kelas: 'Ruang Kelas',
  laboratorium: 'Laboratorium',
  aula: 'Aula',
  lapangan: 'Lapangan',
  alat: 'Peralatan',
}

export default async function PetugasFasilitasPage() {
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
              Halaman pengelolaan fasilitas ini khusus untuk staf
              Petugas FIVORA.
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

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar />

      <main className="container mx-auto max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <div className="mb-8">
          <span className="mb-2 inline-flex items-center rounded-full bg-[#FCF1D0] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#010736]">
            Portal Petugas
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-[#010736] sm:text-3xl">
            Kelola Status Perbaikan Fasilitas
          </h1>

          <p className="mt-1 text-sm text-[#52627D]">
            Tandai fasilitas dalam perbaikan berdasarkan laporan
            kerusakan yang ditangani, atau aktifkan kembali fasilitas
            yang sudah selesai diperbaiki.
          </p>
        </div>

        {facilities.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-[#D8DFEA] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-[#010736]">
              Belum Ada Fasilitas
            </h3>

            <p className="mt-1 text-sm text-[#52627D]">
              Data fasilitas belum tersedia. Hubungi admin untuk
              menambahkan fasilitas terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => {
              const badge =
                STATUS_BADGE[facility.status] ?? STATUS_BADGE.aktif

              return (
                <div
                  key={facility.id}
                  className="rounded-2xl border border-[#D8DFEA] bg-white p-5 transition-all hover:border-[#22396F] hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-medium text-[#718097]">
                        FAC-{String(facility.id).padStart(3, '0')}
                      </span>

                      <h2 className="mt-0.5 text-base font-bold text-[#010736]">
                        {facility.name}
                      </h2>
                    </div>

                    <span
                      className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#52627D]">
                    <span className="font-medium text-[#718097]">
                      {TYPE_LABELS[facility.type] ?? facility.type}
                    </span>

                    {facility.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#22396F]" />
                        {facility.location}
                      </span>
                    )}

                    {facility.capacity != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[#718097]" />
                        {facility.capacity}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/petugas/fasilitas/${facility.id}`}
                    className="mt-4 block"
                  >
                    <Button
                      size="sm"
                      className="flex w-full items-center justify-center gap-1.5 bg-[#010736] text-xs text-white hover:bg-[#0D1C42]"
                    >
                      {facility.status === 'dalam_perbaikan' ? (
                        <>
                          <Wrench className="h-3.5 w-3.5" />
                          Kelola Perbaikan
                        </>
                      ) : (
                        <>
                          Kelola Fasilitas
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </Link>
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