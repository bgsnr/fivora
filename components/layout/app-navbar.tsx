import Link from 'next/link'

import { LogoutButton } from './logout-button'

export interface AppNavbarUser {
  name: string
  role: 'pengguna' | 'petugas' | 'admin'
}

const ROLE_LINKS: Record<
  AppNavbarUser['role'],
  { href: string; label: string }[]
> = {
  pengguna: [
    { href: '/fasilitas', label: 'Fasilitas' },
    { href: '/reservations/new', label: 'Ajukan Reservasi' },
    { href: '/reservations', label: 'Riwayat Reservasi' },
    { href: '/laporan', label: 'Laporan Saya' },
  ],
  petugas: [
    { href: '/petugas', label: 'Beranda Petugas' },
    { href: '/petugas/reservations', label: 'Antrean Reservasi' },
    { href: '/petugas/laporan', label: 'Antrean Laporan' },
    { href: '/petugas/fasilitas', label: 'Fasilitas' },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard Admin' },
    { href: '/admin/fasilitas', label: 'Fasilitas' },
    { href: '/admin/recap', label: 'Rekap & Ekspor' },
  ],
}

export function AppNavbar({ user }: { user: AppNavbarUser | null }) {
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
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-tight text-[#010736]"
        >
          FIVORA<span className="text-[#22396F]">.</span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-xs font-semibold text-[#22396F] md:flex"
          aria-label="Navigasi utama"
        >
          {user
            ? ROLE_LINKS[user.role]?.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-[#010736]"
                >
                  {link.label}
                </Link>
              ))
            : (
              <>
                <Link
                  href="/fasilitas"
                  className="transition-colors hover:text-[#010736]"
                >
                  Fasilitas
                </Link>
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
