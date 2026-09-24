import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const {
    data: profile,
    error,
  } = await supabase
    .from('users')
    .select(
      `
      id,
      auth_user_id,
      name,
      email,
      nim_nip,
      jenis_pengguna,
      role,
      status
      `
    )
    .eq('auth_user_id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile
}