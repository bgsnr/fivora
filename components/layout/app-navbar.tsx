import FivoraLogo from '@/components/branding/fivora-logo'
import Link from 'next/link'

import { AccountInfo } from './account-info'
import { LogoutButton } from './logout-button'

export interface AppNavbarUser {
  name: string
  email: string
  role: 'pengguna' | 'petugas' | 'admin'
}

const STAFF_LINKS: Record<
  Exclude<AppNavbarUser['role'], 'pengguna'>,
  { href: string; label: string }[]
> = {
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
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#22396F]/15 bg-white">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-sm font-extrabold tracking-tight text-[#010736]"
        >
          <FivoraLogo compact />
        </Link>

        {user && user.role !== 'pengguna' && (
          <nav
            className="hidden items-center gap-7 text-xs font-semibold text-[#22396F] md:flex"
            aria-label="Navigasi utama"
          >
            {STAFF_LINKS[user.role].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[#010736]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <AccountInfo name={user.name} email={user.email} />

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
