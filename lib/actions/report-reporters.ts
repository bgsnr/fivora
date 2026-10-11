import 'server-only'

import { requireReportRole } from '@/lib/report-access'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Reporter = {
  name: string | null
  email: string | null
}

type ReporterRow = Reporter & { id: number | string }

export async function getStaffReportReporters(
  userIds: readonly (number | string)[]
): Promise<Map<string, Reporter>> {
  // Hanya dipanggil di server; identitas petugas berasal dari sesi.
  await requireReportRole('petugas')

  const ids = [...new Set(userIds.map(String))]
  if (ids.length === 0) return new Map()

  if (ids.some((id) =>
    !/^[1-9]\d{0,18}$/.test(id) ||
    BigInt(id) > BigInt('9223372036854775807')
  )) {
    throw new Error('ID pelapor tidak valid.')
  }

  // Ambil hanya profil yang dirujuk laporan pada halaman ini. Pembacaan
  // profil memakai jalur server seperti antrean reservasi, bukan join
  // pengguna melalui client sesi yang dapat disaring kebijakan users.
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email')
    .in('id', ids)
    .returns<ReporterRow[]>()

  if (error || !data) {
    throw new Error('Identitas pelapor gagal dimuat.')
  }

  const reporters = new Map<string, Reporter>(data.map((profile) => [
    String(profile.id),
    {
      name: profile.name?.trim() || null,
      email: profile.email?.trim() || null,
    },
  ]))

  if (ids.some((id) => !reporters.has(id))) {
    throw new Error('Profil pelapor tidak ditemukan.')
  }

  return reporters
}
