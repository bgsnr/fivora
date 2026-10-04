import type { ReactNode } from 'react'
import { DM_Sans, Outfit } from 'next/font/google'

const bodyFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-petugas',
})

const headingFont = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-petugas-heading',
})

export default function PetugasLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className={`${bodyFont.variable} ${headingFont.variable}`}
      style={{ fontFamily: bodyFont.style.fontFamily }}
    >
      {children}
    </div>
  )
}