import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#22396F]/15 bg-white">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo Fivora */}
        <Link href="/" className="group flex items-center">
          <Image
            src="/fivora-logo.png"
            alt="Fivora - Facility & Venue Reservation"
            width={155}
            height={160}
            className="h-[160px] w-[155px] object-contain"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-7 text-xs font-semibold text-[#22396F] md:flex">
          <Link
            href="#katalog"
            className="transition-colors hover:text-[#010736]"
          >
            Katalog Fasilitas
          </Link>

          <Link
            href="#ketentuan"
            className="transition-colors hover:text-[#010736]"
          >
            Jam Operasional & Aturan
          </Link>

          <Link
            href="#alur"
            className="transition-colors hover:text-[#010736]"
          >
            Alur Layanan
          </Link>

          <Link
            href="/reservationsGet"
            className="transition-colors hover:text-[#010736]"
          >
            Reservasi
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-xs font-semibold text-[#010736] transition-colors hover:bg-[#FCF1D0]/70"
          >
            Masuk
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-[#010736] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0D1C42]"
          >
            Daftar
          </Link>
        </div>

      </div>
    </header>
  )
}