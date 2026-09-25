"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface FacilityItem {
  id: number
  code: string
  name: string
  type: "Ruang Kelas" | "Laboratorium" | "Aula" | "Lapangan" | "Peralatan"
  location: string
  capacity: number
  capacityUnit: string
  status: "available" | "in_use" | "maintenance"
  description: string
  operationalInfo: string
}

export const FALLBACK_FACILITIES: FacilityItem[] = [
  {
    id: 1,
    code: "LAB-MM-01",
    name: "Laboratorium Multimedia dan Rekayasa AI",
    type: "Laboratorium",
    location: "Gedung C, Lantai 2",
    capacity: 45,
    capacityUnit: "Workstation PC",
    status: "available",
    description: "45 unit PC Core i7 dengan GPU RTX, sistem proyektor ganda, dan switch LAN gigabit berkecepatan tinggi.",
    operationalInfo: "Tersedia slot hari ini (07.00 - 20.00 WIB)",
  },
  {
    id: 2,
    code: "AULA-GU",
    name: "Aula Graha Pertemuan Utama",
    type: "Aula",
    location: "Gedung Rektorat Sayap Barat",
    capacity: 500,
    capacityUnit: "Kursi Peserta",
    status: "in_use",
    description: "Panggung auditorium ber-AC, tata suara line array 10.000W, videotron LED 6x3 meter, dan ruang transit VIP.",
    operationalInfo: "Sedang digunakan kuliah umum s.d 15.30 WIB",
  },
  {
    id: 3,
    code: "RK-B301",
    name: "Smart Classroom B.301",
    type: "Ruang Kelas",
    location: "Gedung Kuliah Bersama, Lantai 3",
    capacity: 60,
    capacityUnit: "Mahasiswa",
    status: "available",
    description: "Papan tulis interaktif 85 inch, kamera tracking dosen otomatis, mic nirkabel, dan formasi kursi diskusi.",
    operationalInfo: "Tersedia slot hari ini (07.00 - 20.00 WIB)",
  },
  {
    id: 4,
    code: "LAP-FUT",
    name: "Gelanggang Olahraga Futsal Indoor",
    type: "Lapangan",
    location: "Kompleks Olahraga Mahasiswa",
    capacity: 120,
    capacityUnit: "Penonton",
    status: "available",
    description: "Lantai interlock standar kompetisi, pencahayaan LED sorot malam, ruang ganti, dan tribun barat.",
    operationalInfo: "Tersedia slot sore (15.00 - 20.00 WIB)",
  },
  {
    id: 5,
    code: "EQUIP-SND",
    name: "Paket Mobile Sound System Portable",
    type: "Peralatan",
    location: "Unit Layanan Sarana Prasarana (UPT)",
    capacity: 2,
    capacityUnit: "Speaker Aktif",
    status: "available",
    description: "2 unit active speaker 15 inch dengan stand, mixer 8 channel audio, dan 4 mikrofon nirkabel UHF.",
    operationalInfo: "Siap dipinjam untuk kegiatan resmi fakultas",
  },
  {
    id: 6,
    code: "LAB-CLD-04",
    name: "Laboratorium Komputasi Awan dan Jaringan",
    type: "Laboratorium",
    location: "Gedung D, Lantai 4",
    capacity: 35,
    capacityUnit: "PC Server",
    status: "maintenance",
    description: "Dalam proses perawatan berkala kabel optik jaringan dan penggantian modul catu daya cadangan.",
    operationalInfo: "Perbaikan teknis berlangsung s.d esok hari",
  },
]

const CATEGORIES = [
  "Semua",
  "Ruang Kelas",
  "Laboratorium",
  "Aula",
  "Lapangan",
  "Peralatan",
] as const

