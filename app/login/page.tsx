'use client'

import Link from 'next/link'
import { Suspense, FormEvent, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { loginAction } from '@/lib/actions/login'

import styles from './login.module.css'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <section className={styles.panel} />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect') ?? searchParams.get('redirectTo')
  const submitting = useRef(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(
    searchParams.get('error') === 'account_not_active'
      ? 'Akun belum aktif atau data akun belum dapat diperiksa. Silakan login kembali.'
      : ''
  )

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (submitting.current) return
    setErrorMessage('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setErrorMessage('Email dan password wajib diisi.')
      return
    }

    submitting.current = true
    setLoading(true)

    try {
      const result = await loginAction(cleanEmail, password, redirectParam)
      if (!result.success) {
        setErrorMessage(result.error)
        return
      }

      // Permintaan halaman baru membaca cookie sesi hasil login.
      window.location.assign(result.target)
    } catch {
      setErrorMessage('Login belum berhasil terhubung. Silakan coba lagi.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        {/* Panel kiri */}
        <aside className={styles.side}>
          <div className={styles.sideContent}>
            <h1>
              Reservasi Fasilitas dan Lapor Kerusakan.
            </h1>

            <p>
              Masuk ke akun Fivora untuk mengakses reservasi dan
              laporan kerusakan fasilitas kampus.
            </p>
          </div>
        </aside>

        {/* Panel kanan */}
        <section className={styles.panel}>
          <div className={styles.panelTop}>
            <span>Belum punya akun?</span>

            <Link href="/register">
              Daftar
            </Link>
          </div>

          <div className={styles.formWrap}>
            <div className={styles.heading}>
              <h2>
                Login
              </h2>

              <p>
                Masuk menggunakan akun Fivora kamu.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >
              {/* Email */}
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

              {/* Password */}
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

              {/* Error */}
              {errorMessage && (
                <div
                  className={styles.error}
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {/* Button */}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading
                  ? 'Memproses...'
                  : 'Login'}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}
