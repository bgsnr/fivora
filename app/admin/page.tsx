
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

import AdminDashboard, {
  type RecentReservation,
} from './admin-dashboard'

export default async function AdminPage() {
  const supabase = await createClient()

  // Ambil user yang sedang login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Ambil data admin dari public.users
  const {
    data: currentUser,
    error: currentUserError,
  } = await supabase
    .from('users')
    .select('id, name, email, role, status')
    .eq('auth_user_id', user.id)
    .single()

  if (currentUserError || !currentUser) {
    console.error(
      'CURRENT USER ERROR:',
      currentUserError
    )
    redirect('/')
  }

  // Hanya admin aktif yang boleh mengakses dashboard
  if (
    currentUser.role !== 'admin' ||
    currentUser.status !== 'aktif'
  ) {
    redirect('/')
  }

  // Ambil seluruh data dashboard
  const [
    pendingUsersResult,
    activeAccountsResult,
    totalUsersResult,
    totalOperatorsResult,
    totalFacilitiesResult,
    maintenanceFacilitiesResult,
    pendingReservationsResult,
    openReportsResult,
    recentReservationsResult,
  ] = await Promise.all([
    // Pendaftaran yang menunggu verifikasi
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

    // Daftar akun aktif
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

    // Total akun aktif dan menunggu
    // Akun ditolak tidak dihitung
    supabaseAdmin
      .from('users')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', ['aktif', 'menunggu']),

    // Total petugas aktif
    supabaseAdmin
      .from('users')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('role', 'petugas')
      .eq('status', 'aktif'),

    // Total fasilitas
    supabaseAdmin
      .from('facilities')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    // Fasilitas dalam perbaikan
    supabaseAdmin
      .from('facilities')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', [
        'dalam_perbaikan',
        'under_maintenance',
        'maintenance',
      ]),

    // Reservasi yang menunggu persetujuan
    supabaseAdmin
      .from('reservations')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('status', 'menunggu'),

    // Laporan kerusakan yang belum selesai
    supabaseAdmin
      .from('reports')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('status', ['baru', 'diproses']),

    // Lima reservasi terbaru
    // Ambil foreign key terlebih dahulu
    supabaseAdmin
      .from('reservations')
      .select(`
        id,
        user_id,
        facility_id,
        reservation_date,
        start_time,
        status,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(5),
  ])

  // Periksa error query dashboard
  if (pendingUsersResult.error) {
    console.error(
      'PENDING USERS ERROR:',
      pendingUsersResult.error
    )
  }

  if (activeAccountsResult.error) {
    console.error(
      'ACTIVE ACCOUNTS ERROR:',
      activeAccountsResult.error
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

  if (totalFacilitiesResult.error) {
    console.error(
      'TOTAL FACILITIES ERROR:',
      totalFacilitiesResult.error
    )
  }

  if (maintenanceFacilitiesResult.error) {
    console.error(
      'MAINTENANCE FACILITIES ERROR:',
      maintenanceFacilitiesResult.error
    )
  }

  if (pendingReservationsResult.error) {
    console.error(
      'PENDING RESERVATIONS ERROR:',
      pendingReservationsResult.error
    )
  }

  if (openReportsResult.error) {
    console.error(
      'OPEN REPORTS ERROR:',
      openReportsResult.error
    )
  }

  if (recentReservationsResult.error) {
    console.error(
      'RECENT RESERVATIONS ERROR:',
      recentReservationsResult.error
    )
  }

  // Data lima reservasi terbaru
  const reservationRows =
    recentReservationsResult.data ?? []

  // Kumpulkan ID pengguna yang diperlukan
  const userIds = [
    ...new Set(
      reservationRows
        .map((reservation) =>
          Number(reservation.user_id)
        )
        .filter((id) => Number.isFinite(id))
    ),
  ]

  // Kumpulkan ID fasilitas yang diperlukan
  const facilityIds = [
    ...new Set(
      reservationRows
        .map((reservation) =>
          Number(reservation.facility_id)
        )
        .filter((id) => Number.isFinite(id))
    ),
  ]

  // Ambil nama pengguna berdasarkan ID
  let reservationUsers: {
    id: number | string
    name: string
  }[] = []

  if (userIds.length > 0) {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .in('id', userIds)

    if (error) {
      console.error(
        'RESERVATION USERS ERROR:',
        error
      )
    } else {
      reservationUsers = data ?? []
    }
  }

  // Ambil nama fasilitas berdasarkan ID
  let reservationFacilities: {
    id: number | string
    name: string
  }[] = []

  if (facilityIds.length > 0) {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from('facilities')
      .select('id, name')
      .in('id', facilityIds)

    if (error) {
      console.error(
        'RESERVATION FACILITIES ERROR:',
        error
      )
    } else {
      reservationFacilities = data ?? []
    }
  }

  // Buat peta ID ke nama
  const userNameById = new Map<string, string>(
    reservationUsers.map(
      (item): [string, string] => [
        String(item.id),
        item.name,
      ]
    )
  )

  const facilityNameById = new Map<string, string>(
    reservationFacilities.map(
      (item): [string, string] => [
        String(item.id),
        item.name,
      ]
    )
  )

  // Siapkan data reservasi untuk dashboard
  // Bentuk array disesuaikan dengan komponen TSX saat ini
  const recentReservations: RecentReservation[] =
    reservationRows.map((reservation) => {
      const userName = userNameById.get(
        String(reservation.user_id)
      )

      const facilityName = facilityNameById.get(
        String(reservation.facility_id)
      )

      if (!userName || !facilityName) {
        console.warn(
          'Nama relasi reservasi tidak ditemukan:',
          {
            reservationId: reservation.id,
            userId: reservation.user_id,
            facilityId: reservation.facility_id,
            userFound: Boolean(userName),
            facilityFound: Boolean(facilityName),
          }
        )
      }

      return {
        id: reservation.id,
        reservation_date:
          reservation.reservation_date,
        start_time: reservation.start_time,
        status: reservation.status,

        users: userName
          ? [{ name: userName }]
          : null,

        facilities: facilityName
          ? [{ name: facilityName }]
          : null,
      }
    })

  // Kirim seluruh data ke dashboard
  return (
    <AdminDashboard
      adminName={currentUser.name}
      totalUsers={totalUsersResult.count ?? 0}
      pendingCount={
        pendingUsersResult.data?.length ?? 0
      }
      totalOperators={
        totalOperatorsResult.count ?? 0
      }
      pendingUsers={
        pendingUsersResult.data ?? []
      }
      activeAccounts={
        activeAccountsResult.data ?? []
      }
      facilityCount={
        totalFacilitiesResult.count ?? 0
      }
      pendingReservationsCount={
        pendingReservationsResult.count ?? 0
      }
      maintenanceFacilityCount={
        maintenanceFacilitiesResult.count ?? 0
      }
      openReportsCount={
        openReportsResult.count ?? 0
      }
      recentReservations={recentReservations}
    />
  )
}