export function FacilityShowcase({
  facilities = FALLBACK_FACILITIES,
}: {
  facilities?: FacilityItem[]
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        facility.name.toLowerCase().includes(query) ||
        facility.location.toLowerCase().includes(query) ||
        facility.code.toLowerCase().includes(query) ||
        facility.description.toLowerCase().includes(query)

      const matchesCategory =
        selectedCategory === "Semua" || facility.type === selectedCategory

      const matchesStatus =
        selectedStatus === "all" || facility.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [facilities, searchTerm, selectedCategory, selectedStatus])

  return (
    <section id="katalog" className="scroll-mt-16 py-16 lg:py-24 border-b border-border bg-[#f9f9f9]">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Editorial and High Contrast */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="font-mono text-xs font-semibold text-[#5318eb] uppercase tracking-wider mb-2">
              DIREKTORI FASILITAS KAMPUS
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c021c]">
              Katalog Ketersediaan Ruang dan Sarana
            </h2>
            <p className="mt-2 text-sm text-[#4a454d] max-w-2xl leading-relaxed">
              Daftar fasilitas dapat dipantau langsung oleh pengunjung umum tanpa login. Setiap pemakaian divalidasi dalam kelipatan 30 menit oleh petugas sarana prasarana.
            </p>
          </div>

          <div className="rounded-lg border border-[#e2e2e2] bg-white p-3 text-xs text-[#4a454d] max-w-md">
            <div className="flex items-center gap-2 font-semibold text-[#0c021c] mb-1">
              <Info className="size-3.5 text-[#5318eb]" />
              Akses Pengunjung Publik
            </div>
            <span>Status ketersediaan ditampilkan secara langsung tanpa memuat data pribadi peminjam.</span>
          </div>
        </div>

        {/* Filter and Search Bar: Clean & High Usability */}
        <div className="mb-8 rounded-xl border border-[#e2e2e2] bg-white p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7b757d]" />
              <Input
                type="text"
                placeholder="Cari nama ruang, kode fasilitas, atau gedung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-xs border-[#e2e2e2] bg-white text-[#0c021c] focus-visible:ring-[#5318eb]"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-[#0c021c] text-white"
                      : "bg-[#f3f3f3] text-[#4a454d] hover:bg-[#e8e8e8] hover:text-[#0c021c]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Status Quick Filter */}
            <div className="flex items-center gap-1 border-t md:border-t-0 md:border-l border-[#e2e2e2] pt-2 md:pt-0 md:pl-4">
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedStatus === "all"
                    ? "font-bold text-[#0c021c] bg-[#eeeeee]"
                    : "text-[#4a454d] hover:text-[#0c021c]"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("available")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedStatus === "available"
                    ? "font-bold text-emerald-800 bg-emerald-50 border border-emerald-200"
                    : "text-[#4a454d] hover:text-[#0c021c]"
                }`}
              >
                Tersedia
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("in_use")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedStatus === "in_use"
                    ? "font-bold text-amber-800 bg-amber-50 border border-amber-200"
                    : "text-[#4a454d] hover:text-[#0c021c]"
                }`}
              >
                Dipakai
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus("maintenance")}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  selectedStatus === "maintenance"
                    ? "font-bold text-rose-800 bg-rose-50 border border-rose-200"
                    : "text-[#4a454d] hover:text-[#0c021c]"
                }`}
              >
                Perbaikan
              </button>
            </div>

          </div>
        </div>

        {/* Dynamic Facility Display with Asymmetric RHYTHM */}
        {filteredFacilities.length === 0 ? (
          /* Empty State (R-27) */
          <div className="rounded-xl border border-[#e2e2e2] bg-white p-12 text-center">
            <div className="size-12 rounded-full bg-[#f3f3f3] text-[#7b757d] flex items-center justify-center mx-auto mb-3">
              <Search className="size-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-[#0c021c]">
              Tidak ada fasilitas yang cocok
            </h3>
            <p className="mt-1 text-xs text-[#4a454d] max-w-md mx-auto">
              Periksa kembali kata kunci pencarian Anda atau kembalikan filter kategori ke pengaturan awal.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("Semua")
                setSelectedStatus("all")
              }}
              className="mt-4 text-xs font-semibold"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFacilities.map((facility) => {
              const isAvailable = facility.status === "available"
              const isInUse = facility.status === "in_use"
              const isMaintenance = facility.status === "maintenance"

              return (
                <div
                  key={facility.id}
                  className="rounded-xl border border-[#e2e2e2] bg-white p-5 flex flex-col justify-between transition-all hover:border-[#5318eb]/50 hover:shadow-sm"
                >
                  <div>
                    {/* Header: Code and Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] font-semibold text-[#5318eb] bg-[#5318eb]/10 px-2 py-0.5 rounded">
                        {facility.code}
                      </span>

                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Tersedia
                        </span>
                      )}
                      {isInUse && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                          <Clock className="size-3 text-amber-600" />
                          Dipakai
                        </span>
                      )}
                      {isMaintenance && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                          <AlertTriangle className="size-3 text-rose-600" />
                          Perbaikan
                        </span>
                      )}
                    </div>

                    {/* Facility Title and Description */}
                    <h3 className="font-heading text-base font-bold text-[#0c021c] line-clamp-1">
                      {facility.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#4a454d] leading-relaxed line-clamp-2">
                      {facility.description}
                    </p>

                    {/* Metadata Specs */}
                    <div className="mt-4 pt-3 border-t border-[#f3f3f3] space-y-2 text-xs text-[#4a454d]">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-[#5318eb] shrink-0" />
                        <span className="truncate">{facility.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-[#7b757d] shrink-0" />
                        <span>Kapasitas: {facility.capacity} {facility.capacityUnit}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#0c021c] bg-[#f9f9f9] p-1.5 rounded">
                        <Clock className="size-3 text-[#5318eb] shrink-0" />
                        <span className="truncate">{facility.operationalInfo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Single Verb CTAs */}
                  <div className="mt-5 pt-3 border-t border-[#e2e2e2]">
                    <Link
                      href={`/login?redirect=${isAvailable ? '/reservasi/buat' : '/reservasi'}`}
                      className="w-full block"
                    >
                      <Button
                        variant={isAvailable ? "accent" : "outline"}
                        size="sm"
                        disabled={isMaintenance}
                        className={`w-full justify-center text-xs font-semibold h-9 ${
                          isAvailable
                            ? "bg-[#5318eb] text-white hover:bg-[#4312c4]"
                            : "text-[#0c021c] border-[#e2e2e2]"
                        }`}
                      >
                        {isAvailable
                          ? "Reservasi"
                          : isInUse
                          ? "Periksa Jadwal"
                          : "Dalam Pemeliharaan"}
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}

