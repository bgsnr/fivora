import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import DetailLaporanPetugasContent from './detail-laporan-petugas-content'
import styles from './detail-laporan-petugas.module.css'

type Props = {
  params: Promise<{ id: string }>
}

type ReportRow = {
  id: number
  category: string
  description: string
  status: 'baru' | 'diproses' | 'selesai' | 'ditolak'
  officer_note: string
  created_at: string
  processed_at: string | null
  updated_at: string
  facility: {
    name: string
    location: string | null
  } | null
}

function formatDate(value: string) {
  const date = new Date(value)

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)

  const waktu = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(date).replace(':', '.')

  return `${tanggal}, ${waktu} WIB`
}

export default async function DetailLaporanPetugasPage({
  params,
}: Props) {
  await requireReportRole('petugas')

  const { id } = await params

  if (
    !/^[1-9]\d{0,18}$/.test(id) ||
    BigInt(id) > BigInt('9223372036854775807')
  ) {
    notFound()
  }

  const supabase = await createClient()

  const { data: report, error } = await supabase
    .from('reports')
    .select(
      `
        id,
        category,
        description,
        status,
        officer_note,
        created_at,
        processed_at,
        updated_at,
        facility:facilities!facility_id (
          name,
          location
        )
      `
    )
    .eq('id', id)
    .returns<ReportRow[]>()
    .maybeSingle()

  if (error) {
    console.error('Gagal mengambil detail laporan petugas:', error)

    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <p role="alert">
            Detail laporan gagal dimuat. Coba muat ulang halaman.
          </p>

          <Link href="/petugas/laporan" className={styles.backLink}>
            Kembali ke antrean laporan
          </Link>
        </section>
      </main>
    )
  }

  if (!report) {
    notFound()
  }

  return (
    <DetailLaporanPetugasContent
      report={{
        id,
        facility: report.facility?.name ?? 'Fasilitas tidak tersedia',
        location: report.facility?.location ?? '',
        category: report.category,
        description: report.description,
        status: report.status,
        officerNote: report.officer_note,
        date: formatDate(report.created_at),
        processedAt: report.processed_at
          ? formatDate(report.processed_at)
          : null,
        updatedAt: report.updated_at,
      }}
    />
  )
}