'use client'

import { useEffect, useRef } from 'react'

export function isAutoRefreshBlocked() {
  return Boolean(document.querySelector(
    '[data-auto-refresh-blocked="true"], [aria-modal="true"]'
  ))
}

type Options = {
  enabled?: boolean
  immediate?: boolean
  resetKey?: string
}

/** Reads only while visible; one request at a time, with stale results ignored. */
export function useAutoRefresh(
  refresh: (signal: AbortSignal, automatic: boolean) => Promise<void> | void,
  { enabled = true, immediate = false, resetKey = '' }: Options = {},
) {
  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let running = false
    let lastStarted = 0

    async function run(automatic = true) {
      if (controller.signal.aborted || running) return
      if (automatic && (
        document.visibilityState !== 'visible' || !navigator.onLine ||
        isAutoRefreshBlocked() || Date.now() - lastStarted < 1000
      )) return

      running = true
      lastStarted = Date.now()
      try {
        await refreshRef.current(controller.signal, automatic)
      } catch {
        // The reader reports errors without interrupting subsequent retries.
      } finally {
        running = false
      }
    }

    const resume = () => { void run() }
    const timer = window.setInterval(resume, 15_000)
    window.addEventListener('focus', resume)
    window.addEventListener('online', resume)
    document.addEventListener('visibilitychange', resume)
    if (immediate) void run(false)

    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', resume)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [enabled, immediate, resetKey])
}

export function canApplyRefresh(signal: AbortSignal, automatic: boolean) {
  return !signal.aborted && (!automatic || !isAutoRefreshBlocked())
}
