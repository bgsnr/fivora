import Link from 'next/link'
import Image from 'next/image'
import { AccountInfo } from '@/components/layout/account-info'
import { LogoutButton } from '@/components/layout/logout-button'

export interface NavbarUser {
  name: string
  email: string
  role: 'pengguna' | 'petugas' | 'admin'
}

const sectionLinks = [
  { href: '/#katalog', label: 'Katalog Fasilitas' },
  { href: '/#alur', label: 'Alur Layanan' },
  { href: '/#ketentuan', label: 'Jam Layanan & Aturan' },
]

export function Navbar({ user }: { user?: NavbarUser | null }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#22396F]/15 bg-white">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center">
          <Image
            src="/fivora-logo.png"
            alt="Fivora - Facility & Venue Reservation"
            width={155}
            height={160}
            className="h-[160px] w-[128px] object-contain sm:w-[155px]"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-xs font-semibold text-[#22396F] lg:flex" aria-label="Bagian halaman utama">
          {sectionLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[#010736]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <AccountInfo name={user.name} email={user.email} />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-xs font-semibold text-[#010736] transition-colors hover:bg-[#FCF1D0]/70 sm:px-4">
                Masuk
              </Link>
              <Link href="/register" className="rounded-full bg-[#010736] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0D1C42] sm:px-5">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
