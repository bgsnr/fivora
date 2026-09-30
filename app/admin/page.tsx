import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

import AdminDashboard from './admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  /* Ambil user yang sedang login */
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  /* Ambil data admin dari public.users */
  const {
    data: currentUser,
    error: currentUserError,
  } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', user.id)
    .single()

  if (currentUserError || !currentUser) {
    console.error('CURRENT USER ERROR:', currentUserError)
    redirect('/')
  }

  /* Hanya admin aktif yang boleh mengakses dashboard */
  if (
    currentUser.role !== 'admin' ||
    currentUser.status !== 'aktif'
  ) {
    redirect('/')
  }

  /* Ambil data dashboard */
  const [
    pendingUsersResult,
    totalUsersResult,
    totalOperatorsResult,
    activeAccountsResult,
  ] = await Promise.all([
    /* Ambil pendaftaran yang masih menunggu */
    supabaseAdmin
      .from('users')
      .select(`
        id,
        auth_user_id,
        name,
        email,
        nim_nip,
        jenis_pengguna,
        role,
        status,
        created_at
      `)
      .eq('status', 'menunggu')
      .order('created_at', {
        ascending: true,
      }),

    /* Hitung seluruh akun */
    supabaseAdmin
      .from('users')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    /* Hitung petugas aktif */
    supabaseAdmin
      .from('users')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('role', 'petugas')
      .eq('status', 'aktif'),

    /* Ambil seluruh akun aktif */
    supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        email,
        nim_nip,
        jenis_pengguna,
        role,
        status,
        created_at
      `)
      .eq('status', 'aktif')
      .order('created_at', {
        ascending: false,
      }),
  ])

  if (pendingUsersResult.error) {
    console.error(
      'PENDING USERS ERROR:',
      pendingUsersResult.error
    )
  }

  if (totalUsersResult.error) {
    console.error(
      'TOTAL USERS ERROR:',
      totalUsersResult.error
    )
  }

  if (totalOperatorsResult.error) {
    console.error(
      'TOTAL OPERATORS ERROR:',
      totalOperatorsResult.error
    )
  }

  if (activeAccountsResult.error) {
    console.error(
      'ACTIVE ACCOUNTS ERROR:',
      activeAccountsResult.error
    )
  }

  return (
    <AdminDashboard
      adminName={currentUser.name}
      totalUsers={totalUsersResult.count ?? 0}
      pendingCount={pendingUsersResult.data?.length ?? 0}
      totalOperators={totalOperatorsResult.count ?? 0}
      pendingUsers={pendingUsersResult.data ?? []}
      activeAccounts={activeAccountsResult.data ?? []}
    />
  )
}