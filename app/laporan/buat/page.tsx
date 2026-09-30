import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import BuatLaporanContent from './buat-laporan-content'

export default async function BuatLaporanPage() {
  await requireReportRole('pengguna')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('facilities')
    .select('id, name, location')
    .order('name', { ascending: true })

  if (error) {
    console.error('Gagal mengambil fasilitas:', error)
  }

  const facilities = (data ?? []).map((facility) => ({
    id: String(facility.id),
    name: facility.name,
    location: facility.location,
  }))

  return (
    <BuatLaporanContent
      facilities={facilities}
      facilitiesError={
        error
          ? 'Daftar fasilitas gagal dimuat. Coba muat ulang halaman.'
          : ''
      }
    />
  )
}