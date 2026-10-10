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
import { getCurrentUser } from "@/lib/auth"
import { getFacilitySlotAvailability } from "@/lib/integration"
import { getWIBDateTime } from "@/lib/validations/reservation-time"

// Menyamakan format tipe fasilitas dari database.
// Contoh: "Ruang Kelas" menjadi "ruang_kelas".
function normalizeTypeKey(type: string | null | undefined): string {
  return (type ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s/-]+/g, "_")
    .replace(/_+/g, "_")
}

// Memetakan tipe fasilitas ke kategori yang ditampilkan.
const TYPE_LABELS: Record<string, FacilityItem["type"]> = {
  ruang: "Ruang Kelas",
  ruangan: "Ruang Kelas",
  kelas: "Ruang Kelas",
  ruang_kelas: "Ruang Kelas",
  ruang_kuliah: "Ruang Kelas",
  ruangan_kuliah: "Ruang Kelas",
  classroom: "Ruang Kelas",
  class: "Ruang Kelas",

  lab: "Laboratorium",
  laboratorium: "Laboratorium",
  laboratory: "Laboratorium",

  aula: "Aula",
  auditorium: "Aula",

  lapangan: "Lapangan",
  lapangan_olahraga: "Lapangan",
  lapangan_futsal: "Lapangan",
  lapangan_basket: "Lapangan",
  lapangan_voli: "Lapangan",
  lapangan_badminton: "Lapangan",
  field: "Lapangan",

  alat: "Peralatan",
  alat_lab: "Peralatan",
  peralatan: "Peralatan",
  peralatan_lab: "Peralatan",
  perlengkapan: "Peralatan",
  equipment: "Peralatan",

  lainnya: "Lainnya",
}

// Satuan kapasitas ditentukan berdasarkan kategori hasil pemetaan,
// bukan berdasarkan penulisan tipe asli di database.
const CAPACITY_UNITS: Record<string, string> = {
  "Ruang Kelas": "Mahasiswa",
  Laboratorium: "Workstation PC",
  Aula: "Kursi Peserta",
  Lapangan: "Pemain",
  Peralatan: "Unit",
  Lainnya: "Pengguna",
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
      const typeKey = normalizeTypeKey(facility.type)
      const type = TYPE_LABELS[typeKey] ?? "Lainnya"
      const capacityUnit = CAPACITY_UNITS[type] ?? "Pengguna"

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
  const facilities = await buildPublicFacilities()
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-foreground">
      {/* Navigasi atas */}
      <Navbar
        user={
          user
            ? { name: user.name, role: user.role }
            : null
        }
      />

      {/* Konten landing page */}
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