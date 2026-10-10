'use server'

import { getCurrentUser } from '@/lib/auth'
import { reservationAccessRedirect } from '@/lib/reservation-access'

export async function getReservationCreationAccessAction() {
  const user = await getCurrentUser()
  const redirectTo = reservationAccessRedirect(user, '/catalog')
  return { allowed: redirectTo === null, redirectTo }
}
