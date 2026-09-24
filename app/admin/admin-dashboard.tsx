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

  const [showOperatorPassword, setShowOperatorPassword] =
    useState(false)

  const [operatorLoading, setOperatorLoading] =
    useState(false)

  const [operatorError, setOperatorError] =
    useState('')

  const [operatorMessage, setOperatorMessage] =
    useState('')

  // State modal tambah pengguna
  const [showUserForm, setShowUserForm] =
    useState(false)

  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userNimNip, setUserNimNip] = useState('')
  const [userPassword, setUserPassword] =
    useState('')

  const [showUserPassword, setShowUserPassword] =
    useState(false)

  const [userLoading, setUserLoading] =
    useState(false)

  const [userError, setUserError] =
    useState('')

  const [userMessage, setUserMessage] =
    useState('')

  // Membuka modal operator
  function openOperatorForm() {
    setOperatorError('')
    setOperatorMessage('')
    setShowOperatorForm(true)
  }

  // Menutup modal operator
  function closeOperatorForm() {
    if (operatorLoading) {
      return
    }

    setShowOperatorForm(false)
    setOperatorError('')
    setOperatorMessage('')
  }

  // Membuka modal pengguna
  function openUserForm() {
    setUserError('')
    setUserMessage('')
    setShowUserForm(true)
  }

  // Menutup modal pengguna
  function closeUserForm() {
    if (userLoading) {
      return
    }

    setShowUserForm(false)
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

    if (operatorPassword.length < 8) {
      setOperatorError(
        'Password minimal 8 karakter.'
      )
      return
    }

    if (
      !cleanEmail.endsWith(
        '@operator.undip.ac.id'
      )
    ) {
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

      setOperatorName('')
      setOperatorEmail('')
      setOperatorPassword('')
      setShowOperatorPassword(false)

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

  // Membuat akun pengguna
  async function handleCreateUser(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setUserError('')
    setUserMessage('')

    const cleanName = userName.trim()
    const cleanEmail = userEmail
      .trim()
      .toLowerCase()

    const cleanNimNip = userNimNip.trim()

    // Validasi field wajib
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

    // Validasi password
    if (userPassword.length < 8) {
      setUserError(
        'Password minimal 8 karakter.'
      )
      return
    }

    // NIM/NIP harus berupa angka
    if (!/^\d+$/.test(cleanNimNip)) {
      setUserError(
        'NIM/NIP hanya boleh berisi angka.'
      )
      return
    }

    // Validasi domain email SSO
    const isStudent = cleanEmail.endsWith(
      '@students.undip.ac.id'
    )

    const isLecturer = cleanEmail.endsWith(
      '@lecturer.undip.ac.id'
    )

    const isStaff = cleanEmail.endsWith(
      '@staff.undip.ac.id'
    )

    if (
      !isStudent &&
      !isLecturer &&
      !isStaff
    ) {
      setUserError(
        'Email harus menggunakan email SSO UNDIP yang valid.'
      )
      return
    }

    // Validasi panjang NIM mahasiswa
    if (
      isStudent &&
      !/^\d{14}$/.test(cleanNimNip)
    ) {
      setUserError(
        'NIM mahasiswa harus terdiri dari 14 digit.'
      )
      return
    }

    // Validasi panjang NIP dosen/staf
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
      const response = await fetch(
        '/api/admin/users',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            nim_nip: cleanNimNip,
            password: userPassword,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setUserError(
          result.error ||
            'Gagal membuat akun pengguna.'
        )
        return
      }

      setUserMessage(
        'Akun pengguna berhasil dibuat dan langsung aktif.'
      )

      // Reset form
      setUserName('')
      setUserEmail('')
      setUserNimNip('')
      setUserPassword('')
      setShowUserPassword(false)

      // Refresh dashboard
      router.refresh()
    } catch (error) {
      console.error(
        'CREATE USER ERROR:',
        error
      )

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
      const response = await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        console.error('Logout gagal.')
        return
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error(
        'LOGOUT ERROR:',
        error
      )
    }
  }

  // Scroll ke bagian tertentu
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
          {/* Dashboard */}
          <a
            href="#dashboard"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span>⌂</span>
            <span>Dashboard</span>
          </a>

          {/* Verifikasi */}
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

          {/* Tambah Operator */}
          <button
            type="button"
            className={styles.navItem}
            onClick={openOperatorForm}
          >
            <span>+</span>
            <span>Tambah Operator</span>
          </button>

          {/* Tambah Pengguna */}
          <button
            type="button"
            className={styles.navItem}
            onClick={openUserForm}
          >
            <span>+</span>
            <span>Tambah Pengguna</span>
          </button>

          {/* Fasilitas */}
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

          {/* Reservasi */}
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

          {/* Laporan */}
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

          {/* Rekap */}
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

        {/* Profile dan logout */}
        <div className={styles.sidebarBottom}>
          <div className={styles.adminProfile}>
            <div className={styles.avatar}>
              {adminName
                .charAt(0)
                .toUpperCase()}
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

      {/* Konten utama */}
      <section className={styles.content}>
        {/* Header */}
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
                {adminName
                  .charAt(0)
                  .toUpperCase()}
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
                Fitur akun yang tersedia di dashboard
                admin.
              </p>
            </div>
          </div>

          <div className={styles.actionGrid}>
            {/* Verifikasi */}
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

            {/* Tambah operator */}
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

            {/* Tambah pengguna */}
            <button
              type="button"
              className={styles.actionCard}
              onClick={openUserForm}
            >
              <div className={styles.actionIcon}>
                +
              </div>

              <div className={styles.actionContent}>
                <h3>Tambah Pengguna</h3>

                <p>
                  Tambah mahasiswa, dosen, atau staf.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Verifikasi akun */}
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

        {/* Fitur lainnya */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                MODUL SISTEM
              </p>

              <h2>Fitur lainnya</h2>

              <p>
                Tampilan sudah disiapkan untuk
                pengembangan berikutnya.
              </p>
            </div>
          </div>

          <div className={styles.featureGrid}>
            {/* Fasilitas */}
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

            {/* Reservasi */}
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

            {/* Laporan */}
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

            {/* Rekap */}
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
                  Akun operator langsung aktif.
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
                      showOperatorPassword
                        ? 'text'
                        : 'password'
                    }
                    value={operatorPassword}
                    onChange={(event) =>
                      setOperatorPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimal 8 karakter"
                    disabled={operatorLoading}
                    required
                    minLength={8}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowOperatorPassword(
                        (current) => !current
                      )
                    }
                    disabled={operatorLoading}
                  >
                    {showOperatorPassword
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

      {/* Modal tambah pengguna */}
      {showUserForm && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUserForm()
            }
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.sectionEyebrow}>
                  ADMIN
                </p>

                <h2>Tambah Pengguna</h2>

                <p>
                  Akun pengguna langsung aktif.
                </p>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeUserForm}
                disabled={userLoading}
              >
                ×
              </button>
            </div>

            <form
              className={styles.operatorForm}
              onSubmit={handleCreateUser}
            >
              {/* Nama */}
              <label>
                <span>Nama</span>

                <input
                  type="text"
                  value={userName}
                  onChange={(event) =>
                    setUserName(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan nama pengguna"
                  disabled={userLoading}
                  required
                />
              </label>

              {/* Email */}
              <label>
                <span>Email</span>

                <input
                  type="email"
                  value={userEmail}
                  onChange={(event) =>
                    setUserEmail(
                      event.target.value
                    )
                  }
                  placeholder="nama@students.undip.ac.id"
                  disabled={userLoading}
                  required
                />

                <small>
                  Gunakan email SSO UNDIP.
                </small>
              </label>

              {/* NIM/NIP */}
              <label>
                <span>NIM/NIP</span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={userNimNip}
                  onChange={(event) =>
                    setUserNimNip(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan NIM/NIP"
                  disabled={userLoading}
                  required
                  maxLength={18}
                />

                <small>
                  NIM mahasiswa 14 digit, NIP dosen/staf
                  18 digit.
                </small>
              </label>

              {/* Password */}
              <label>
                <span>Password</span>

                <div className={styles.passwordBox}>
                  <input
                    type={
                      showUserPassword
                        ? 'text'
                        : 'password'
                    }
                    value={userPassword}
                    onChange={(event) =>
                      setUserPassword(
                        event.target.value
                      )
                    }
                    placeholder="Minimal 8 karakter"
                    disabled={userLoading}
                    required
                    minLength={8}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowUserPassword(
                        (current) => !current
                      )
                    }
                    disabled={userLoading}
                  >
                    {showUserPassword
                      ? 'Sembunyikan'
                      : 'Lihat'}
                  </button>
                </div>
              </label>

              {/* Error */}
              {userError && (
                <div className={styles.formError}>
                  {userError}
                </div>
              )}

              {/* Success */}
              {userMessage && (
                <div className={styles.formSuccess}>
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
          </div>
        </div>
      )}
    </main>
  )
}