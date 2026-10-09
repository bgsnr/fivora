import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getReservationById } from '@/lib/actions/reservations'
import {
  getDisplayStatusLabel,
  parseTimeToMinutes,
  canUserCancelReservation,
  getMinutesUntilStart,
  formatMinutesRemaining,
} from '@/lib/validations/reservation-time'
import { CancelReservationButton } from '@/components/reservations/cancel-button'
import { Button } from '@/components/ui/button'

import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  ShieldAlert,
  XCircle,
  Info,
} from 'lucide-react'

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Detail Reservasi - FIVORA',
  description:
    'Rincian data pengajuan reservasi fasilitas kampus.',
}

export default async function ReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { id } = await params

  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
        <Navbar />

        <main className="container mx-auto flex max-w-3xl flex-1 items-center justify-center px-4 py-16 text-center">
          <div className="rounded-2xl border border-[#D8DFEA] bg-white p-8">
            <h1 className="text-xl font-bold text-[#010736]">
              Perlu Masuk Akun
            </h1>

            <p className="mt-2 text-sm text-[#52627D]">
              Silakan login terlebih dahulu untuk mengakses
              rincian reservasi.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block"
            >
              <Button className="bg-[#010736] text-white hover:bg-[#0D1C42]">
                Masuk
              </Button>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  const reservation = await getReservationById(id)

  if (!reservation) {
    notFound()
  }

  // Proteksi Akses Pengguna
  const isOwner =
    String(user.id) === String(reservation.user_id)

  const isStaffOrAdmin =
    user.role === 'petugas' ||
    user.role === 'admin'

  if (!isOwner && !isStaffOrAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F9FC]">
        <Navbar />

        <main className="container mx-auto flex max-w-md flex-1 items-center justify-center px-4 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <ShieldAlert className="mx-auto mb-3 h-12 w-12 text-red-600" />

            <h1 className="text-xl font-bold text-red-950">
              Akses Ditolak (403)
            </h1>

            <p className="mt-2 text-sm text-red-800">
              Anda tidak memiliki izin untuk melihat data
              reservasi milik pengguna lain.
            </p>

            <div className="mt-6">
              <Link href="/history">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-100"
                >
                  Kembali ke Riwayat Saya
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  const now = new Date()

  const displayInfo = getDisplayStatusLabel(
    {
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      end_time: reservation.end_time,
    },
    now
  )

  const cancelEligibility = canUserCancelReservation(
    {
      user_id: Number(reservation.user_id),
      status: reservation.status,
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
    },
    Number(user.id),
    now
  )

  const minutesUntilStart = getMinutesUntilStart(
    {
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
    },
    now
  )

  const startMin = parseTimeToMinutes(
    reservation.start_time
  )

  const endMin = parseTimeToMinutes(
    reservation.end_time
  )

  const durationMinutes = endMin - startMin
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
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar
        user={
          user
            ? { name: user.name, role: user.role }
            : null
        }
      />

      <main className="container mx-auto max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/history"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#22396F] hover:text-[#010736] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Reservasi
          </Link>

          <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="font-mono text-xs font-bold text-[#718097]">
                KODE RESERVASI #{reservation.id}
              </span>

              <h1 className="text-2xl font-bold text-[#010736]">
                {reservation.facilities?.name}
              </h1>
            </div>

            <span
              className={`inline-flex self-start items-center rounded-full border px-3 py-1 text-xs font-semibold sm:self-auto ${
                reservation.status === 'disetujui'
                  ? displayInfo.isPast
                    ? 'border-slate-200 bg-slate-100 text-slate-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : reservation.status === 'menunggu'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : reservation.status === 'ditolak'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
            >
              {displayInfo.label}
            </span>
          </div>
        </div>

        {/* Card Rincian */}
        <div className="space-y-6 rounded-2xl border border-[#D8DFEA] bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-4 border-b border-[#D8DFEA] pb-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Lokasi Fasilitas
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <MapPin className="h-4 w-4 text-[#22396F]" />
                {reservation.facilities?.location ||
                  'Kampus Universitas'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Tipe Fasilitas
              </p>

              <p className="mt-0.5 text-sm font-semibold capitalize text-[#010736]">
                {reservation.facilities?.type ||
                  'Umum'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-[#D8DFEA] pb-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Tanggal Penggunaan
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <Calendar className="h-4 w-4 text-[#22396F]" />
                {reservation.reservation_date}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Waktu Peminjaman
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <Clock className="h-4 w-4 text-[#22396F]" />
                {reservation.start_time.slice(0, 5)} -{' '}
                {reservation.end_time.slice(0, 5)} WIB
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Total Durasi
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#010736]">
                {durationText}
              </p>
            </div>
          </div>

          <div className="border-b border-[#D8DFEA] pb-6">
            <p className="text-xs font-medium text-[#52627D]">
              Tujuan Penggunaan
            </p>

            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#010736]">
              {reservation.purpose}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-[#D8DFEA] pb-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Nama Pemesan
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <User className="h-4 w-4 text-[#718097]" />
                {reservation.users?.name ||
                  'Pengguna'}{' '}
                ({reservation.users?.email})
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#52627D]">
                Waktu Pengajuan Dibuat
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#010736]">
                {new Date(
                  reservation.created_at
                ).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          {reservation.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900">
              <p className="flex items-center gap-1.5 font-semibold text-red-950">
                <XCircle className="h-4 w-4 text-red-600" />

                Catatan / Alasan{' '}
                {reservation.status === 'dibatalkan'
                  ? 'Pembatalan'
                  : 'Penolakan'}
                :
              </p>

              <p className="mt-1 text-red-900">
                {reservation.rejection_reason}
              </p>
            </div>
          )}

          {reservation.processed_at && (
            <div className="rounded-xl border border-[#D8DFEA] bg-[#F8FAFC] p-4 text-xs text-[#52627D]">
              <p className="font-semibold text-[#010736]">
                Informasi Pemrosesan Petugas:
              </p>

              <p className="mt-0.5">
                Diproses pada{' '}
                {new Date(
                  reservation.processed_at
                ).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB.
              </p>
            </div>
          )}

          <div className="flex flex-col items-start justify-between gap-4 pt-2 sm:flex-row sm:items-center">
            <div className="text-xs text-[#52627D]">
              {cancelEligibility.allowed ? (
                <span className="font-medium text-emerald-700">
                  Pengajuan masih memenuhi syarat untuk
                  dibatalkan jika diperlukan (sisa waktu{' '}
                  {formatMinutesRemaining(
                    minutesUntilStart
                  )}
                  , batas paling lambat 3 jam sebelum
                  waktu mulai).
                </span>
              ) : reservation.status === 'menunggu' ||
                reservation.status === 'disetujui' ? (
                <span className="text-amber-800">
                  {cancelEligibility.reason}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {isOwner &&
                (reservation.status === 'menunggu' ||
                  reservation.status ===
                    'disetujui') && (
                  <CancelReservationButton
                    reservationId={Number(
                      reservation.id
                    )}
                    disabledReason={
                      cancelEligibility.allowed
                        ? null
                        : (cancelEligibility.reason ??
                          'Reservasi tidak dapat dibatalkan')
                    }
                    minutesUntilStart={
                      minutesUntilStart
                    }
                  />
                )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#D8DFEA] bg-[#F8FAFC] p-4 text-xs text-[#52627D]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#22396F]" />

          <div>
            <strong className="text-[#010736]">
              Ketentuan Perubahan:
            </strong>{' '}
            Reservasi yang telah diajukan tidak dapat
            diubah secara langsung. Jika Anda memerlukan
            perubahan jadwal atau fasilitas, batalkan
            reservasi ini terlebih dahulu (maksimal 3 jam
            sebelum jadwal) lalu ajukan jadwal baru.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}