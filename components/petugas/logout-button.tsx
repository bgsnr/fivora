'use client'

import { useRef, useState } from 'react'
import { LogOut } from 'lucide-react'

import styles from '@/app/petugas/petugas.module.css'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const submittingRef = useRef(false)

  async function handleLogout() {
    if (submittingRef.current) return

    submittingRef.current = true
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        throw new Error('Logout gagal')
      }

      window.location.replace('/login')
    } catch {
      setErrorMessage('Gagal keluar. Silakan coba lagi.')
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className={styles.logoutWrapper}>
      <button
        type="button"
        className={styles.logoutButton}
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
      >
        <LogOut size={16} strokeWidth={1.7} aria-hidden="true" />
        {loading ? 'Keluar...' : 'Keluar'}
      </button>

      {errorMessage && (
        <span className={styles.logoutError} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  )
}