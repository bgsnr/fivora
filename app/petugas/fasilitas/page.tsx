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
  description: 'Kelola status perbaikan fasilitas kampus untuk petugas FIVORA.',
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

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full bg-purple-100 text-[#5318eb] px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-2">
            Portal Petugas
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0c021c] tracking-tight">
            Kelola Status Perbaikan Fasilitas
          </h1>
          <p className="text-sm text-[#4a454d] mt-1">
            Tandai fasilitas dalam perbaikan berdasarkan laporan kerusakan yang
            ditangani, atau aktifkan kembali fasilitas yang sudah selesai
            diperbaiki.
          </p>
        </div>

        {facilities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-[#0c021c]">
              Belum Ada Fasilitas
            </h3>
            <p className="text-sm text-[#4a454d] mt-1">
              Data fasilitas belum tersedia. Hubungi admin untuk menambahkan
              fasilitas terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((facility) => {
              const badge = STATUS_BADGE[facility.status] ?? STATUS_BADGE.aktif
              return (
                <div
                  key={facility.id}
                  className="rounded-2xl border border-border bg-white p-5 transition-all hover:border-[#5318eb]/40 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs text-slate-500 font-medium">
                        FAC-{String(facility.id).padStart(3, '0')}
                      </span>
                      <h2 className="text-base font-bold text-[#0c021c] mt-0.5">
                        {facility.name}
                      </h2>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4a454d] mt-2">
                    <span className="font-medium text-slate-500">
                      {TYPE_LABELS[facility.type] ?? facility.type}
                    </span>
                    {facility.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#5318eb]" />
                        {facility.location}
                      </span>
                    )}
                    {facility.capacity != null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
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
                      className="w-full bg-[#5318eb] text-white hover:bg-[#4312c4] text-xs flex items-center justify-center gap-1.5"
                    >
                      {facility.status === 'dalam_perbaikan' ? (
                        <>
                          <Wrench className="h-3.5 w-3.5" /> Kelola Perbaikan
                        </>
                      ) : (
                        <>
                          Kelola Fasilitas <ArrowRight className="h-3.5 w-3.5" />
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