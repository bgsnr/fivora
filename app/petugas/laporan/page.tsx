import { requireReportRole } from '@/lib/report-access'
import LaporanPetugasContent from './laporan-petugas-content'

export default async function LaporanPetugasPage() {
  await requireReportRole('petugas')

  return <LaporanPetugasContent />
}