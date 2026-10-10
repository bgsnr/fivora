'use server'

import { createClient } from '@/lib/supabase/server'
import { getLoginTarget } from '@/lib/login-redirect'

type LoginResult =
  | { success: true; target: string }
  | { success: false; error: string }

export async function loginAction(
  email: string,
  password: string,
  redirectTo: string | null
): Promise<LoginResult> {
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      let message = 'Layanan login belum dapat diakses. Silakan coba lagi.'
      if (error.code === 'invalid_credentials') message = 'Email atau password salah.'
      if (error.code === 'email_not_confirmed') message = 'Email akun ini belum dikonfirmasi. Periksa email konfirmasi pendaftaranmu.'
      if (error.code === 'user_banned') message = 'Akun ini tidak dapat digunakan. Hubungi administrator.'
      if (error.status === 429) message = 'Terlalu banyak percobaan login. Tunggu sebentar, lalu coba lagi.'
      return { success: false, error: message }
    }

    if (!data.user || !data.session) {
      return { success: false, error: 'Sesi login belum terbentuk. Silakan coba lagi.' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, status')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    let accountError = ''
    if (profileError) accountError = 'Data akun gagal diperiksa. Silakan coba lagi.'
    else if (!profile) accountError = 'Data pengguna tidak ditemukan. Hubungi administrator.'
    else if (profile.status === 'menunggu') accountError = 'Akun kamu masih menunggu persetujuan administrator.'
    else if (profile.status === 'ditolak') accountError = 'Pendaftaran akun kamu ditolak oleh administrator.'
    else if (profile.status !== 'aktif') accountError = 'Akun tidak dapat digunakan. Hubungi administrator.'
    else if (!['pengguna', 'petugas', 'admin'].includes(profile.role)) accountError = 'Peran akun tidak dikenali. Hubungi administrator.'

    if (accountError) {
      await supabase.auth.signOut({ scope: 'local' })
      return { success: false, error: accountError }
    }

    return {
      success: true,
      target: getLoginTarget(profile!.role, typeof redirectTo === 'string' ? redirectTo : null),
    }
  } catch {
    return { success: false, error: 'Koneksi ke layanan login terputus. Silakan coba lagi.' }
  }
}
