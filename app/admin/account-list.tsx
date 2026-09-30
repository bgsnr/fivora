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
    <div className="overflow-hidden rounded-xl border border-[#e3daf6] bg-white">
        {/* Filter */}
        <div className="flex flex-col gap-3 border-b border-[#eee8f7] p-4 md:flex-row">
        <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, email, atau NIM/NIP..."
            className="min-h-10 flex-1 rounded-lg border border-[#ddd6f1] bg-white px-3 text-sm text-[#21164f] outline-none transition focus:border-[#7650e7] focus:ring-2 focus:ring-[#7650e7]/10"
        />

        <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="min-h-10 rounded-lg border border-[#ddd6f1] bg-white px-3 text-sm text-[#21164f] outline-none focus:border-[#7650e7]"
        >
            <option value="semua">Semua Role</option>
            <option value="pengguna">Pengguna</option>
            <option value="petugas">Petugas</option>
            <option value="admin">Admin</option>
        </select>
        </div>

        {/* Jumlah akun */}
        <div className="px-4 py-3 text-xs text-[#7f7591]">
        Menampilkan {filteredAccounts.length} dari {accounts.length} akun aktif.
        </div>

        {/* Daftar akun */}
        {filteredAccounts.length === 0 ? (
        <div className="p-8 text-center">
            <div className="mb-3 text-2xl">🔎</div>

            <h3 className="text-sm font-bold text-[#21164f]">
            Akun tidak ditemukan
            </h3>

            <p className="mt-1 text-xs text-[#89809b]">
            Coba gunakan kata kunci atau filter yang berbeda.
            </p>
        </div>
        ) : (
        <div className="overflow-x-auto border-t border-[#eee8f7]">
            <table className="w-full min-w-[850px] border-collapse">
            <thead>
                <tr className="border-b border-[#eee8f7] bg-[#faf8ff] text-left">
                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    AKUN
                </th>

                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    NIM / NIP
                </th>

                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    JENIS
                </th>

                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    ROLE
                </th>

                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    STATUS
                </th>

                <th className="px-4 py-3 text-[11px] font-bold text-[#756c92]">
                    DIBUAT
                </th>
                </tr>
            </thead>

            <tbody>
                {filteredAccounts.map((account) => (
                <tr
                    key={account.id}
                    className="border-b border-[#eee8f7] last:border-b-0 hover:bg-[#fcfaff]"
                >
                    <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eee7fb] text-xs font-bold text-[#6940df]">
                        {account.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-[#21164f]">
                            {account.name}
                        </div>

                        <div className="mt-1 truncate text-[11px] text-[#7f7591]">
                            {account.email}
                        </div>
                        </div>
                    </div>
                    </td>

                    <td className="px-4 py-4 text-xs text-[#4a415e]">
                    {account.nim_nip || '-'}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#4a415e]">
                    {getJenisPenggunaLabel(account.jenis_pengguna)}
                    </td>

                    <td className="px-4 py-4">
                    <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        account.role === 'admin'
                            ? 'bg-[#eee7fb] text-[#603ddb]'
                            : account.role === 'petugas'
                            ? 'bg-[#eef7ff] text-[#2563a8]'
                            : 'bg-[#f3f4f6] text-[#4b5563]'
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

                    <td className="px-4 py-4 text-xs text-[#7f7591]">
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