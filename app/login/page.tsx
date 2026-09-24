'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { supabase } from '@/lib/supabase'

import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setErrorMessage('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

    if (error) {
      setLoading(false)

      if (
        error.message.toLowerCase().includes('email not confirmed')
      ) {
        setErrorMessage(
          'Email belum diverifikasi. Silakan cek email terlebih dahulu.'
        )
      } else {
        setErrorMessage(
          'Email atau password salah.'
        )
      }

      return
    }

    if (!data.user) {
      setLoading(false)
      setErrorMessage('Login gagal. Silakan coba lagi.')
      return
    }

    /*
     * Pastikan email sudah diverifikasi
     */
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut()

      setLoading(false)

      setErrorMessage(
        'Email belum diverifikasi. Silakan cek email terlebih dahulu.'
      )

      return
    }

    /*
     * Ambil data user dari public.users
     */
    const { data: userData, error: userError } =
      await supabase
        .from('users')
        .select(
          'id, auth_user_id, name, email, nim_nip, jenis_pengguna, role, status'
        )
        .eq('auth_user_id', data.user.id)
        .single()

    if (userError || !userData) {
      await supabase.auth.signOut()

      setLoading(false)

      setErrorMessage(
        'Data pengguna tidak ditemukan. Silakan hubungi administrator.'
      )

      return
    }

    /*
     * Cek status akun
     */
    if (userData.status === 'menunggu') {
      await supabase.auth.signOut()

      setLoading(false)

      setErrorMessage(
        'Akun kamu masih menunggu persetujuan administrator.'
      )

      return
    }

    if (userData.status === 'ditolak') {
      await supabase.auth.signOut()

      setLoading(false)

      setErrorMessage(
        'Pendaftaran akun kamu ditolak oleh administrator.'
      )

      return
    }

    if (userData.status !== 'aktif') {
      await supabase.auth.signOut()

      setLoading(false)

      setErrorMessage(
        'Akun tidak dapat digunakan. Silakan hubungi administrator.'
      )

      return
    }

    /*
     * Login berhasil
     */
    setLoading(false)

    /*
     * Simpan informasi dasar untuk sementara.
     * Nanti bisa diganti dengan auth context/session helper
     * ketika modul lain sudah dibuat.
     */
    localStorage.setItem('user_id', userData.auth_user_id)
    localStorage.setItem('role', userData.role)
    localStorage.setItem('nama', userData.name)
    localStorage.setItem('nim_nip', userData.nim_nip ?? '')
    localStorage.setItem(
      'jenis_pengguna',
      userData.jenis_pengguna
    )

    /*
     * Pengalihan berdasarkan role
     */
    if (userData.role === 'admin') {
      router.push('/admin')
      return
    }

    if (userData.role === 'petugas') {
      router.push('/operator')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>

        {/* PANEL KIRI */}
        <aside className={styles.side}>

          <div className={styles.brand}>
            <span className={styles.brandDot} />
            Fivora
          </div>

          <div className={styles.sideContent}>
            <h1>
              Kelola fasilitas kampus dengan lebih mudah.
            </h1>

            <p>
              Masuk ke akun Fivora untuk mengakses reservasi
              fasilitas, pelaporan kerusakan, dan layanan kampus.
            </p>
          </div>

        </aside>

        {/* PANEL KANAN */}
        <section className={styles.panel}>

          <div className={styles.panelTop}>
            <span>Belum punya akun?</span>

            <Link href="/register">
              Daftar
            </Link>
          </div>

          <div className={styles.formWrap}>

            <div className={styles.heading}>

              <p className={styles.eyebrow}>
                FIVORA
              </p>

              <h2>
                Login
              </h2>

              <p>
                Masuk menggunakan akun Fivora kamu.
              </p>

            </div>

            {searchParams.get('registered') === 'true' && (
              <div className={styles.success}>
                Registrasi berhasil. Silakan cek email kamu
                untuk verifikasi akun sebelum login.
              </div>
            )}

            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >

              {/* EMAIL */}
              <label className={styles.field}>

                <span>
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Masukkan email"
                  autoComplete="email"
                  required
                  disabled={loading}
                />

              </label>

              {/* PASSWORD */}
              <label className={styles.field}>

                <span>
                  Password
                </span>

                <div className={styles.passwordBox}>

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c7 0 10 8 10 8a17.5 17.5 0 0 1-3.2 4.4" />
                        <path d="M6.2 6.2C3.6 8.1 2 12 2 12s3.5 7 10 7a10 10 0 0 0 2.1-.2" />
                      </svg>
                    )}
                  </button>

                </div>

              </label>

              {/* ERROR */}
              {errorMessage && (
                <div
                  className={styles.error}
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Login'}
              </button>

            </form>

          </div>

        </section>

      </section>
    </main>
  )
}