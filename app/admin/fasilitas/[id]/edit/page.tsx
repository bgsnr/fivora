import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireFacilityAdmin } from '@/lib/facility-access'
import { getFacilityAdmin } from '@/lib/actions/admin-facilities'
import { validFacilityId } from '@/lib/validations/facilities'
import AdminFacilityForm from '@/components/facilities/admin-facility-form'
import styles from '@/components/facilities/admin-management.module.css'
import type { Facility } from '@/types/facility'

export default async function EditFacilityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFacilityAdmin()
  const { id } = await params
  if (!/^\d+$/.test(id) || !validFacilityId(Number(id))) notFound()
  let facility: Facility | null
  try { facility = await getFacilityAdmin(Number(id)) }
  catch {
    return <main className={styles.formPage}>
      <Link href="/admin/fasilitas" className={styles.backLink}>← Kembali ke Kelola Fasilitas</Link>
      <section className={styles.formCard}>
        <h1>Data fasilitas gagal dimuat</h1>
        <p className={styles.error} role="alert">Coba muat ulang halaman. Form edit ditampilkan setelah data berhasil dimuat.</p>
      </section>
    </main>
  }
  if (!facility) notFound()
  return <AdminFacilityForm key={`${facility.id}-${facility.updated_at}`} facility={facility} />
}
