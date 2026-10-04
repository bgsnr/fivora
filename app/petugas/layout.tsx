import type { ReactNode } from 'react'
import { AppNavbar } from '@/components/layout/app-navbar'
import { getCurrentUser } from '@/lib/auth'

export default async function PetugasLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <>
      <AppNavbar
        user={
          user
            ? { name: user.name, role: user.role }
            : null
        }
      />
      {children}
    </>
  )
}