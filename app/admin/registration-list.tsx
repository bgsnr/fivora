'use client'

import { useState } from 'react'

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

      window.location.reload()
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
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">
          Tidak ada pendaftaran yang menunggu verifikasi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      {users.map((user) => (
        <div
          key={user.id}
          className="rounded-xl border bg-background p-6"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="font-semibold">
                {user.name}
              </h2>

              <p className="text-sm text-muted-foreground">
                {user.email}
              </p>

              <p className="text-sm text-muted-foreground">
                Jenis pengguna: {user.jenis_pengguna}
              </p>

              <p className="text-sm text-muted-foreground">
                NIM/NIP: {user.nim_nip || '-'}
              </p>

              <p className="text-sm text-muted-foreground">
                Status: {user.status}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={loadingId === user.id}
                onClick={() =>
                  updateStatus(user.id, 'aktif')
                }
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
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