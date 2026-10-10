import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { canCreateReservation } from '@/lib/reservation-access'

type HeroUser = { role: string; status: string } | null

export function Hero({ user = null }: { user?: HeroUser }) {
  const staff = user?.role === 'petugas' || user?.role === 'admin'
  const reservationHref = canCreateReservation(user)
    ? '/catalog'
    : '/login?redirect=%2Fcatalog'
  const primaryClass = 'inline-flex min-h-12 items-center justify-center rounded-full bg-[#010736] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#010736]/15 transition-colors hover:bg-[#0D1C42]'

  return (
    <section className="relative overflow-hidden border-b border-[#D8DFEA] py-16 lg:py-24">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px]"
        style={{ backgroundImage: 'url("/wp.png")', opacity: 0.5, transform: 'scale(1.03)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/65" aria-hidden="true" />

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22396F]/20 bg-white/90 px-3 py-1.5 text-xs font-medium text-[#010736]">
            <span className="size-2 rounded-full bg-[#010736]" aria-hidden="true" />
            FASILITAS KAMPUS DALAM SATU TEMPAT
          </p>

          <h1 className="text-balance font-heading text-4xl font-extrabold leading-[1.08] tracking-[-0.03em] text-[#010736] sm:text-6xl lg:text-[68px]">
            Reservasi Ruang dan Peralatan Kampus,{' '}
            <span className="text-[#22396F]">Tanpa Bentrok Jadwal.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#3F506E] sm:text-lg">
            Pilih fasilitas untuk kegiatanmu, ajukan jadwal penggunaan,
            dan pantau hasilnya. Menemukan kerusakan? Kirim laporan agar
            petugas bisa menindaklanjutinya.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {staff ? (
              <button type="button" disabled className={`${primaryClass} cursor-not-allowed opacity-55`}>
                Buat Reservasi
              </button>
            ) : (
              <Link href={reservationHref} className={primaryClass}>Buat Reservasi</Link>
            )}

            <Link
              href={staff ? (user.role === 'petugas' ? '/petugas' : '/admin') : '/laporan/buat'}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#22396F]/25 bg-white/90 px-6 py-3 text-sm font-medium text-[#010736] transition-colors hover:bg-[#FCF1D0]"
            >
              {staff ? 'Buka Ruang Kerja' : 'Lapor Kerusakan'}
              <ArrowUpRight className="size-4 text-[#22396F]" aria-hidden="true" />
            </Link>
          </div>
          {staff && <p className="mt-4 text-sm text-[#3F506E]">Reservasi hanya dapat diajukan melalui akun pengguna.</p>}
        </div>
      </div>
    </section>
  )
}
