import type { ReactNode } from 'react'
import { DM_Sans, Fraunces, Outfit } from 'next/font/google'

const bodyFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-laporan-body',
})

const headingFont = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-laporan-heading',
})

const displayFont = Fraunces({
  subsets: ['latin'],
  style: 'normal',
  display: 'swap',
  variable: '--font-laporan-display',
})

export default function LaporanLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      className={`${bodyFont.variable} ${headingFont.variable} ${displayFont.variable}`}
      style={{ fontFamily: bodyFont.style.fontFamily }}
    >
      {children}
    </div>
  )
}