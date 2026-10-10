'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  UserCheck,
  X,
} from 'lucide-react'

import styles from './admin-shell.module.css'

type AdminShellProps = {
  adminName: string
  children: React.ReactNode
}

type MenuItem = {
  label: string
  href: string
  icon: React.ReactNode
  active: (pathname: string, hash: string) => boolean
}

export default function AdminShell({
  adminName,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const [currentHash, setCurrentHash] = useState('')

  useEffect(() => {
    function syncHash() {
      setCurrentHash(window.location.hash)
    }

    syncHash()

    window.addEventListener('hashchange', syncHash)

    return () => {
      window.removeEventListener('hashchange', syncHash)
    }
  }, [pathname])

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={18} />,
      active: (path, hash) =>
        path === '/admin' &&
        !['#verifikasi', '#akun'].includes(hash),
    },
    {
      label: 'Verifikasi Akun',
      href: '/admin#verifikasi',
      icon: <UserCheck size={18} />,
      active: (path, hash) =>
        path === '/admin' && hash === '#verifikasi',
    },
    {
      label: 'Daftar Akun',
      href: '/admin#akun',
      icon: <Users size={18} />,
      active: (path, hash) =>
        path === '/admin' && hash === '#akun',
    },
    {
      label: 'Fasilitas',
      href: '/admin/fasilitas',
      icon: <Building2 size={18} />,
      active: (path) =>
        path.startsWith('/admin/fasilitas'),
    },
    {
      label: 'Reservasi',
      href: '/admin/reservations',
      icon: <CalendarDays size={18} />,
      active: (path) =>
        path.startsWith('/admin/reservations'),
    },
    {
      label: 'Laporan Kerusakan',
      href: '/admin/laporan',
      icon: <ClipboardList size={18} />,
      active: (path) =>
        path.startsWith('/admin/laporan'),
    },
    {
      label: 'Rekap & Export',
      href: '/admin/recap',
      icon: <FileSpreadsheet size={18} />,
      active: (path) =>
        path.startsWith('/admin/recap'),
    },
  ]

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        console.error('Logout gagal.')
        return
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('LOGOUT ERROR:', error)
    }
  }

  const initial = adminName.charAt(0).toUpperCase()

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.sidebarCollapsed : ''
        }`}
      >
        <div className={styles.brand}>
          <Link href="/admin" aria-label="Dashboard Fivora">
            <img
              src="/fivora-logo.png"
              alt="Fivora"
              className={styles.brandLogo}
            />
          </Link>
        </div>

        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={() =>
            setSidebarCollapsed((current) => !current)
          }
          aria-label={
            sidebarCollapsed
              ? 'Buka sidebar'
              : 'Ciutkan sidebar'
          }
          title={
            sidebarCollapsed
              ? 'Buka sidebar'
              : 'Ciutkan sidebar'
          }
        >
          {sidebarCollapsed ? (
            <Menu size={17} />
          ) : (
            <X size={17} />
          )}
        </button>

        <nav className={styles.nav} aria-label="Navigasi admin">
          {menuItems.map((item) => {
            const isActive = item.active(
              pathname,
              currentHash
            )

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${
                  isActive ? styles.navItemActive : ''
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={
                  sidebarCollapsed ? item.label : undefined
                }
              >
                <span className={styles.navIcon}>
                  {item.icon}
                </span>

                <span className={styles.navLabel}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminProfile}>
            <div className={styles.avatar}>
              {initial}
            </div>

            <div className={styles.profileText}>
              <strong>{adminName}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <main
        className={`${styles.contentArea} ${
          sidebarCollapsed ? styles.contentExpanded : ''
        } ${
          pathname === '/admin' ? styles.dashboardWorkspace : ''
        }`}
      >
        {children}
      </main>
    </div>
  )
}