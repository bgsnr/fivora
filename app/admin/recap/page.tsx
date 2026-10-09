import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import AdminRecapClient from './recap-client';

export default async function AdminRecapPage() {
  const supabase = await createClient();

  // Pastikan pengguna sudah login.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Periksa role dan status akun.
  const {
    data: currentUser,
    error: currentUserError,
  } = await supabase
    .from('users')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .single();

  if (
    currentUserError ||
    !currentUser ||
    currentUser.role !== 'admin' ||
    currentUser.status !== 'aktif'
  ) {
    redirect('/');
  }

  return <AdminRecapClient />;
}