'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarRange,
  History,
  House,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  userName?: string
}

const navItems = [
  { label: 'Katalog Ruang', href: '/catalog', icon: CalendarRange },
  { label: 'Riwayat Reservasi', href: '/history', icon: History },
  { label: 'Pengaturan', href: '/settings', icon: Settings },
  { label: 'Kembali ke Halaman Utama', href: '/', icon: House },
]

export function AppLayout({ children, userName = 'Pengguna' }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const theme = window.localStorage.getItem('fivora-theme') || 'system'
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const activeDark = theme === 'dark' || (theme === 'system' && prefersDark)

    root.classList.toggle('dark', activeDark)
    window.localStorage.setItem('fivora-theme', theme)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      window.localStorage.removeItem('fivora-theme')
      router.push('/login')
      router.refresh()
    } catch {
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-[var(--border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-5 lg:p-6">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-accent)]/40 p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sidebar-primary)] text-2xl text-[var(--sidebar-primary-foreground)] shadow-inner">
                <UserCircle2 className="h-8 w-8" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--sidebar-foreground)]/70">
                  Selamat datang
                </p>
                <h2 className="mt-1 text-xl font-bold leading-tight">Halo, {userName}</h2>
              </div>
            </div>

            <nav className="mt-8 space-y-2" aria-label="Sidebar navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-sm'
                        : 'text-[var(--sidebar-foreground)]/80 hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-foreground)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto pt-8">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--sidebar-border)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)] disabled:opacity-70"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? 'Keluar...' : 'Keluar'}
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-[var(--background)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
