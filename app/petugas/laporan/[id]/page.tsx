import { requireReportRole } from '@/lib/report-access'
import DetailLaporanPetugasContent from './detail-laporan-petugas-content'

export default async function DetailLaporanPetugasPage() {
  await requireReportRole('petugas')

  return <DetailLaporanPetugasContent />
}