import type { ReactNode } from 'react'
import { AppNavbar } from '@/components/layout/app-navbar'
import { requireReportRole } from '@/lib/report-access'

export default async function PetugasLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireReportRole('petugas')

  return (
    <>
      <AppNavbar
        user={{ name: user.name, email: user.email, role: user.role }}
      />
      {children}
    </>
  )
}