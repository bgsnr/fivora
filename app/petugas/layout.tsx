import type { ReactNode } from 'react'

import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-petugas',
})

export default function PetugasLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className={`${manrope.variable} min-h-screen`}>
      {children}
    </div>
  )
}