import Link from 'next/link'

import { requireFacilityAdmin } from '@/lib/facility-access'
import { supabaseAdmin } from '@/lib/supabase/admin'

import type { Reservation } from '@/types/reservation'

import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

type ReservationTab = 'menunggu' | 'disetujui' | 'selesai'

interface AdminReservationsPageProps {
  searchParams: Promise<{
    status?: string | string[]
  }>
}

export const metadata = {
  title: 'Kelola Reservasi - FIVORA Admin',
  description:
    'Pemantauan dan rekap reservasi fasilitas kampus oleh administrator.',
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'menunggu':
      return 'Menunggu Persetujuan'
    case 'disetujui':
      return 'Disetujui'
    case 'ditolak':
      return 'Ditolak'
    case 'dibatalkan':
      return 'Dibatalkan'
    default:
      return status
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'menunggu':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'disetujui':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'ditolak':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'dibatalkan':
      return 'border-slate-200 bg-slate-100 text-slate-700'
    default:
      return 'border-slate-200 bg-white text-slate-700'
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default async function AdminReservationsPage({
  searchParams,
}: AdminReservationsPageProps) {
  await requireFacilityAdmin()

  const params = await searchParams
  const requestedStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status

  const activeTab: ReservationTab =
    requestedStatus === 'disetujui' ||
    requestedStatus === 'selesai'
      ? requestedStatus
      : 'menunggu'

  // Admin hanya membaca data reservasi.
  // Pemrosesan reservasi tetap menjadi tugas petugas.
  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      users:users!reservations_user_id_fkey(
        id,
        name,
        email
      ),
      facilities:facilities!reservations_facility_id_fkey(
        id,
        name,
        location,
        type,
        status
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('ADMIN RESERVATIONS QUERY ERROR:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
  }

  const reservations = (data ?? []) as Reservation[]

  const pendingCount = reservations.filter(
    (item) => item.status === 'menunggu'
  ).length

  const approvedCount = reservations.filter(
    (item) => item.status === 'disetujui'
  ).length

  const rejectedCount = reservations.filter(
    (item) => item.status === 'ditolak'
  ).length

  const cancelledCount = reservations.filter(
    (item) => item.status === 'dibatalkan'
  ).length

  const tabs: {
    key: ReservationTab
    label: string
    count: number
  }[] = [
    {
      key: 'menunggu',
      label: 'Menunggu Persetujuan',
      count: pendingCount,
    },
    {
      key: 'disetujui',
      label: 'Disetujui',
      count: approvedCount,
    },
    {
      key: 'selesai',
      label: 'Ditolak / Dibatalkan',
      count: rejectedCount + cancelledCount,
    },
  ]

  const filteredReservations = reservations.filter((item) => {
    if (activeTab === 'menunggu') {
      return item.status === 'menunggu'
    }

    if (activeTab === 'disetujui') {
      return item.status === 'disetujui'
    }

    return (
      item.status === 'ditolak' ||
      item.status === 'dibatalkan'
    )
  })

  const activeTabLabel =
    tabs.find((tab) => tab.key === activeTab)?.label ??
    'Menunggu Persetujuan'

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header halaman */}
      <header className="mb-7">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#22396f]">
          ADMINISTRATOR
        </p>

        <h1 className="text-2xl font-extrabold tracking-tight text-[#010736] sm:text-3xl">
          Kelola Reservasi
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52627d]">
          Pantau status pengajuan, reservasi yang disetujui,
          serta riwayat penolakan dan pembatalan.
        </p>
      </header>

      {/* Ringkasan total */}
      <div className="mb-6 rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-[#52627d]">
          Total Reservasi
        </p>

        <p className="mt-1 text-3xl font-extrabold text-[#010736]">
          {reservations.length}
        </p>

        <p className="mt-2 text-xs text-[#718097]">
          {pendingCount} menunggu · {approvedCount} disetujui
          {' · '}
          {rejectedCount + cancelledCount} ditolak atau dibatalkan
        </p>
      </div>

      {/* Tab status reservasi */}
      <nav
        aria-label="Filter status reservasi"
        className="mb-6 flex flex-wrap gap-2 border-b border-[#d8dfea] pb-3"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key

          return (
            <Link
              key={tab.key}
              href={`/admin/reservations?status=${tab.key}`}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                isActive
                  ? 'border-[#010736] bg-[#010736] text-white'
                  : 'border-[#d8dfea] bg-white text-[#52627d] hover:border-[#22396f] hover:bg-[#f7f9fc] hover:text-[#010736]'
              }`}
            >
              <span>{tab.label}</span>

              <span
                className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-[#f0f3f8] text-[#52627d]'
                }`}
              >
                {tab.count}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Judul daftar dan tombol muat ulang */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#010736]">
              {activeTabLabel}
            </h2>

            <p className="mt-1 text-sm text-[#52627d]">
              Menampilkan {filteredReservations.length} reservasi
              pada kategori ini.
            </p>
          </div>

          <Link
            href={`/admin/reservations?status=${activeTab}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d8dfea] bg-white px-3 py-2 text-xs font-bold text-[#010736] transition hover:border-[#22396f]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Muat Ulang
          </Link>
        </div>

        {/* Pesan error */}
        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            <p className="font-bold">
              Data reservasi gagal dimuat.
            </p>

            <p className="mt-2">{error.message}</p>

            <p className="mt-1 text-xs">
              Kode error: {error.code || '-'}
            </p>

            <p className="mt-3">
              Periksa pesan error pada terminal server dan coba muat
              ulang halaman.
            </p>
          </div>
        ) : filteredReservations.length === 0 ? (
          /* Tampilan kosong */
          <div className="rounded-2xl border border-dashed border-[#c9d2e0] bg-white px-6 py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-[#718097]" />

            <h3 className="mt-4 text-base font-bold text-[#010736]">
              Belum Ada Reservasi
            </h3>

            <p className="mt-2 text-sm text-[#52627d]">
              Tidak ada reservasi dalam kategori{' '}
              {activeTabLabel.toLowerCase()}.
            </p>
          </div>
        ) : (
          /* Daftar reservasi sesuai tab terpilih */
          <div className="space-y-4">
            {filteredReservations.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm transition hover:border-[#22396f]/50 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#52627d]">
                        ID: {item.id}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-extrabold text-[#010736]">
                      {item.facilities?.name ||
                        'Fasilitas tidak tersedia'}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#52627d]">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4 shrink-0" />
                        {item.users?.name ||
                          'Pengguna tidak ditemukan'}
                      </span>

                      {item.facilities?.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {item.facilities.location}
                        </span>
                      )}
                    </div>

                    {item.users?.email && (
                      <p className="mt-1 break-all text-xs text-[#718097]">
                        {item.users.email}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e7ebf1] pt-4 text-sm text-[#52627d]">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        {item.reservation_date}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0" />
                        {item.start_time.slice(0, 5)}–
                        {item.end_time.slice(0, 5)} WIB
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-[#fcf1d0]/60 p-3 text-sm text-[#52627d]">
                      <span className="font-bold text-[#010736]">
                        Tujuan:
                      </span>{' '}

                      <span className="whitespace-pre-line">
                        {item.purpose}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[#718097]">
                      Diajukan: {formatDateTime(item.created_at)} WIB
                    </p>

                    {item.rejection_reason && (
                      <p className="mt-2 rounded-lg border border-[#d8dfea] bg-[#f7f9fc] p-3 text-xs text-[#52627d]">
                        <span className="font-bold text-[#010736]">
                          Catatan:
                        </span>{' '}

                        {item.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 lg:justify-end">
                    <Link
                      href={`/admin/reservations/${item.id}`}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#010736] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d1c42] sm:w-auto"
                    >
                      Lihat Detail
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}