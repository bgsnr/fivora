'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const supabase = createClient()
  const [userName, setUserName] = useState('Pengguna')
  const [email, setEmail] = useState('')
  const [profileName, setProfileName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setIsLoadingProfile(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (error || !data) {
        const fallbackName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'
        const fallbackEmail = user.email || ''
        setUserName(fallbackName)
        setProfileName(fallbackName)
        setEmail(fallbackEmail)
        setIsLoadingProfile(false)
        return
      }

      const profileNameValue = data.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'
      setUserName(profileNameValue)
      setProfileName(profileNameValue)
      setEmail(data.email || user.email || '')
      setIsLoadingProfile(false)
    }

    loadUserProfile()
  }, [supabase])

  const handleSaveProfile = async () => {
    const trimmed = profileName.trim()

    if (!trimmed) {
      setProfileFeedback({ type: 'error', text: 'Nama profil tidak boleh kosong.' })
      return
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setProfileFeedback({ type: 'error', text: 'Sesi tidak valid. Silakan login ulang.' })
      return
    }

    const { error } = await supabase
      .from('users')
      .update({ name: trimmed })
      .eq('auth_user_id', user.id)

    if (error) {
      setProfileFeedback({ type: 'error', text: 'Gagal menyimpan profil. Silakan coba lagi.' })
      return
    }

    setUserName(trimmed)
    setProfileFeedback({ type: 'success', text: 'Profil berhasil diperbarui.' })
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Semua field password harus diisi.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'Konfirmasi password tidak cocok.' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'Password baru minimal 6 karakter.' })
      return
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      setPasswordFeedback({ type: 'error', text: 'Tidak dapat memvalidasi akun saat ini.' })
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPasswordFeedback({ type: 'error', text: 'Password saat ini salah.' })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setPasswordFeedback({ type: 'error', text: 'Gagal memperbarui password. Silakan coba lagi.' })
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordFeedback({ type: 'success', text: 'Password berhasil diperbarui.' })
  }

  return (
    <AppLayout userName={userName}>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            PENGATURAN
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Pengaturan Akun</h1>
        </div>

        <div className="grid gap-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Akun</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Ubah informasi profil akun Anda.</p>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                <span className="mb-2 block">Email Akun</span>
                <input
                  value={email}
                  readOnly
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--muted-foreground)] outline-none"
                />
              </label>

              <label className="block text-sm font-medium text-[var(--foreground)]">
                <span className="mb-2 block">Nama Profil</span>
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  disabled={isLoadingProfile}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Masukkan nama profil"
                />
              </label>

              {profileFeedback && (
                <p
                  className={`text-sm ${
                    profileFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {profileFeedback.text}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isLoadingProfile}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Simpan Profil
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[var(--foreground)]">Password</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Perbarui password akun untuk keamanan tambahan.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              <span className="mb-2 block">Password Saat Ini</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)]"
                placeholder="Masukkan password saat ini"
              />
            </label>

            <label className="block text-sm font-medium text-[var(--foreground)]">
              <span className="mb-2 block">Password Baru</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)]"
                placeholder="Masukkan password baru"
              />
            </label>

            <label className="block text-sm font-medium text-[var(--foreground)]">
              <span className="mb-2 block">Konfirmasi Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)]"
                placeholder="Ulangi password baru"
              />
            </label>

            {passwordFeedback && (
              <div className="md:col-span-3">
                <p
                  className={`text-sm ${
                    passwordFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {passwordFeedback.text}
                </p>
              </div>
            )}

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
              >
                Perbarui Password
              </button>
            </div>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
