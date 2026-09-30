import { requireReportRole } from '@/lib/report-access'
import DetailLaporanContent from './detail-laporan-content'

type DetailLaporanPageProps = {
  params: Promise<{ id: string }>
}

export default async function DetailLaporanPage({
  params,
}: DetailLaporanPageProps) {
  await requireReportRole('pengguna')

  return <DetailLaporanContent params={params} />
}