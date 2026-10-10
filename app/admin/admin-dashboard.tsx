
'use client'

import { type FormEvent, useState } from 'react'
import { Eye, EyeOff, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import RegistrationList from './registration-list'
import AccountList from './account-list'
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

type AccountUser = {
  id: number
  name: string
  email: string
  nim_nip: string | null
  jenis_pengguna: string
  role: string
  status: string
  created_at: string
}

export type RecentReservation = {
  id: string | number
  reservation_date: string
  start_time: string
  status: string
  users: {
    name: string
  }[] | null
  facilities: {
    name: string
  }[] | null
}

type AdminDashboardProps = {
  adminName: string
  totalUsers: number
  pendingCount: number
  totalOperators: number
  pendingUsers: PendingUser[]
  activeAccounts: AccountUser[]
  facilityCount: number
  pendingReservationsCount: number
  maintenanceFacilityCount: number
  openReportsCount: number
  recentReservations: RecentReservation[]
}

export default function AdminDashboard({
  adminName,
  totalUsers,
  pendingCount,
  totalOperators,
  pendingUsers,
  activeAccounts,
  facilityCount,
  pendingReservationsCount,
  maintenanceFacilityCount,
  openReportsCount,
  recentReservations,
}: AdminDashboardProps) {
  const router = useRouter()

  // State sidebar
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  // State modal tambah akun
  const [showAddAccountForm, setShowAddAccountForm] =
    useState(false)

  const [accountType, setAccountType] =
    useState<'operator' | 'pengguna'>('operator')

  // State akun operator
  const [operatorName, setOperatorName] = useState('')
  const [operatorEmail, setOperatorEmail] = useState('')
  const [operatorPassword, setOperatorPassword] =
    useState('')
  const [showOperatorPassword, setShowOperatorPassword] =
    useState(false)
  const [operatorLoading, setOperatorLoading] =
    useState(false)
  const [operatorError, setOperatorError] = useState('')
  const [operatorMessage, setOperatorMessage] =
    useState('')

  // State akun pengguna
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userNimNip, setUserNimNip] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [showUserPassword, setShowUserPassword] =
    useState(false)
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState('')
  const [userMessage, setUserMessage] = useState('')

  // Membuka modal tambah akun
  function openAddAccountForm() {
    setAccountType('operator')
    setOperatorError('')
    setOperatorMessage('')
    setUserError('')
    setUserMessage('')
    setShowAddAccountForm(true)
  }

  // Menutup modal tambah akun
  function closeAddAccountForm() {
    if (operatorLoading || userLoading) return

    setShowAddAccountForm(false)
    setOperatorError('')
    setOperatorMessage('')
    setUserError('')
    setUserMessage('')
  }

  // Mengganti jenis akun
  function changeAccountType(
    type: 'operator' | 'pengguna'
  ) {
    setAccountType(type)
    setOperatorError('')
    setOperatorMessage('')
    setUserError('')
    setUserMessage('')
  }

  // Membuat akun operator
  async function handleCreateOperator(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setOperatorError('')
    setOperatorMessage('')

    const cleanName = operatorName.trim()
    const cleanEmail = operatorEmail.trim().toLowerCase()

    if (!cleanName || !cleanEmail || !operatorPassword) {
      setOperatorError(
        'Nama, email, dan password wajib diisi.'
      )
      return
    }

    if (operatorPassword.length < 8) {
      setOperatorError('Password minimal 8 karakter.')
      return
    }

    if (!cleanEmail.endsWith('@operator.undip.ac.id')) {
      setOperatorError(
        'Email operator harus menggunakan @operator.undip.ac.id.'
      )
      return
    }

    setOperatorLoading(true)

    try {
      const response = await fetch('/api/admin/operators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: operatorPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setOperatorError(
          result.error || 'Gagal membuat akun operator.'
        )
        return
      }

      setOperatorMessage(
        'Akun operator berhasil dibuat dan langsung aktif.'
      )

      setOperatorName('')
      setOperatorEmail('')
      setOperatorPassword('')
      setShowOperatorPassword(false)

      router.refresh()
    } catch (error) {
      console.error('CREATE OPERATOR ERROR:', error)
      setOperatorError(
        'Terjadi kesalahan. Silakan coba lagi.'
      )
    } finally {
      setOperatorLoading(false)
    }
  }

  // Membuat akun pengguna
  async function handleCreateUser(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setUserError('')
    setUserMessage('')

    const cleanName = userName.trim()
    const cleanEmail = userEmail.trim().toLowerCase()
    const cleanNimNip = userNimNip.trim()

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanNimNip ||
      !userPassword
    ) {
      setUserError(
        'Nama, email, NIM/NIP, dan password wajib diisi.'
      )
      return
    }

    if (userPassword.length < 8) {
      setUserError('Password minimal 8 karakter.')
      return
    }

    if (!/^\d+$/.test(cleanNimNip)) {
      setUserError('NIM/NIP hanya boleh berisi angka.')
      return
    }

    const isStudent = cleanEmail.endsWith(
      '@students.undip.ac.id'
    )

    const isLecturer = cleanEmail.endsWith(
      '@lecturer.undip.ac.id'
    )

    const isStaff = cleanEmail.endsWith(
      '@staff.undip.ac.id'
    )

    if (!isStudent && !isLecturer && !isStaff) {
      setUserError(
        'Email harus menggunakan email SSO UNDIP yang valid.'
      )
      return
    }

    if (isStudent && !/^\d{14}$/.test(cleanNimNip)) {
      setUserError(
        'NIM mahasiswa harus terdiri dari 14 digit.'
      )
      return
    }

    if (
      (isLecturer || isStaff) &&
      !/^\d{18}$/.test(cleanNimNip)
    ) {
      setUserError(
        'NIP dosen/staf harus terdiri dari 18 digit.'
      )
      return
    }

    setUserLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          nim_nip: cleanNimNip,
          password: userPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setUserError(
          result.error || 'Gagal membuat akun pengguna.'
        )
        return
      }

      setUserMessage(
        'Akun pengguna berhasil dibuat dan langsung aktif.'
      )

      setUserName('')
      setUserEmail('')
      setUserNimNip('')
      setUserPassword('')
      setShowUserPassword(false)

      router.refresh()
    } catch (error) {
      console.error('CREATE USER ERROR:', error)
      setUserError(
        'Terjadi kesalahan. Silakan coba lagi.'
      )
    } finally {
      setUserLoading(false)
    }
  }

  // Logout
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        console.error('Logout gagal.')
        return
      }

      router.replace('/login')
      router.refresh()
    } catch (error) {
      console.error('LOGOUT ERROR:', error)
    }
  }

  // Navigasi ke bagian tertentu
  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  // Label dan warna status reservasi
  function getReservationStatus(status: string) {
    switch (status) {
      case 'menunggu':
        return {
          label: 'Menunggu',
          className: styles.reservationStatusPending,
        }

      case 'disetujui':
        return {
          label: 'Disetujui',
          className: styles.reservationStatusApproved,
        }

      case 'ditolak':
        return {
          label: 'Ditolak',
          className: styles.reservationStatusClosed,
        }

      case 'dibatalkan':
        return {
          label: 'Dibatalkan',
          className: styles.reservationStatusClosed,
        }

      default:
        return {
          label: status,
          className: styles.reservationStatusClosed,
        }
    }
  }

  return (
    <main className={styles.page}>
      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.sidebarCollapsed : ''
        }`}
      >
        <div className={styles.brand}>
          <img
            src="/fivora-logo.png"
            alt="Fivora - Facility & Venue Reservation"
            className={styles.brandLogo}
          />
        </div>

        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={() =>
            setSidebarCollapsed((current) => !current)
          }
          aria-label={
            sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'
          }
        >
          {sidebarCollapsed ? (
            <Menu className="size-4" />
          ) : (
            <X className="size-4" />
          )}
        </button>

        <nav className={styles.nav}>
          <a
            href="#dashboard"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span>⌂</span>
            <span>Dashboard</span>
          </a>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => scrollToSection('verifikasi')}
          >
            <span>✓</span>
            <span>Verifikasi Akun</span>

            {pendingCount > 0 && (
              <span className={styles.navBadge}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={openAddAccountForm}
          >
            <span>+</span>
            <span>Tambah Akun</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => scrollToSection('akun')}
          >
            <span>👥</span>
            <span>Daftar Akun</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => router.push('/admin/fasilitas')}
          >
            <span>▣</span>
            <span>Fasilitas</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => scrollToSection('reservasi')}
          >
            <span>◷</span>
            <span>Reservasi</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => scrollToSection('operasional')}
          >
            <span>⚠</span>
            <span>Laporan Kerusakan</span>
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => router.push('/admin/recap')}
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

      {/* KONTEN UTAMA */}
      <section
        className={`${styles.content} ${
          sidebarCollapsed ? styles.contentExpanded : ''
        }`}
      >
        {/* HEADER */}
        <header id="dashboard" className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>ADMINISTRATOR</p>
            <h1>Dashboard</h1>

            <p className={styles.subtitle}>
              Kelola akun dan aktivitas Fivora dari satu tempat.
            </p>
          </div>

          <div className={styles.topbarRight}>
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

        {/* 1. STATISTIK AKUN */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👤</div>

            <div>
              <span>Total Akun</span>
              <strong>{totalUsers}</strong>
            </div>
          </div>

          <div
            className={`${styles.statCard} ${styles.statCardWarning}`}
          >
            <div className={styles.statIcon}>⏳</div>

            <div>
              <span>Menunggu Verifikasi</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🛠</div>

            <div>
              <span>Operator Aktif</span>
              <strong>{totalOperators}</strong>
            </div>
          </div>
        </section>

        {/* 2. AKSES CEPAT MANAJEMEN AKUN */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                AKSES CEPAT
              </p>

              <h2>Manajemen Akun</h2>

              <p>
                Kelola pendaftaran, buat akun, dan lihat akun aktif.
              </p>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <button
              type="button"
              className={styles.actionCard}
              onClick={() => scrollToSection('verifikasi')}
            >
              <div className={styles.actionIcon}>✓</div>

              <div className={styles.actionContent}>
                <h3>Verifikasi Akun</h3>

                <p>
                  Periksa dan proses pendaftaran pengguna.
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
              onClick={openAddAccountForm}
            >
              <div className={styles.actionIcon}>+</div>

              <div className={styles.actionContent}>
                <h3>Tambah Akun</h3>

                <p>
                  Buat akun operator atau pengguna secara langsung.
                </p>
              </div>
            </button>

            <button
              type="button"
              className={styles.actionCard}
              onClick={() => scrollToSection('akun')}
            >
              <div className={styles.actionIcon}>👥</div>

              <div className={styles.actionContent}>
                <h3>Daftar Akun</h3>

                <p>
                  Lihat semua akun yang saat ini aktif.
                </p>
              </div>

              <span className={styles.actionBadge}>
                {activeAccounts.length} aktif
              </span>
            </button>
          </div>
        </section>

        {/* 3. VERIFIKASI AKUN */}
        <section id="verifikasi" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                VERIFIKASI
              </p>

              <h2>Pendaftaran Menunggu</h2>

              <p>
                Pendaftar harus disetujui sebelum dapat menggunakan akun.
              </p>
            </div>

            <span className={styles.sectionCount}>
              {pendingCount} akun
            </span>
          </div>

          <div className={styles.verificationCard}>
            {pendingUsers.length > 0 ? (
              <RegistrationList users={pendingUsers} />
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✓</div>

                <h3>Tidak ada pendaftaran</h3>

                <p>
                  Semua pendaftaran sudah diproses.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 4. DAFTAR AKUN AKTIF */}
        <section id="akun" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                AKUN AKTIF
              </p>

              <h2>Daftar Akun</h2>

              <p>
                Daftar akun yang saat ini aktif di sistem Fivora.
              </p>
            </div>

            <span className={styles.sectionCount}>
              {activeAccounts.length} akun
            </span>
          </div>

          <div className={styles.verificationCard}>
            <AccountList accounts={activeAccounts} />
          </div>
        </section>

        {/* 5. STATISTIK OPERASIONAL — SETELAH DAFTAR AKUN */}
        <section id="operasional" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                OPERASIONAL
              </p>

              <h2>Ringkasan Operasional</h2>

              <p>
                Pantau kondisi fasilitas dan aktivitas reservasi.
              </p>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>▣</div>

              <div>
                <span>Total Fasilitas</span>
                <strong>{facilityCount}</strong>
              </div>
            </div>

            <div
              className={`${styles.statCard} ${styles.statCardWarning}`}
            >
              <div className={styles.statIcon}>◷</div>

              <div>
                <span>Menunggu Persetujuan</span>
                <strong>{pendingReservationsCount}</strong>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🛠</div>

              <div>
                <span>Dalam Perbaikan</span>
                <strong>{maintenanceFacilityCount}</strong>
              </div>
            </div>

            <div
              className={`${styles.statCard} ${styles.statCardWarning}`}
            >
              <div className={styles.statIcon}>⚠</div>

              <div>
                <span>Laporan Belum Selesai</span>
                <strong>{openReportsCount}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* 6. RESERVASI TERBARU */}
        <section id="reservasi" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                AKTIVITAS TERBARU
              </p>

              <h2>Reservasi Terbaru</h2>

              <p>
                Lima pengajuan reservasi terakhir di Fivora.
              </p>
            </div>

            <button
              type="button"
              className={styles.viewAllButton}
              onClick={() => router.push('/admin/reservations')}
            >
              Lihat Semua
            </button>
          </div>

          <div className={styles.verificationCard}>
            {recentReservations.length > 0 ? (
              <div className={styles.reservationList}>
                {recentReservations.map((reservation) => {
                  const statusInfo = getReservationStatus(
                    reservation.status
                  )

                  const date = new Date(
                    `${reservation.reservation_date}T00:00:00`
                  )

                  const formattedDate = Number.isNaN(
                    date.getTime()
                  )
                    ? reservation.reservation_date
                    : date.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })

                  return (
                    <div
                      key={reservation.id}
                      className={styles.reservationRow}
                    >
                      <div className={styles.reservationInfo}>
                        <div className={styles.reservationName}>
                          {reservation.facilities?.[0]?.name ??
                            'Fasilitas tidak ditemukan'}
                        </div>

                        <div className={styles.reservationMeta}>
                          {reservation.users?.[0]?.name ?? 'Pengguna'}
                          {' · '}
                          {formattedDate}
                          {' · '}
                          {reservation.start_time.slice(0, 5)}
                        </div>
                      </div>

                      <span
                        className={`${styles.reservationStatus} ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✓</div>

                <h3>Belum ada reservasi</h3>

                <p>
                  Pengajuan reservasi terbaru akan muncul di sini.
                </p>
              </div>
            )}
          </div>
        </section>
      </section>

      {/* MODAL TAMBAH AKUN */}
      {showAddAccountForm && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddAccountForm()
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Tambah Akun"
          >
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  ADMIN
                </p>

                <h2>Tambah Akun</h2>

                <p>
                  Buat akun operator atau pengguna secara langsung.
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeAddAccountForm}
                disabled={operatorLoading || userLoading}
                aria-label="Tutup modal"
              >
                ×
              </button>
            </div>

            {/* Pilihan jenis akun */}
            <div className={styles.accountTypeSelector}>
              <button
                type="button"
                className={
                  accountType === 'operator'
                    ? styles.accountTypeActive
                    : styles.accountTypeButton
                }
                onClick={() => changeAccountType('operator')}
                disabled={operatorLoading || userLoading}
              >
                Operator
              </button>

              <button
                type="button"
                className={
                  accountType === 'pengguna'
                    ? styles.accountTypeActive
                    : styles.accountTypeButton
                }
                onClick={() => changeAccountType('pengguna')}
                disabled={operatorLoading || userLoading}
              >
                Pengguna
              </button>
            </div>

            {/* FORM OPERATOR */}
            {accountType === 'operator' && (
              <form
                className={styles.operatorForm}
                onSubmit={handleCreateOperator}
              >
                <label>
                  <span>Nama</span>

                  <input
                    type="text"
                    value={operatorName}
                    onChange={(event) =>
                      setOperatorName(event.target.value)
                    }
                    placeholder="Masukkan nama operator"
                    disabled={operatorLoading}
                    required
                  />
                </label>

                <label>
                  <span>Email Operator</span>

                  <input
                    type="email"
                    value={operatorEmail}
                    onChange={(event) =>
                      setOperatorEmail(event.target.value)
                    }
                    placeholder="nama@operator.undip.ac.id"
                    disabled={operatorLoading}
                    required
                  />

                  <small>
                    Gunakan email @operator.undip.ac.id.
                  </small>
                </label>

                <label>
                  <span>Password</span>

                  <div className={styles.passwordBox}>
                    <input
                      type={
                        showOperatorPassword ? 'text' : 'password'
                      }
                      value={operatorPassword}
                      onChange={(event) =>
                        setOperatorPassword(event.target.value)
                      }
                      placeholder="Minimal 8 karakter"
                      disabled={operatorLoading}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() =>
                        setShowOperatorPassword(
                          (current) => !current
                        )
                      }
                      disabled={operatorLoading}
                      aria-label={
                        showOperatorPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showOperatorPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </label>

                {operatorError && (
                  <div className={styles.formError} role="alert">
                    {operatorError}
                  </div>
                )}

                {operatorMessage && (
                  <div className={styles.formSuccess} role="status">
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
            )}

            {/* FORM PENGGUNA */}
            {accountType === 'pengguna' && (
              <form
                className={styles.operatorForm}
                onSubmit={handleCreateUser}
              >
                <label>
                  <span>Nama</span>

                  <input
                    type="text"
                    value={userName}
                    onChange={(event) =>
                      setUserName(event.target.value)
                    }
                    placeholder="Masukkan nama pengguna"
                    disabled={userLoading}
                    required
                  />
                </label>

                <label>
                  <span>Email</span>

                  <input
                    type="email"
                    value={userEmail}
                    onChange={(event) =>
                      setUserEmail(event.target.value)
                    }
                    placeholder="nama@students.undip.ac.id"
                    disabled={userLoading}
                    required
                  />

                  <small>
                    Gunakan email SSO UNDIP.
                  </small>
                </label>

                <label>
                  <span>NIM/NIP</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={userNimNip}
                    onChange={(event) =>
                      setUserNimNip(event.target.value)
                    }
                    placeholder="Masukkan NIM/NIP"
                    disabled={userLoading}
                    required
                    maxLength={18}
                  />

                  <small>
                    NIM mahasiswa 14 digit, NIP dosen/staf 18 digit.
                  </small>
                </label>

                <label>
                  <span>Password</span>

                  <div className={styles.passwordBox}>
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(event) =>
                        setUserPassword(event.target.value)
                      }
                      placeholder="Minimal 8 karakter"
                      disabled={userLoading}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() =>
                        setShowUserPassword(
                          (current) => !current
                        )
                      }
                      disabled={userLoading}
                      aria-label={
                        showUserPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                    >
                      {showUserPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </label>

                {userError && (
                  <div className={styles.formError} role="alert">
                    {userError}
                  </div>
                )}

                {userMessage && (
                  <div className={styles.formSuccess} role="status">
                    {userMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={userLoading}
                >
                  {userLoading
                    ? 'Membuat akun...'
                    : 'Buat Akun Pengguna'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  )
}