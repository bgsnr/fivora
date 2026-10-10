import { redirect } from 'next/navigation'
import { requireReportRole } from '@/lib/report-access'

export default async function PetugasFasilitasDetailPage() {
  await requireReportRole('petugas')
  redirect('/petugas/laporan')
}
