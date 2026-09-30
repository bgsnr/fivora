import { requireReportRole } from '@/lib/report-access'
import BuatLaporanContent from './buat-laporan-content'

export default async function BuatLaporanPage() {
  await requireReportRole('pengguna')

  return <BuatLaporanContent />
}
