'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (
    type: ToastType,
    message: string
  ) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext =
  createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)

  if (!ctx) {
    throw new Error(
      'useToast harus dipakai di dalam ToastProvider'
    )
  }

  return ctx
}

export function ToastProvider({
  children,
}: {
  children: ReactNode
}) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    )
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current

      setItems((prev) => [
        ...prev,
        { id, type, message },
      ])

      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m) => toast('success', m),
      error: (m) => toast('error', m),
      info: (m) => toast('info', m),
    }),
    [toast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              item.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : item.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-[#D8DFEA] bg-white text-[#010736]'
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
