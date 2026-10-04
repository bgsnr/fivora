'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Ambil nama tampilan pengguna aktif dari tabel `users` Supabase.
 * Dipakai untuk header AppLayout agar tidak hardcoded.
 */
export function useCurrentUserName(fallback = 'Pengguna') {
  const supabase = createClient()
  const [userName, setUserName] = useState(fallback)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) return

      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      const name =
        data?.name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        fallback

      if (isActive) setUserName(name)
    }

    load()

    return () => {
      isActive = false
    }
  }, [supabase, fallback])

  return userName
}
