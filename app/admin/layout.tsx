import type { ReactNode } from 'react'

import { requireFacilityAdmin } from '@/lib/facility-access'
import AdminShell from './admin-shell'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const currentUser = await requireFacilityAdmin()

  return (
    <AdminShell adminName={currentUser.name}>
      {children}
    </AdminShell>
  )
}