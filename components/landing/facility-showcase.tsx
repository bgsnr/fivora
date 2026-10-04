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
  type:
    | "Ruang Kelas"
    | "Laboratorium"
    | "Aula"
    | "Lapangan"
    | "Peralatan"
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
    description:
      "45 unit PC Core i7 dengan GPU RTX, sistem proyektor ganda, dan switch LAN gigabit berkecepatan tinggi.",
    operationalInfo:
      "Tersedia slot hari ini (07.00 - 20.00 WIB)",
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
    description:
      "Panggung auditorium ber-AC, tata suara line array 10.000W, videotron LED 6x3 meter, dan ruang transit VIP.",
    operationalInfo:
      "Sedang digunakan kuliah umum s.d 15.30 WIB",
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
    description:
      "Papan tulis interaktif 85 inch, kamera tracking dosen otomatis, mic nirkabel, dan formasi kursi diskusi.",
    operationalInfo:
      "Tersedia slot hari ini (07.00 - 20.00 WIB)",
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
    description:
      "Lantai interlock standar kompetisi, pencahayaan LED sorot malam, ruang ganti, dan tribun barat.",
    operationalInfo:
      "Tersedia slot sore (15.00 - 20.00 WIB)",
  },
  {
    id: 5,
    code: "EQUIP-SND",
    name: "Paket Mobile Sound System Portable",
    type: "Peralatan",
    location:
      "Unit Layanan Sarana Prasarana (UPT)",
    capacity: 2,
    capacityUnit: "Speaker Aktif",
    status: "available",
    description:
      "2 unit active speaker 15 inch dengan stand, mixer 8 channel audio, dan 4 mikrofon nirkabel UHF.",
    operationalInfo:
      "Siap dipinjam untuk kegiatan resmi fakultas",
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
    description:
      "Dalam proses perawatan berkala kabel optik jaringan dan penggantian modul catu daya cadangan.",
    operationalInfo:
      "Perbaikan teknis berlangsung s.d esok hari",
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
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Semua")
  const [selectedStatus, setSelectedStatus] =
    useState<string>("all")

  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      const query = searchTerm.toLowerCase()

      const matchesSearch =
        facility.name.toLowerCase().includes(query) ||
        facility.location.toLowerCase().includes(query) ||
        facility.code.toLowerCase().includes(query) ||
        facility.description.toLowerCase().includes(query)

      const matchesCategory =
        selectedCategory === "Semua" ||
        facility.type === selectedCategory

      const matchesStatus =
        selectedStatus === "all" ||
        facility.status === selectedStatus

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [
    facilities,
    searchTerm,
    selectedCategory,
    selectedStatus,
  ])

  return (
    <section
      id="katalog"
      className="scroll-mt-16 border-b border-[#D8DFEA] bg-white py-16 lg:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#22396F]">
              DIREKTORI FASILITAS KAMPUS
            </div>

            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#010736] sm:text-4xl">
              Katalog Ketersediaan Ruang dan Sarana
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52627D]">
              Daftar fasilitas dapat dipantau langsung oleh
              pengunjung umum tanpa login. Setiap pemakaian
              divalidasi dalam kelipatan 30 menit oleh petugas
              sarana prasarana.
            </p>
          </div>

          <div className="max-w-md rounded-2xl border border-[#22396F]/15 bg-[#FCF1D0] p-4 text-xs text-[#22396F] shadow-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[#010736]">
              <Info className="size-3.5 text-[#22396F]" />
              Akses Pengunjung Publik
            </div>

            <span className="leading-relaxed">
              Status ketersediaan ditampilkan secara langsung
              tanpa memuat data pribadi peminjam.
            </span>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="mb-8 rounded-2xl border border-[#D8DFEA] bg-[#F7F9FC] p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#22396F]" />

              <Input
                type="text"
                placeholder="Cari nama ruang, kode fasilitas, atau gedung..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="h-10 rounded-full border-[#D0D8E5] bg-white pl-9 text-xs text-[#010736] shadow-none placeholder:text-[#7A879D] focus-visible:ring-2 focus-visible:ring-[#22396F]/30"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedCategory === category
                      ? "bg-[#010736] text-white shadow-sm"
                      : "bg-white text-[#52627D] hover:bg-[#FCF1D0] hover:text-[#010736]"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 border-t border-[#22396F]/10 pt-2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <button
                type="button"
                onClick={() =>
                  setSelectedStatus("all")
                }
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  selectedStatus === "all"
                    ? "bg-[#010736] font-bold text-white"
                    : "text-[#52627D] hover:bg-white hover:text-[#010736]"
                }`}
              >
                Semua
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedStatus("available")
                }
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  selectedStatus === "available"
                    ? "border border-green-200 bg-green-50 font-bold text-green-800"
                    : "text-[#52627D] hover:bg-white hover:text-[#010736]"
                }`}
              >
                Tersedia
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedStatus("in_use")
                }
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  selectedStatus === "in_use"
                    ? "border border-red-200 bg-red-50 font-bold text-red-800"
                    : "text-[#52627D] hover:bg-white hover:text-[#010736]"
                }`}
              >
                Tidak Tersedia
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedStatus("maintenance")
                }
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  selectedStatus === "maintenance"
                    ? "border border-yellow-200 bg-yellow-50 font-bold text-yellow-800"
                    : "text-[#52627D] hover:bg-white hover:text-[#010736]"
                }`}
              >
                Perbaikan
              </button>
            </div>
          </div>
        </div>

        {/* Facility Display */}
        {filteredFacilities.length === 0 ? (
          <div className="rounded-2xl border border-[#D8DFEA] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#FCF1D0] text-[#22396F]">
              <Search className="size-5" />
            </div>

            <h3 className="font-heading text-base font-bold text-[#010736]">
              Tidak ada fasilitas yang cocok
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#52627D]">
              Periksa kembali kata kunci pencarian Anda atau
              kembalikan filter kategori ke pengaturan awal.
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("Semua")
                setSelectedStatus("all")
              }}
              className="mt-4 rounded-full border-[#22396F]/30 px-4 text-xs font-semibold text-[#010736] hover:bg-[#FCF1D0]"
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredFacilities.map((facility) => {
              const isAvailable =
                facility.status === "available"

              const isInUse =
                facility.status === "in_use"

              const isMaintenance =
                facility.status === "maintenance"

              return (
                <div
                  key={facility.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[#D8DFEA] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#22396F]/40 hover:shadow-lg hover:shadow-[#010736]/5"
                >
                  <div>
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      {/* Facility Code */}
                      <span className="rounded-full bg-[#FCF1D0] px-2.5 py-1 font-mono text-[11px] font-bold tracking-tight text-[#010736]">
                        {facility.code}
                      </span>

                      {/* Tersedia */}
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                          <CheckCircle2 className="size-3 text-green-600" />
                          Tersedia
                        </span>
                      )}

                      {/* Tidak Tersedia */}
                      {isInUse && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          <Clock className="size-3 text-red-600" />
                          Tidak Tersedia
                        </span>
                      )}

                      {/* Dalam Perbaikan */}
                      {isMaintenance && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700">
                          <AlertTriangle className="size-3 text-yellow-600" />
                          Dalam Perbaikan
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-heading line-clamp-1 text-base font-bold text-[#010736]">
                      {facility.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#52627D]">
                      {facility.description}
                    </p>

                    {/* Metadata */}
                    <div className="mt-4 space-y-2 border-t border-[#22396F]/10 pt-3 text-xs text-[#52627D]">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 shrink-0 text-[#22396F]" />

                        <span className="truncate">
                          {facility.location}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 shrink-0 text-[#22396F]" />

                        <span>
                          Kapasitas: {facility.capacity}{" "}
                          {facility.capacityUnit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-[#F8F6ED] p-2 font-mono text-[11px] text-[#010736]">
                        <Clock className="size-3 shrink-0 text-[#22396F]" />

                        <span className="truncate">
                          {facility.operationalInfo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-5 border-t border-[#22396F]/10 pt-3">
                    {/* Tersedia */}
                    {isAvailable && (
                      <Link
                        href="/login?redirect=/reservations/new"
                        className="block w-full"
                      >
                        <Button
                          variant="accent"
                          size="sm"
                          className="h-9 w-full justify-center rounded-full bg-[#010736] text-xs font-semibold text-white shadow-sm hover:bg-[#0D1C42]"
                        >
                          Reservasi
                        </Button>
                      </Link>
                    )}

                    {/* Tidak Tersedia */}
                    {isInUse && (
                      <Link
                        href="/login?redirect=/reservations"
                        className="block w-full"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full justify-center rounded-full border-red-200 bg-red-50/50 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Periksa Jadwal
                        </Button>
                      </Link>
                    )}

                    {/* Dalam Perbaikan */}
                    {isMaintenance && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="h-9 w-full justify-center rounded-full border-yellow-200 bg-yellow-50 text-xs font-semibold text-yellow-700 opacity-100"
                      >
                        Dalam Pemeliharaan
                      </Button>
                    )}
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