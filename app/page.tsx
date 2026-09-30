import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import {
  FacilityShowcase,
  FALLBACK_FACILITIES,
  type FacilityItem,
} from "@/components/landing/facility-showcase"
import { Features } from "@/components/landing/features"
import { Workflow } from "@/components/landing/workflow"
import { OperatingHours } from "@/components/landing/operating-hours"
import { Footer } from "@/components/landing/footer"
import { getActiveFacilities } from "@/lib/actions/reservations"
import { getFacilitySlotAvailability } from "@/lib/integration"
import { getWIBDateTime } from "@/lib/validations/reservation-time"

const TYPE_LABELS: Record<string, FacilityItem["type"]> = {
  ruang_kelas: "Ruang Kelas",
  laboratorium: "Laboratorium",
  aula: "Aula",
  lapangan: "Lapangan",
  alat: "Peralatan",
}

const CAPACITY_UNITS: Record<string, string> = {
  ruang_kelas: "Mahasiswa",
  laboratorium: "Workstation PC",
  aula: "Kursi Peserta",
  lapangan: "Pemain",
  alat: "Unit",
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Katalog publik dibangun dari data nyata (getFacilitySlotAvailability)
 * agar status ketersediaan konsisten dengan penguncian slot di Chapter 5.
 * Jika DB belum terjangkau, gunakan data demo sebagai cadangan agar
 * halaman landing tetap tampil selama build/prerender.
 */
async function buildPublicFacilities(): Promise<FacilityItem[]> {
  try {
    const raw = await getActiveFacilities()
    const now = new Date()
    const wib = getWIBDateTime(now)

    const items: FacilityItem[] = []

    for (const facility of raw) {
      // Fasilitas nonaktif tidak ditampilkan di daftar publik (AGENTS.md)
      if (facility.status === "nonaktif") continue

      const type = TYPE_LABELS[facility.type] ?? "Peralatan"
      const capacityUnit = CAPACITY_UNITS[facility.type] ?? "Pengguna"
      const code = `FAC-${String(facility.id).padStart(3, "0")}`

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
      let operationalInfo = "Tersedia slot hari ini (07.00 - 20.00 WIB)"

      const slots = await getFacilitySlotAvailability(
        facility.id,
        wib.dateStr,
        now
      )
      const currentSlot = slots.find(
        (slot) =>
          minutesOf(slot.startTime) <= wib.totalMinutes &&
          wib.totalMinutes < minutesOf(slot.endTime)
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
  } catch {
    return FALLBACK_FACILITIES
  }
}

export default async function Home() {
  const facilities = await buildPublicFacilities()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero />
        <FacilityShowcase facilities={facilities} />
        <Features />
        <Workflow />
        <OperatingHours />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
