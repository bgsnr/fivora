'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

import RegistrationList from './registration-list'
import styles from './admin-dashboard.module.css'

type PendingUser = {
  id: number
  auth_user_id: string
  name: string
  email: string
  nim_nip: string | null
  jenis_pengguna: string
  role: string
  status: string
  created_at: string
}

type AdminDashboardProps = {
  adminName: string
  totalUsers: number
  pendingCount: number
  totalOperators: number
  pendingUsers: PendingUser[]
}

export default function AdminDashboard({
  adminName,
  totalUsers,
  pendingCount,
  totalOperators,
  pendingUsers,
}: AdminDashboardProps) {
  const router = useRouter()

  // State modal tambah operator
  const [showOperatorForm, setShowOperatorForm] =
    useState(false)

  const [operatorName, setOperatorName] = useState('')
  const [operatorEmail, setOperatorEmail] = useState('')
  const [operatorPassword, setOperatorPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [operatorLoading, setOperatorLoading] =
    useState(false)

  const [operatorError, setOperatorError] =
    useState('')

  const [operatorMessage, setOperatorMessage] =
    useState('')

  function openOperatorForm() {
    setOperatorError('')
    setOperatorMessage('')
    setShowOperatorForm(true)
  }

  function closeOperatorForm() {
    if (operatorLoading) {
      return
    }

    setShowOperatorForm(false)
    setOperatorError('')
    setOperatorMessage('')
  }

  async function handleCreateOperator(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setOperatorError('')
    setOperatorMessage('')

    const cleanName = operatorName.trim()
    const cleanEmail = operatorEmail
      .trim()
      .toLowerCase()

    // Validasi client
    if (
      !cleanName ||
      !cleanEmail ||
      !operatorPassword
    ) {
      setOperatorError(
        'Nama, email, dan password wajib diisi.'
      )
      return
    }

    if (operatorPassword.length < 6) {
      setOperatorError(
        'Password minimal 6 karakter.'
      )
      return
    }

    // Validasi format email operator dari sisi client
    if (!cleanEmail.endsWith('@operator.undip.ac.id')) {
      setOperatorError(
        'Email operator harus menggunakan @operator.undip.ac.id.'
      )
      return
    }

    setOperatorLoading(true)

    try {
      const response = await fetch(
        '/api/admin/operators',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: operatorPassword,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setOperatorError(
          result.error ||
            'Gagal membuat akun operator.'
        )
        return
      }

      setOperatorMessage(
        'Akun operator berhasil dibuat dan langsung aktif.'
      )

      // Kosongkan form
      setOperatorName('')
      setOperatorEmail('')
      setOperatorPassword('')
      setShowPassword(false)

      // Refresh data dashboard
      router.refresh()
    } catch (error) {
      console.error(
        'CREATE OPERATOR ERROR:',
        error
      )

      setOperatorError(
        'Terjadi kesalahan. Silakan coba lagi.'
      )
    } finally {
      setOperatorLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        setOperatorError('Logout gagal.')
        return
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('LOGOUT ERROR:', error)
    }
  }

  function scrollToSection(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: 'smooth',
      })
  }

  return (
    <main className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandDot} />
          <span>Fivora</span>
        </div>

        <nav className={styles.nav}>
          <a
            href="#dashboard"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span>⌂</span>
            <span>Dashboard</span>
          </a>

          <a
            href="#verifikasi"
            className={styles.navItem}
          >
            <span>✓</span>
            <span>Verifikasi Akun</span>

            {pendingCount > 0 && (
              <span className={styles.navBadge}>
                {pendingCount}
              </span>
            )}
          </a>

          <button
            type="button"
            className={styles.navItem}
            onClick={openOperatorForm}
          >
            <span>+</span>
            <span>Tambah Operator</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              scrollToSection('pengguna')
            }
          >
            <span>◉</span>
            <span>Pengguna</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              scrollToSection('fasilitas')
            }
          >
            <span>▣</span>
            <span>Fasilitas</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              scrollToSection('reservasi')
            }
          >
            <span>◷</span>
            <span>Reservasi</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              scrollToSection('laporan')
            }
          >
            <span>⚠</span>
            <span>Laporan</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              scrollToSection('rekap')
            }
          >
            <span>▤</span>
            <span>Rekap & Export</span>
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminProfile}>
            <div className={styles.avatar}>
              {adminName.charAt(0).toUpperCase()}
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
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <section className={styles.content}>
        <header
          id="dashboard"
          className={styles.topbar}
        >
          <div>
            <p className={styles.eyebrow}>
              ADMINISTRATOR
            </p>

            <h1>Dashboard</h1>

            <p className={styles.subtitle}>
              Kelola akun dan aktivitas Fivora dari
              satu tempat.
            </p>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.notification}>
              <span>🔔</span>

              {pendingCount > 0 && (
                <span
                  className={
                    styles.notificationBadge
                  }
                >
                  {pendingCount}
                </span>
              )}
            </div>

            <div className={styles.topProfile}>
              <div className={styles.avatar}>
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className={styles.profileText}>
                <strong>{adminName}</strong>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Statistik */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              👤
            </div>

            <div>
              <span>Total Akun</span>
              <strong>{totalUsers}</strong>
            </div>
          </div>

          <div
            className={`${styles.statCard} ${styles.statCardWarning}`}
          >
            <div className={styles.statIcon}>
              ⏳
            </div>

            <div>
              <span>Menunggu Verifikasi</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              🛠
            </div>

            <div>
              <span>Operator Aktif</span>
              <strong>{totalOperators}</strong>
            </div>
          </div>

          <div className={styles.statCardMuted}>
            <div className={styles.statIcon}>
              ▣
            </div>

            <div>
              <span>Fasilitas</span>
              <strong>—</strong>
            </div>

            <small>Segera</small>
          </div>
        </section>

        {/* Quick action */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                AKSES CEPAT
              </p>

              <h2>Manajemen akun</h2>

              <p>
                Fitur akun yang sudah tersedia di
                dashboard admin.
              </p>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <button
              type="button"
              className={styles.actionCard}
              onClick={() =>
                scrollToSection('verifikasi')
              }
            >
              <div className={styles.actionIcon}>
                ✓
              </div>

              <div className={styles.actionContent}>
                <h3>Verifikasi Akun</h3>

                <p>
                  Periksa dan proses pendaftaran
                  pengguna.
                </p>
              </div>

              {pendingCount > 0 && (
                <span className={styles.actionBadge}>
                  {pendingCount} menunggu
                </span>
              )}
            </button>

            <button
              type="button"
              className={styles.actionCard}
              onClick={openOperatorForm}
            >
              <div className={styles.actionIcon}>
                +
              </div>

              <div className={styles.actionContent}>
                <h3>Tambah Operator</h3>

                <p>
                  Buat akun petugas secara langsung.
                </p>
              </div>
            </button>

            <div
              id="pengguna"
              className={styles.actionCardDisabled}
            >
              <div
                className={styles.actionIconMuted}
              >
                ◉
              </div>

              <div className={styles.actionContent}>
                <h3>Tambah Pengguna</h3>

                <p>
                  Mahasiswa, dosen, dan staf.
                </p>
              </div>

              <span className={styles.comingSoon}>
                Segera
              </span>
            </div>
          </div>
        </section>

        {/* Verifikasi */}
        <section
          id="verifikasi"
          className={styles.section}
        >
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                VERIFIKASI
              </p>

              <h2>Pendaftaran Menunggu</h2>

              <p>
                Pendaftar harus disetujui sebelum dapat
                menggunakan akun.
              </p>
            </div>

            <span className={styles.sectionCount}>
              {pendingCount} akun
            </span>
          </div>

          <div className={styles.verificationCard}>
            {pendingUsers.length > 0 ? (
              <RegistrationList
                users={pendingUsers}
              />
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  ✓
                </div>

                <h3>Tidak ada pendaftaran</h3>

                <p>
                  Semua pendaftaran sudah diproses.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Modul lain */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                MODUL SISTEM
              </p>

              <h2>Fitur lainnya</h2>

              <p>
                Tampilan sudah disiapkan untuk modul
                berikutnya.
              </p>
            </div>
          </div>

          <div className={styles.featureGrid}>
            <div
              id="fasilitas"
              className={styles.featureCard}
            >
              <span className={styles.featureIcon}>
                ▣
              </span>

              <div className={styles.featureText}>
                <h3>Kelola Fasilitas</h3>

                <p>
                  Tambah, edit, dan nonaktifkan
                  fasilitas.
                </p>
              </div>

              <span className={styles.comingSoon}>
                Segera
              </span>
            </div>

            <div
              id="reservasi"
              className={styles.featureCard}
            >
              <span className={styles.featureIcon}>
                ◷
              </span>

              <div className={styles.featureText}>
                <h3>Reservasi</h3>

                <p>
                  Monitoring dan pengelolaan
                  reservasi.
                </p>
              </div>

              <span className={styles.comingSoon}>
                Segera
              </span>
            </div>

            <div
              id="laporan"
              className={styles.featureCard}
            >
              <span className={styles.featureIcon}>
                ⚠
              </span>

              <div className={styles.featureText}>
                <h3>Laporan Kerusakan</h3>

                <p>
                  Monitoring laporan fasilitas.
                </p>
              </div>

              <span className={styles.comingSoon}>
                Segera
              </span>
            </div>

            <div
              id="rekap"
              className={styles.featureCard}
            >
              <span className={styles.featureIcon}>
                ▤
              </span>

              <div className={styles.featureText}>
                <h3>Rekap & Export</h3>

                <p>
                  CSV, Excel, dan PDF.
                </p>
              </div>

              <span className={styles.comingSoon}>
                Segera
              </span>
            </div>
          </div>
        </section>
      </section>

      {/* Modal tambah operator */}
      {showOperatorForm && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeOperatorForm()
            }
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  ADMIN
                </p>

                <h2>Tambah Operator</h2>

                <p>
                  Akun operator langsung berstatus
                  aktif.
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeOperatorForm}
                disabled={operatorLoading}
              >
                ×
              </button>
            </div>

            <form
              className={styles.operatorForm}
              onSubmit={handleCreateOperator}
            >
              {/* Nama */}
              <label>
                <span>Nama</span>

                <input
                  type="text"
                  value={operatorName}
                  onChange={(event) =>
                    setOperatorName(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan nama operator"
                  disabled={operatorLoading}
                  required
                />
              </label>

              {/* Email */}
              <label>
                <span>Email Operator</span>

                <input
                  type="email"
                  value={operatorEmail}
                  onChange={(event) =>
                    setOperatorEmail(
                      event.target.value
                    )
                  }
                  placeholder="nama@operator.undip.ac.id"
                  disabled={operatorLoading}
                  required
                />

                <small>
                  Gunakan email @operator.undip.ac.id.
                </small>
              </label>

              {/* Password */}
              <label>
                <span>Password</span>

                <div className={styles.passwordBox}>
                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={operatorPassword}
                    onChange={(event) =>
                      setOperatorPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimal 6 karakter"
                    disabled={operatorLoading}
                    required
                    minLength={6}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    disabled={operatorLoading}
                  >
                    {showPassword
                      ? 'Sembunyikan'
                      : 'Lihat'}
                  </button>
                </div>
              </label>

              {/* Error */}
              {operatorError && (
                <div className={styles.formError}>
                  {operatorError}
                </div>
              )}

              {/* Success */}
              {operatorMessage && (
                <div className={styles.formSuccess}>
                  {operatorMessage}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={operatorLoading}
              >
                {operatorLoading
                  ? 'Membuat akun...'
                  : 'Buat Akun Operator'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}