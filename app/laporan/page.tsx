import { requireReportRole } from '@/lib/report-access'
import LaporanContent from './laporan-content'

export default async function LaporanPage() {
  await requireReportRole('pengguna')

  return <LaporanContent />
}