import { requireFacilityAdmin } from '@/lib/facility-access'
import { getAllFacilitiesAdmin } from '@/lib/actions/admin-facilities'
import AdminFacilitiesContent from '@/components/facilities/admin-facilities-content'
import type { Facility } from '@/types/facility'

export default async function AdminFacilitiesPage() {
  await requireFacilityAdmin()
  let facilities: Facility[] = []
  let errorMessage = ''
  try { facilities = await getAllFacilitiesAdmin() }
  catch { errorMessage = 'Data fasilitas gagal dimuat. Klik Muat ulang untuk mencoba lagi.' }
  return <AdminFacilitiesContent initialFacilities={facilities} initialError={errorMessage} />
}
