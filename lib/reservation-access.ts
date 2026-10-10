type ReservationUser = { role: string; status: string } | null

export function canCreateReservation(user: ReservationUser): boolean {
  return user?.role === 'pengguna' && user.status === 'aktif'
}

export function reservationAccessRedirect(
  user: ReservationUser,
  returnTo = '/reservations/new'
): string | null {
  if (canCreateReservation(user)) return null
  if (user?.status === 'aktif') {
    if (user.role === 'petugas') return '/petugas'
    if (user.role === 'admin') return '/admin'
  }
  return `/login?redirect=${encodeURIComponent(returnTo)}`
}
