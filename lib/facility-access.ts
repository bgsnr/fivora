import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export async function requireFacilityAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin' || user.status !== 'aktif') redirect('/')
  return user
}
