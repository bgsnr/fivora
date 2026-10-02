'use client'

import { useMemo, useState } from 'react'

type AccountUser = {
  id: number
  name: string
  email: string
  nim_nip: string | null
  jenis_pengguna: string
  role: string
  status: string
  created_at: string
}

function getJenisPenggunaLabel(jenisPengguna: string) {
  if (jenisPengguna === 'students') {
    return 'Mahasiswa'
  }

  if (jenisPengguna === 'lecturer') {
    return 'Dosen'
  }

  if (jenisPengguna === 'staff') {
    return 'Staf'
  }

  return jenisPengguna
}

function getRoleLabel(role: string) {
  if (role === 'pengguna') {
    return 'Pengguna'
  }

  if (role === 'petugas') {
    return 'Petugas'
  }

  if (role === 'admin') {
    return 'Admin'
  }

  return role
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export default function AccountList({
  accounts,
}: {
  accounts: AccountUser[]
}) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('semua')

  const filteredAccounts = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase()

    return accounts.filter((account) => {
      const matchesSearch =
        cleanSearch === '' ||
        account.name.toLowerCase().includes(cleanSearch) ||
        account.email.toLowerCase().includes(cleanSearch) ||
        (account.nim_nip ?? '').includes(cleanSearch)

      const matchesRole =
        roleFilter === 'semua' ||
        account.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [accounts, search, roleFilter])

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D8DFEA] bg-white shadow-sm">
      {/* Filter */}
      <div className="flex flex-col gap-3 border-b border-[#D8DFEA] bg-[#F8FAFC] p-4 md:flex-row">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, email, atau NIM/NIP..."
          className="min-h-10 flex-1 rounded-full border border-[#D8DFEA] bg-white px-4 text-sm text-[#010736] outline-none transition placeholder:text-[#9AA5B5] focus:border-[#22396F] focus:ring-2 focus:ring-[#22396F]/10"
        />

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="min-h-10 rounded-full border border-[#D8DFEA] bg-white px-4 text-sm text-[#010736] outline-none focus:border-[#22396F] focus:ring-2 focus:ring-[#22396F]/10"
        >
          <option value="semua">Semua Role</option>
          <option value="pengguna">Pengguna</option>
          <option value="petugas">Petugas</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Jumlah akun */}
      <div className="border-b border-[#D8DFEA] px-4 py-3 text-xs text-[#52627D]">
        Menampilkan {filteredAccounts.length} dari {accounts.length} akun aktif.
      </div>

      {/* Daftar akun */}
      {filteredAccounts.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mb-3 text-2xl">🔎</div>

          <h3 className="font-heading text-sm font-bold text-[#010736]">
            Akun tidak ditemukan
          </h3>

          <p className="mt-1 text-xs text-[#7B879B]">
            Coba gunakan kata kunci atau filter yang berbeda.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse">
            <thead>
              <tr className="border-b border-[#D8DFEA] bg-[#F8FAFC] text-left">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  AKUN
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  NIM / NIP
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  JENIS
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  ROLE
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  STATUS
                </th>

                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#52627D]">
                  DIBUAT
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-[#E7EBF1] last:border-b-0 hover:bg-[#F8FAFC]"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FCF1D0] text-xs font-bold text-[#010736]">
                        {account.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#010736]">
                          {account.name}
                        </div>

                        <div className="mt-1 truncate text-[11px] text-[#718097]">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 font-mono text-xs text-[#52627D]">
                    {account.nim_nip || '-'}
                  </td>

                  <td className="px-4 py-4 text-xs text-[#52627D]">
                    {getJenisPenggunaLabel(account.jenis_pengguna)}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        account.role === 'admin'
                          ? 'bg-[#010736] text-white'
                          : account.role === 'petugas'
                          ? 'bg-[#0D1C42] text-white'
                          : 'bg-[#EEF2F7] text-[#52627D]'
                      }`}
                    >
                      {getRoleLabel(account.role)}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      Aktif
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs text-[#7B879B]">
                    {formatDate(account.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}