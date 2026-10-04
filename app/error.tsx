'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F9FC] px-4 text-center">
      <p className="text-xs font-bold tracking-widest text-[#c53c50] uppercase">
        Terjadi Kesalahan
      </p>

      <h1 className="mt-2 text-2xl font-bold text-[#010736]">
        Maaf, sesuatu tidak beres
      </h1>

      <p className="mt-2 max-w-md text-sm text-[#52627D]">
        {error.message ||
          'Gagal memuat halaman. Silakan coba lagi.'}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#010736] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0D1C42]"
      >
        Coba Lagi
      </button>
    </div>
  )
}
