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
      <div
        className={`container mx-auto flex max-w-7xl items-center justify-between gap-x-3 px-4 sm:px-6 lg:px-8 ${
          user
            ? 'min-h-16 flex-wrap py-2 lg:h-16 lg:flex-nowrap lg:py-0'
            : 'h-16'
        }`}
      >
        <Link
          href={user?.role === 'petugas' ? '/petugas' : '/'}
          className="text-sm font-extrabold tracking-tight text-[#010736]"
        >
          <FivoraLogo compact />
        </Link>

        {user && user.role !== 'pengguna' && (
          <nav
            className={
              user.role === 'petugas'
                ? 'order-last flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#D8DFEA] pt-3 pb-1 text-xs font-semibold text-[#22396F] lg:order-none lg:w-auto lg:border-0 lg:p-0'
                : 'hidden items-center gap-7 text-xs font-semibold text-[#22396F] md:flex'
            }
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

        <div className="flex min-w-0 items-center gap-2">
          {user ? (
            <>
              <AccountInfo name={user.name} email={user.email} showName />

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
