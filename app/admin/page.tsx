import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import RegistrationList from './registration-list'

export default async function AdminPage() {
  const supabase = await createClient()

  // Cek apakah ada user yang sedang login
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil data profile user yang sedang login
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', user.id)
    .single()

  // Kalau profile admin tidak ditemukan
  if (currentUserError || !currentUser) {
    console.error('CURRENT USER ERROR:', currentUserError)

    return (
      <main
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 20px',
        }}
      >
        <h1>Admin Fivora</h1>

        <p style={{ color: 'red', marginTop: '20px' }}>
          Gagal mengambil data admin.
        </p>
      </main>
    )
  }

  // Hanya user dengan role admin dan status aktif yang boleh masuk
  if (
    currentUser.role !== 'admin' ||
    currentUser.status !== 'aktif'
  ) {
    redirect('/')
  }

  // Ambil semua pendaftaran yang masih menunggu persetujuan
  const { data: pendingUsers, error: pendingError } =
    await supabaseAdmin
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
      .order('created_at', { ascending: true })

  // Kalau gagal mengambil data pendaftaran
  if (pendingError) {
    console.error('PENDING USERS ERROR:', pendingError)

    return (
      <main
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '40px 20px',
        }}
      >
        <h1>Admin Fivora</h1>

        <p style={{ color: 'red', marginTop: '20px' }}>
          Gagal mengambil data pendaftaran.
        </p>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      <h1>Admin Fivora</h1>

      <p style={{ marginTop: '10px' }}>
        Halo, {currentUser.name}
      </p>

      <section style={{ marginTop: '30px' }}>
        <h2>Pendaftaran Menunggu Persetujuan</h2>

        {pendingUsers && pendingUsers.length > 0 ? (
          <div style={{ marginTop: '20px' }}>
            <RegistrationList users={pendingUsers} />
          </div>
        ) : (
          <p style={{ marginTop: '20px' }}>
            Tidak ada pendaftaran yang menunggu persetujuan.
          </p>
        )}
      </section>
    </main>
  )
}