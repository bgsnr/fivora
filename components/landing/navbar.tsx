import Link from 'next/link'
import Image from 'next/image'

import { LogoutButton } from '@/components/layout/logout-button'

export interface NavbarUser {
  name: string
  role: 'pengguna' | 'petugas' | 'admin'
}

export function Navbar({ user }: { user?: NavbarUser | null }) {
  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'U'
    : 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#22396F]/15 bg-white">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center">
          <Image
            src="/fivora-logo.png"
            alt="Fivora - Facility & Venue Reservation"
            width={155}
            height={160}
            className="h-[160px] w-[155px] object-contain"
          />
        </Link>

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
            href="/reservations"
            className="transition-colors hover:text-[#010736]"
          >
            Reservasi
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full border border-[#D8DFEA] bg-[#F9FAFC] p-1.5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#010736] text-xs font-bold text-white">
                  {initials}
                </div>
              </div>

              <LogoutButton />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  )
}