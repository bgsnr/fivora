import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'
import { ReservationForm } from '@/components/reservations/reservation-form'
import { getActiveFacilities } from '@/lib/actions/reservations'
import { getCurrentUser } from '@/lib/auth'

export const metadata = {
  title: 'Ajukan Reservasi Fasilitas - FIVORA',
  description: 'Formulir pengajuan peminjaman dan reservasi fasilitas kampus.',
}

export default async function NewReservationPage() {
  const facilities = await getActiveFacilities()
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <ReservationForm
          facilities={facilities}
        />
      </main>

      <Footer />
    </div>
  )
}
