'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      router.push('/login')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-[#D8DFEA] px-4 py-1.5 text-xs font-semibold text-[#010736] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
    >
      {loading ? 'Keluar...' : 'Keluar'}
    </button>
  )
}
