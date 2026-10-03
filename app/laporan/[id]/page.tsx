import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireReportRole } from '@/lib/report-access'
import { createClient } from '@/lib/supabase/server'
import DetailLaporanContent from './detail-laporan-content'
import styles from './detail-laporan.module.css'

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
  facility: {
    name: string
    location: string | null
  } | null
}

export default async function DetailLaporanPage({ params }: Props) {
  const currentUser = await requireReportRole('pengguna')
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
        facility:facilities!facility_id (
          name,
          location
        )
      `
    )
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .returns<ReportRow[]>()
    .maybeSingle()

  if (error) {
    console.error('Gagal mengambil detail laporan:', error)

    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p role="alert">
            Detail laporan gagal dimuat. Coba muat ulang halaman.
          </p>

          <Link href="/laporan" className={styles.backButton}>
            Kembali ke Riwayat
          </Link>
        </section>
      </main>
    )
  }

  if (!report) {
    notFound()
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

  return (
    <DetailLaporanContent
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
      }}
    />
  )
}