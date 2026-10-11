'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAutoRefresh } from '@/lib/use-auto-refresh'

/** Mount on read-only server pages; keeps the current URL and scroll position. */
export default function AutoRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  useAutoRefresh(() => {
    if (!pending) startTransition(() => router.refresh())
  }, { resetKey: `${pathname}?${params.toString()}` })

  return null
}
