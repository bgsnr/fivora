import { redirect } from 'next/navigation'
import { reservationAccessRedirect } from '@/lib/reservation-access'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { getActiveFacilities } from '@/lib/actions/reservations'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Ajukan Reservasi Fasilitas - FIVORA',
  description:
    'Formulir pengajuan peminjaman dan reservasi fasilitas kampus.',
}

interface NewReservationPageProps {
  searchParams: Promise<{ facility_id?: string }>
}

export default async function NewReservationPage({
  searchParams,
}: NewReservationPageProps) {
  const user = await getCurrentUser()
  const params = await searchParams

  const returnTo = params.facility_id
    ? `/reservations/new?${new URLSearchParams({ facility_id: params.facility_id })}`
    : '/reservations/new'
  const accessRedirect = reservationAccessRedirect(user, returnTo)
  if (accessRedirect) redirect(accessRedirect)
  const facilities = await getActiveFacilities()

  const defaultFacilityId = params.facility_id
    ? Number(params.facility_id)
    : undefined

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] selection:bg-[#FCF1D0] selection:text-[#010736]">
      <Navbar
        user={
          user
            ? { name: user.name, email: user.email, role: user.role }
            : null
        }
      />

      <main className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:py-12">
        <ReservationForm
          facilities={facilities}
          defaultFacilityId={
            defaultFacilityId && Number.isSafeInteger(defaultFacilityId) && defaultFacilityId > 0
              ? defaultFacilityId
              : undefined
          }
        />
      </main>

      <Footer />
    </div>
  )
}