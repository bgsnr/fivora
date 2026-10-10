import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireFacilityAdmin } from '@/lib/facility-access'
import {
  getReservationById as getReservationByIdRecord,
} from '@/lib/reservation-repository'

import {
  getDisplayStatusLabel,
  parseTimeToMinutes,
} from '@/lib/validations/reservation-time'

import { checkFacilityConflict } from '@/lib/conflict-engine'

import type { Reservation } from '@/types/reservation'

import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  ArrowLeft,
  AlertTriangle,
  Info,
} from 'lucide-react'

interface AdminReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Detail Reservasi - FIVORA Admin',
  description:
    'Detail dan pemantauan status reservasi fasilitas kampus oleh administrator.',
}

function getStatusClass(status: string, isPast: boolean) {
  if (status === 'disetujui') {
    return isPast
      ? 'border-[#22396f]/20 bg-[#22396f]/10 text-[#22396f]'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (status === 'menunggu') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }

  if (status === 'ditolak') {
    return 'border-red-200 bg-red-50 text-red-800'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export default async function AdminReservationDetailPage({
  params,
}: AdminReservationDetailPageProps) {
  await requireFacilityAdmin()

  const { id } = await params
  const reservationId = Number(id)

  if (
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(reservationId) ||
    reservationId <= 0
  ) {
    notFound()
  }

  let reservation: Reservation | null

  try {
    reservation = await getReservationByIdRecord(id)
  } catch (error) {
    console.error(
      'ADMIN RESERVATION DETAIL ERROR:',
      error
    )

    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#010736] hover:text-[#22396f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Reservasi Admin
        </Link>

        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
        >
          Data reservasi gagal dimuat. Silakan kembali ke daftar dan coba lagi.
        </div>
      </main>
    )
  }

  if (!reservation) {
    notFound()
  }

  const now = new Date()

  const approvedConflicts = await checkFacilityConflict(
    Number(reservation.facility_id),
    reservation.reservation_date,
    reservation.start_time,
    reservation.end_time,
    Number(reservation.id)
  )

  const displayInfo = getDisplayStatusLabel(
    {
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      end_time: reservation.end_time,
    },
    now
  )

  const startMin = parseTimeToMinutes(reservation.start_time)
  const endMin = parseTimeToMinutes(reservation.end_time)
  const durationMinutes = Math.max(0, endMin - startMin)
  const durationHours = Math.floor(durationMinutes / 60)
  const durationRemMinutes = durationMinutes % 60

  const durationText =
    durationHours > 0
      ? `${durationHours} jam${
          durationRemMinutes > 0
            ? ` ${durationRemMinutes} menit`
            : ''
        }`
      : `${durationRemMinutes} menit`

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#010736] transition hover:text-[#22396f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Reservasi Admin
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-bold text-[#22396f]">
              DETAIL RESERVASI #{reservation.id}
            </p>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#010736] sm:text-3xl">
              {reservation.facilities?.name || 'Fasilitas'}
            </h1>

            <p className="mt-2 text-sm text-[#52627d]">
              Informasi lengkap dan status reservasi untuk pemantauan administrator.
            </p>
          </div>

          <span
            className={`inline-flex self-start rounded-full border px-3 py-1.5 text-xs font-bold sm:self-auto ${getStatusClass(
              reservation.status,
              displayInfo.isPast
            )}`}
          >
            {displayInfo.label}
          </span>
        </div>
      </div>

      {approvedConflicts.length > 0 &&
        reservation.status === 'menunggu' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">
                Peringatan: Jadwal Berpotensi Bentrok
              </p>

              <p className="mt-1 leading-relaxed">
                Ditemukan reservasi yang sudah disetujui dan
                beririsan dengan jadwal pengajuan ini. Informasi
                ini ditampilkan untuk pemantauan administrator.
              </p>

              <p className="mt-2 text-xs">
                Salah satu reservasi yang bentrok adalah
                #{approvedConflicts[0].id}, pukul{' '}
                {approvedConflicts[0].start_time.slice(0, 5)}–
                {approvedConflicts[0].end_time.slice(0, 5)} WIB.
                Penanganan pengajuan tetap menjadi tugas petugas.
              </p>
            </div>
          </div>
        )}

      <section className="space-y-6 rounded-2xl border border-[#d8dfea] bg-white p-5 shadow-sm sm:p-8">
        {/* Pemohon dan waktu pengajuan */}
        <div className="grid grid-cols-1 gap-5 border-b border-[#e7ebf1] pb-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-[#718097]">
              Pemohon Fasilitas
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm font-bold text-[#010736]">
              <UserRound className="h-4 w-4 text-[#22396f]" />
              {reservation.users?.name || 'Pengguna'}
            </p>

            <p className="mt-1 break-all text-xs text-[#52627d]">
              {reservation.users?.email || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[#718097]">
              Waktu Pengajuan
            </p>

            <p className="mt-2 text-sm font-semibold text-[#010736]">
              {new Date(reservation.created_at).toLocaleString(
                'id-ID',
                {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }
              )}{' '}
              WIB
            </p>
          </div>
        </div>

        {/* Jadwal reservasi */}
        <div className="grid grid-cols-1 gap-5 border-b border-[#e7ebf1] pb-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-[#718097]">
              Tanggal Reservasi
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#010736]">
              <CalendarDays className="h-4 w-4 text-[#22396f]" />
              {reservation.reservation_date}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[#718097]">
              Rentang Jam
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#010736]">
              <Clock className="h-4 w-4 text-[#22396f]" />
              {reservation.start_time.slice(0, 5)}–
              {reservation.end_time.slice(0, 5)} WIB
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[#718097]">
              Durasi
            </p>

            <p className="mt-2 text-sm font-semibold text-[#010736]">
              {durationText}
            </p>
          </div>
        </div>

        {/* Lokasi fasilitas */}
        {reservation.facilities?.location && (
          <div className="border-b border-[#e7ebf1] pb-6">
            <p className="text-xs font-medium text-[#718097]">
              Lokasi Fasilitas
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#010736]">
              <MapPin className="h-4 w-4 text-[#22396f]" />
              {reservation.facilities.location}
            </p>
          </div>
        )}

        {/* Tujuan reservasi */}
        <div className="border-b border-[#e7ebf1] pb-6">
          <p className="text-xs font-medium text-[#718097]">
            Tujuan Penggunaan
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#010736]">
            {reservation.purpose}
          </p>
        </div>

        {/* Alasan penolakan atau pembatalan */}
        {reservation.rejection_reason && (
          <div className="rounded-xl border border-[#d8dfea] bg-[#f7f9fc] p-4">
            <p className="text-xs font-bold text-[#010736]">
              Catatan Pemrosesan
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#52627d]">
              {reservation.rejection_reason}
            </p>
          </div>
        )}
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#22396f]/20 bg-[#fcf1d0]/50 p-4 text-xs leading-relaxed text-[#52627d]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#22396f]" />

        <p>
          Halaman ini digunakan untuk memantau informasi, status,
          dan riwayat reservasi. Persetujuan, penolakan, serta
          penanganan pembatalan reservasi dilakukan oleh petugas
          sesuai hak aksesnya.
        </p>
      </div>
    </main>
  )
}