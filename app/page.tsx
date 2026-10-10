import { redirect } from 'next/navigation'
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import {
  FacilityShowcase,
  FALLBACK_FACILITIES,
  type FacilityItem,
} from "@/components/landing/facility-showcase"
import { Workflow } from "@/components/landing/workflow"
import { OperatingHours } from "@/components/landing/operating-hours"
import { Footer } from "@/components/landing/footer"
import { getActiveFacilities } from "@/lib/actions/reservations"
import { getCurrentUser } from "@/lib/auth"
import { getFacilitySlotAvailability } from "@/lib/integration"
import { getWIBDateTime } from "@/lib/validations/reservation-time"

import { getFacilityCategory, isEquipmentFacility } from '@/lib/facility-categories'

const CAPACITY_UNITS: Record<string, string> = {
  'Ruang Kelas': 'Mahasiswa',
  Laboratorium: 'Workstation PC',
  Aula: 'Kursi Peserta',
  Lapangan: 'Pemain',
  Lainnya: 'Pengguna',
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Katalog publik dibangun dari data fasilitas aktif.
 * Status ketersediaan diperiksa berdasarkan jadwal slot hari ini.
 * Data contoh digunakan sebagai cadangan jika pengambilan data gagal.
 */
async function buildPublicFacilities(): Promise<FacilityItem[]> {
  try {
    const raw = await getActiveFacilities()
    const now = new Date()
    const wib = getWIBDateTime(now)

    const items: FacilityItem[] = []

    for (const facility of raw) {
      // Fasilitas nonaktif tidak ditampilkan kepada pengunjung.
      if (facility.status === "nonaktif") continue

      // Normalisasi tipe fasilitas dari database.
      const type = getFacilityCategory(facility.type)
      const capacityUnit = isEquipmentFacility(facility.type) ? 'Unit' : CAPACITY_UNITS[type]

      const code = `FAC-${String(facility.id).padStart(3, "0")}`

      // Fasilitas yang sedang diperbaiki tidak tersedia untuk digunakan.
      if (facility.status === "dalam_perbaikan") {
        items.push({
          id: facility.id,
          code,
          name: facility.name,
          type,
          location: facility.location ?? "",
          capacity: facility.capacity ?? 1,
          capacityUnit,
          status: "maintenance",
          description: facility.description ?? "",
          operationalInfo: "Sedang dalam perbaikan oleh petugas",
        })

        continue
      }

      let status: FacilityItem["status"] = "available"
      let operationalInfo =
        "Tersedia slot hari ini (07.00 - 20.00 WIB)"

      const slots = await getFacilitySlotAvailability(
        facility.id,
        wib.dateStr,
        now,
      )

      // Periksa apakah waktu sekarang termasuk slot yang terpakai.
      const currentSlot = slots.find(
        (slot) =>
          minutesOf(slot.startTime) <= wib.totalMinutes &&
          wib.totalMinutes < minutesOf(slot.endTime),
      )

      if (currentSlot?.isBooked) {
        status = "in_use"
        operationalInfo = "Sedang dipakai pada slot jadwal saat ini"
      }

      items.push({
        id: facility.id,
        code,
        name: facility.name,
        type,
        location: facility.location ?? "",
        capacity: facility.capacity ?? 1,
        capacityUnit,
        status,
        description: facility.description ?? "",
        operationalInfo,
      })
    }

    return items.length > 0 ? items : FALLBACK_FACILITIES
  } catch (error) {
    console.error("Gagal memuat katalog fasilitas publik:", error)
    return FALLBACK_FACILITIES
  }
}

export default async function Home() {
  const user = await getCurrentUser()

   // Admin langsung ke dashboard admin
  if (user?.role === 'admin' && user.status === 'aktif') {
    redirect('/admin')
  }

  // Petugas langsung ke halaman petugas
  if (user?.role === 'petugas' && user.status === 'aktif') {
    redirect('/petugas')
  }

  const facilities = await buildPublicFacilities()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Navigasi atas */}
      <Navbar
        user={
          user
            ? { name: user.name, email: user.email, role: user.role }
            : null
        }
      />

      {/* Konten landing page */}
      <main className="flex-1">
        <Hero user={user} />
        <FacilityShowcase facilities={facilities} />
        <Workflow />
        <OperatingHours user={user} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}