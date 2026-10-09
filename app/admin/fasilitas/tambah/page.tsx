import { requireFacilityAdmin } from '@/lib/facility-access'
import AdminFacilityForm from '@/components/facilities/admin-facility-form'

export default async function CreateFacilityPage() {
  await requireFacilityAdmin()
  return <AdminFacilityForm />
}
