'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './register.module.css'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [nimNip, setNimNip] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanNimNip = nimNip.trim()

    if (cleanName.length < 3) {
      setErrorMessage('Nama lengkap minimal 3 karakter.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrorMessage('Masukkan email yang valid.')
      return
    }

    if (!/^\d{14,18}$/.test(cleanNimNip)) {
      setErrorMessage('NIM/NIP harus berupa angka dengan panjang 14–18 digit.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password minimal 8 karakter.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          nim_nip: cleanNimNip,
          role: 'pengguna',
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setName('')
    setEmail('')
    setNimNip('')
    setPassword('')
    setSuccessMessage(
      'Pendaftaran berhasil. Cek email kamu untuk konfirmasi akun sebelum login.'
    )
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
              Daftar akun Fivora untuk mengakses reservasi fasilitas,
              pelaporan kerusakan, dan layanan kampus dalam satu platform.
            </p>
          </div>
        </aside>

        {/* PANEL KANAN */}
        <section className={styles.panel}>

          <div className={styles.panelTop}>
            <span>Sudah punya akun?</span>
            <Link href="/login">Login</Link>
          </div>

          <div className={styles.formWrap}>

            <div className={styles.heading}>
              <p className={styles.eyebrow}>FIVORA</p>

              <h2>Daftar Akun</h2>

              <p>
                Lengkapi data diri untuk membuat akun Fivora.
              </p>
            </div>

            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >

              {/* NAMA */}
              <label className={styles.field}>
                <span>Nama Lengkap</span>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  disabled={loading}
                />
              </label>

              {/* EMAIL */}
              <label className={styles.field}>
                <span>Email</span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="fivora@gmail.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </label>

              {/* NIM/NIP */}
              <label className={styles.field}>
                <span>NIM / NIP</span>

                <input
                  type="text"
                  value={nimNip}
                  onChange={(event) =>
                    setNimNip(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Masukkan NIM atau NIP"
                  inputMode="numeric"
                  maxLength={18}
                  disabled={loading}
                />
              </label>

              {/* PASSWORD */}
              <label className={styles.field}>
                <span>Password</span>

                <div className={styles.passwordBox}>
                  <input
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
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
                        ? "Sembunyikan password"
                        : "Tampilkan password"
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
                        <circle cx="12" cy="12" r="3" />
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
                <div className={styles.error} role="alert">
                  {errorMessage}
                </div>
              )}

              {/* SUCCESS */}
              {successMessage && (
                <div className={styles.success} role="status">
                  {successMessage}
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={loading}
              >
                {loading
                  ? "Mendaftarkan..."
                  : "Daftar"}
              </button>

            </form>
          </div>
        </section>

      </section>
    </main>
  )
}