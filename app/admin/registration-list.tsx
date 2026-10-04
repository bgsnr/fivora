'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PendingUser = {
  id: number
  name: string
  email: string
  nim_nip: string | null
  jenis_pengguna: string
  status: string
  created_at: string
}

export default function RegistrationList({
  users,
}: {
  users: PendingUser[]
}) {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  async function updateStatus(
    id: number,
    status: 'aktif' | 'ditolak'
  ) {
    setLoadingId(id)
    setErrorMessage('')

    try {
      const response = await fetch(
        `/api/admin/users/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        setErrorMessage(
          result.error ||
            'Gagal memperbarui status akun.'
        )
        return
      }

      router.refresh()
    } catch {
      setErrorMessage(
        'Terjadi kesalahan saat menghubungi server.'
      )
    } finally {
      setLoadingId(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-[#D8DFEA] bg-white p-6">
        <p className="text-sm text-[#52627D]">
          Tidak ada pendaftaran yang menunggu verifikasi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-2xl border border-[#D8DFEA] bg-white p-5 shadow-sm transition-all hover:border-[#22396F]/30 hover:shadow-md"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {/* User Info */}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-base font-bold text-[#010736]">
                  {user.name}
                </h2>

                <span className="rounded-full bg-[#FCF1D0] px-2.5 py-1 font-mono text-[9px] font-bold uppercase text-[#010736]">
                  Menunggu
                </span>
              </div>

              <p className="text-sm text-[#52627D]">
                {user.email}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <p className="text-xs text-[#718097]">
                  Jenis pengguna:{" "}
                  <span className="font-medium text-[#22396F]">
                    {user.jenis_pengguna}
                  </span>
                </p>

                <p className="text-xs text-[#718097]">
                  NIM/NIP:{" "}
                  <span className="font-medium text-[#22396F]">
                    {user.nim_nip || '-'}
                  </span>
                </p>
              </div>

              <p className="pt-1 text-[11px] text-[#8A96A8]">
                Status pengajuan: {user.status}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={() =>
                  updateStatus(user.id, 'aktif')
                }
                className="rounded-full bg-[#010736] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#0D1C42] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === user.id
                  ? 'Memproses...'
                  : 'Setujui'}
              </button>

              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={() =>
                  updateStatus(user.id, 'ditolak')
                }
                className="rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tolak
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}