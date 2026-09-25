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
  description: 'Rincian data pengajuan reservasi fasilitas kampus.',
}

export default async function ReservationDetailPage({
  params,
}: ReservationDetailPageProps) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-2xl border border-border bg-white p-8">
            <h1 className="text-xl font-bold text-[#0c021c]">Perlu Masuk Akun</h1>
            <p className="text-sm text-[#4a454d] mt-2">
              Silakan login terlebih dahulu untuk mengakses rincian reservasi.
            </p>
            <Link href="/login" className="mt-5 inline-block">
              <Button className="bg-[#5318eb] text-white">Masuk</Button>
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
  const isOwner = String(user.id) === String(reservation.user_id)
  const isStaffOrAdmin = user.role === 'petugas' || user.role === 'admin'

  if (!isOwner && !isStaffOrAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-red-950">Akses Ditolak (403)</h1>
            <p className="text-sm text-red-800 mt-2">
              Anda tidak memiliki izin untuk melihat data reservasi milik pengguna lain.
            </p>
            <div className="mt-6">
              <Link href="/reservations">
                <Button variant="outline" className="border-red-200 text-red-800">
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

  const startMin = parseTimeToMinutes(reservation.start_time)
  const endMin = parseTimeToMinutes(reservation.end_time)
  const durationMinutes = endMin - startMin
  const durationHours = Math.floor(durationMinutes / 60)
  const durationRemMinutes = durationMinutes % 60
  const durationText =
    durationHours > 0
      ? `${durationHours} jam${durationRemMinutes > 0 ? ` ${durationRemMinutes} menit` : ''}`
      : `${durationRemMinutes} menit`

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5318eb] hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Reservasi
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <div>
              <span className="font-mono text-xs font-bold text-[#4a454d]">
                KODE RESERVASI #{reservation.id}
              </span>
              <h1 className="text-2xl font-bold text-[#0c021c]">
                {reservation.facilities?.name}
              </h1>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold self-start sm:self-auto ${
                reservation.status === 'disetujui'
                  ? displayInfo.isPast
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : reservation.status === 'menunggu'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : reservation.status === 'ditolak'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {displayInfo.label}
            </span>
          </div>
        </div>

        {/* Card Rincian */}
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Lokasi Fasilitas</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-4 w-4 text-[#5318eb]" />
                {reservation.facilities?.location || 'Kampus Universitas'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Tipe Fasilitas</p>
              <p className="text-sm font-semibold text-[#0c021c] mt-0.5 capitalize">
                {reservation.facilities?.type || 'Umum'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Tanggal Penggunaan</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-[#5318eb]" />
                {reservation.reservation_date}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Waktu Peminjaman</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4 text-[#5318eb]" />
                {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)} WIB
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Total Durasi</p>
              <p className="text-sm font-semibold text-[#0c021c] mt-0.5">
                {durationText}
              </p>
            </div>
          </div>

          <div className="pb-6 border-b border-border">
            <p className="text-xs font-medium text-[#4a454d]">Tujuan Penggunaan</p>
            <p className="text-sm text-[#0c021c] mt-1 whitespace-pre-line leading-relaxed">
              {reservation.purpose}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Nama Pemesan</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <User className="h-4 w-4 text-slate-400" />
                {reservation.users?.name || 'Pengguna'} ({reservation.users?.email})
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Waktu Pengajuan Dibuat</p>
              <p className="text-sm font-semibold text-[#0c021c] mt-0.5">
                {new Date(reservation.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })} WIB
              </p>
            </div>
          </div>

          {reservation.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-900">
              <p className="font-semibold text-red-950 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-600" />
                Catatan / Alasan {reservation.status === 'dibatalkan' ? 'Pembatalan' : 'Penolakan'}:
              </p>
              <p className="mt-1 text-red-900">{reservation.rejection_reason}</p>
            </div>
          )}

          {reservation.processed_at && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-[#4a454d]">
              <p className="font-semibold text-[#0c021c]">Informasi Pemrosesan Petugas:</p>
              <p className="mt-0.5">
                Diproses pada{' '}
                {new Date(reservation.processed_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-[#4a454d]">
              {cancelEligibility.allowed ? (
                <span className="text-emerald-700 font-medium">
                  Pengajuan masih memenuhi syarat untuk dibatalkan jika diperlukan.
                </span>
              ) : reservation.status === 'menunggu' || reservation.status === 'disetujui' ? (
                <span className="text-amber-800">
                  {cancelEligibility.reason}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {isOwner && cancelEligibility.allowed && (
                <CancelReservationButton
                  reservationId={Number(reservation.id)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-[#4a454d] flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
          <div>
            <strong>Ketentuan Perubahan:</strong> Reservasi yang telah diajukan tidak dapat diubah secara langsung. Jika Anda memerlukan perubahan jadwal atau fasilitas, batalkan reservasi ini terlebih dahulu (maksimal 3 jam sebelum jadwal) lalu ajukan jadwal baru.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
