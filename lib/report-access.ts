import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

type ReportRole = 'pengguna' | 'petugas'

export async function requireReportRole(role: ReportRole) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  if (
    currentUser.status !== 'aktif' ||
    currentUser.role !== role
  ) {
    redirect('/')
  }

  return currentUser
}