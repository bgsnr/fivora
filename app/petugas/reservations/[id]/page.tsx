import Link from 'next/link'
import AutoRefresh from '@/components/layout/auto-refresh'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/landing/footer'
import { requireReportRole } from '@/lib/report-access'
import { getReservationById } from '@/lib/actions/reservations'
import {
  getDisplayStatusLabel,
  isReservationExpiredForApproval,
  parseTimeToMinutes,
} from '@/lib/validations/reservation-time'
import { checkFacilityConflict } from '@/lib/conflict-engine'
import { StaffActionPanel } from '@/components/reservations/staff-action-panel'
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  AlertTriangle,
  Info,
} from 'lucide-react'

interface StaffReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Proses Reservasi Petugas - FIVORA',
  description:
    'Verifikasi dan pemrosesan persetujuan reservasi fasilitas kampus.',
}

export default async function StaffReservationDetailPage({
  params,
}: StaffReservationDetailPageProps) {
  const { id } = await params
  await requireReportRole('petugas')

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
      ? `${durationHours} jam${
          durationRemMinutes > 0 ? ` ${durationRemMinutes} menit` : ''
        }`
      : `${durationRemMinutes} menit`

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#FCF1D0] selection:text-[#010736]">
      <AutoRefresh />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/petugas/reservations"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#010736] hover:text-[#22396F] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Antrean Petugas
          </Link>

          <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <span className="font-mono text-xs font-bold text-[#22396F]">
                PENGURUSAN RESERVASI #{reservation.id}
              </span>

              <h1 className="text-2xl font-bold text-[#010736]">
                {reservation.facilities?.name}
              </h1>
            </div>

            <span
              className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-auto ${
                reservation.status === 'disetujui'
                  ? displayInfo.isPast
                    ? 'bg-[#22396F]/10 text-[#22396F] border border-[#22396F]/20'
                    : 'bg-[#FCF1D0] text-[#010736] border border-[#22396F]/30'
                  : reservation.status === 'menunggu'
                  ? 'bg-[#FCF1D0] text-[#010736] border border-[#22396F]/30'
                  : reservation.status === 'ditolak'
                  ? 'bg-white text-[#010736] border border-[#010736]/30'
                  : 'bg-[#0D1C42]/10 text-[#22396F] border border-[#22396F]/20'
              }`}
            >
              {displayInfo.label}
            </span>
          </div>
        </div>

        {/* Konflik Warning Banner */}
        {approvedConflicts.length > 0 && reservation.status === 'menunggu' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#22396F]/30 bg-[#FCF1D0] p-4 text-xs text-[#010736]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#22396F]" />

            <div>
              <p className="font-bold text-[#010736]">
                Peringatan: Terdapat Bentrok dengan Jadwal yang Telah Disetujui
              </p>

              <p className="mt-1 text-[#22396F]">
                Fasilitas ini sudah terisi pada waktu yang beririsan oleh
                reservasi #{approvedConflicts[0].id} (
                {approvedConflicts[0].start_time.slice(0, 5)} -{' '}
                {approvedConflicts[0].end_time.slice(0, 5)} WIB).
              </p>
            </div>
          </div>
        )}

        {/* Card Detail Pengajuan */}
        <div className="mb-6 space-y-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-4 border-b border-border pb-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[#22396F]">
                Pemohon Fasilitas
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-[#010736]">
                <User className="h-4 w-4 text-[#22396F]" />
                {reservation.users?.name}
              </p>

              <p className="text-xs text-[#22396F]">
                {reservation.users?.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#22396F]">
                Waktu Masuk Antrean
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#010736]">
                {new Date(reservation.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-border pb-6 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[#22396F]">
                Tanggal Reservasi
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <Calendar className="h-4 w-4 text-[#22396F]" />
                {reservation.reservation_date}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#22396F]">
                Rentang Jam
              </p>

              <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-[#010736]">
                <Clock className="h-4 w-4 text-[#22396F]" />
                {reservation.start_time.slice(0, 5)} -{' '}
                {reservation.end_time.slice(0, 5)} WIB
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-[#22396F]">
                Durasi
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#010736]">
                {durationText}
              </p>
            </div>
          </div>

          <div className="border-b border-border pb-6">
            <p className="text-xs font-medium text-[#22396F]">
              Tujuan Penggunaan
            </p>

            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#010736]">
              {reservation.purpose}
            </p>
          </div>

          {reservation.rejection_reason && (
            <div className="rounded-xl border border-[#22396F]/30 bg-[#FCF1D0] p-4 text-xs text-[#22396F]">
              <span className="font-semibold text-[#010736]">
                Alasan{' '}
                {reservation.status === 'dibatalkan'
                  ? 'Pembatalan'
                  : 'Penolakan'}
                :
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

        <div className="flex items-start gap-2.5 rounded-xl border border-[#22396F]/20 bg-[#FCF1D0]/50 p-4 text-xs text-[#22396F]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#22396F]" />

          <div>
            <strong className="text-[#010736]">Panduan Petugas:</strong>{' '}
            Saat Anda menyetujui pengajuan ini, sistem secara otomatis menolak
            seluruh pengajuan lain yang statusnya masih menunggu dan waktunya
            bertabrakan pada fasilitas ini, dengan alasan &ldquo;jadwal telah
            terisi&rdquo;.
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}