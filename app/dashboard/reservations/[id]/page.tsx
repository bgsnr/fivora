import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { getCurrentUser } from '@/lib/auth'
import { getReservationById } from '@/lib/actions/reservations'
import {
  getDisplayStatusLabel,
  isReservationExpiredForApproval,
  parseTimeToMinutes,
} from '@/lib/validations/reservation-time'
import { checkFacilityConflict } from '@/lib/conflict-engine'
import { StaffActionPanel } from '@/components/reservations/staff-action-panel'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react'

interface StaffReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Proses Reservasi Petugas - FIVORA',
  description: 'Verifikasi dan pemrosesan persetujuan reservasi fasilitas kampus.',
}

export default async function StaffReservationDetailPage({
  params,
}: StaffReservationDetailPageProps) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user || (user.role !== 'petugas' && user.role !== 'admin')) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-red-950">Akses Dibatasi (403)</h1>
            <p className="text-sm text-red-800 mt-2">
              Hanya staf Petugas atau Admin yang memiliki akses memproses reservasi ini.
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

  const reservation = await getReservationById(id)
  if (!reservation) {
    notFound()
  }

  const now = new Date()
  const isExpired = isReservationExpiredForApproval(
    {
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
    },
    now
  )

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
            href="/dashboard/reservations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5318eb] hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Antrean Petugas
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
            <div>
              <span className="font-mono text-xs font-bold text-[#4a454d]">
                PENGURUSAN RESERVASI #{reservation.id}
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

        {/* Konflik Warning Banner */}
        {approvedConflicts.length > 0 && reservation.status === 'menunggu' && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-950">
                Peringatan: Terdapat Bentrok dengan Jadwal yang Telah Disetujui
              </p>
              <p className="mt-1">
                Fasilitas ini sudah terisi pada waktu yang beririsan oleh reservasi #{approvedConflicts[0].id} ({approvedConflicts[0].start_time.slice(0, 5)} - {approvedConflicts[0].end_time.slice(0, 5)} WIB).
              </p>
            </div>
          </div>
        )}

        {/* Card Detail Pengajuan */}
        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Pemohon Fasilitas</p>
              <p className="text-sm font-bold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <User className="h-4 w-4 text-slate-400" />
                {reservation.users?.name}
              </p>
              <p className="text-xs text-[#4a454d]">{reservation.users?.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Waktu Masuk Antrean</p>
              <p className="text-sm font-semibold text-[#0c021c] mt-0.5">
                {new Date(reservation.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Tanggal Reservasi</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-[#5318eb]" />
                {reservation.reservation_date}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Rentang Jam</p>
              <p className="text-sm font-semibold text-[#0c021c] flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4 text-[#5318eb]" />
                {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)} WIB
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#4a454d]">Durasi</p>
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

          {reservation.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900">
              <span className="font-semibold text-red-950">
                Alasan {reservation.status === 'dibatalkan' ? 'Pembatalan' : 'Penolakan'}:
              </span>{' '}
              {reservation.rejection_reason}
            </div>
          )}

          {/* Panel Aksi Petugas */}
          <div className="pt-2">
            <StaffActionPanel
              reservationId={Number(reservation.id)}
              currentStatus={reservation.status}
              isExpired={isExpired}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-[#4a454d] flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
          <div>
            <strong>Panduan Petugas:</strong> Saat Anda menyetujui pengajuan ini, sistem secara otomatis menolak seluruh pengajuan lain yang statusnya masih menunggu dan waktunya bertabrakan pada fasilitas ini, dengan alasan &ldquo;jadwal telah terisi&rdquo;.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
