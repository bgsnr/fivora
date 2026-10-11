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

import { getLandingFacilities } from '@/lib/actions/live-data'
import { useAutoRefresh, canApplyRefresh } from '@/lib/use-auto-refresh'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { getFacilityCategory, type FacilityCategory } from '@/lib/facility-categories'

type CategoryFilter = "Semua" | FacilityCategory

export interface FacilityItem {
  id: number
  code: string
  name: string
  type: string
  location: string
  capacity: number | null
  capacityUnit: string
  status: "available" | "in_use" | "maintenance" | "inactive" | "unavailable"
  description: string
  operationalInfo: string
}

const MAX_DISPLAYED_FACILITIES = 6

const CATEGORIES: CategoryFilter[] = [
  "Semua",
  "Ruang Kelas",
  "Laboratorium",
  "Aula",
  "Lapangan",
  "Lainnya",
]

export function FacilityShowcase({
  facilities = [],
  loadError = '',
}: {
  facilities?: FacilityItem[]
  loadError?: string
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("Semua")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const [liveFacilities, setLiveFacilities] = useState(facilities)
  const [readError, setReadError] = useState(loadError)

  useAutoRefresh(async (signal, automatic) => {
    try {
      const result = await getLandingFacilities()
      if (!canApplyRefresh(signal, automatic)) return
      if (!result.success) { setReadError(result.error); return }
      setLiveFacilities(result.facilities)
      setReadError('')
    } catch {
      if (canApplyRefresh(signal, automatic)) setReadError('Daftar fasilitas gagal diperbarui. Coba lagi.')
    }
  })

  // Pencarian dan filter tetap diterapkan sebelum jumlah kartu dibatasi.
  const filteredFacilities = useMemo(() => {
    return liveFacilities.filter((facility) => {
      const query = searchTerm.toLowerCase().trim()

      const matchesSearch =
        facility.name.toLowerCase().includes(query) ||
        facility.location.toLowerCase().includes(query) ||
        facility.code.toLowerCase().includes(query) ||
        facility.description.toLowerCase().includes(query)

      const normalizedCategory = getFacilityCategory(
        facility.type,
      )

      const matchesCategory =
        selectedCategory === "Semua" ||
        normalizedCategory === selectedCategory

      const matchesStatus =
        selectedStatus === "all" ||
        facility.status === selectedStatus ||
        (selectedStatus === "in_use" && ["inactive", "unavailable"].includes(facility.status))

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [
    liveFacilities,
    searchTerm,
    selectedCategory,
    selectedStatus,
  ])

  // Landing page hanya menampilkan maksimal 6 fasilitas.
  const displayedFacilities = filteredFacilities.slice(
    0,
    MAX_DISPLAYED_FACILITIES,
  )

  return (
    <section
      id="katalog"
      className="scroll-mt-16 border-b border-[#D8DFEA] bg-white py-16 lg:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Judul katalog */}
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#22396F]">
              DIREKTORI FASILITAS KAMPUS
            </div>

            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#010736] sm:text-4xl">
              Katalog Ketersediaan Ruang dan Sarana
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#52627D]">
              Jelajahi pilihan fasilitas kampus dan lihat
              informasi ketersediaannya. Katalog publik dapat
              diakses tanpa login.
            </p>
          </div>

          <div className="max-w-md rounded-2xl border border-[#22396F]/15 bg-[#FCF1D0] p-4 text-xs text-[#22396F] shadow-sm">
            <div className="mb-1 flex items-center gap-2 font-semibold text-[#010736]">
              <Info className="size-3.5 text-[#22396F]" />
              Akses Pengunjung Publik
            </div>

            <span className="leading-relaxed">
              Informasi fasilitas dapat dilihat tanpa
              menampilkan data pribadi peminjam.
            </span>
          </div>
        </div>

        {/* Pencarian dan filter */}
        <div className="mb-8 rounded-2xl border border-[#D8DFEA] bg-[#F7F9FC] p-4 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            {/* Pencarian */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#22396F]" />

              <Input
                type="text"
                placeholder="Cari nama ruang, kode fasilitas, atau gedung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-full border-[#D0D8E5] bg-white pl-9 text-xs text-[#010736] shadow-none placeholder:text-[#7A879D] focus-visible:ring-2 focus-visible:ring-[#22396F]/30"
              />
            </div>

            {/* Filter kategori */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
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

            {/* Filter ketersediaan */}
            <div className="flex flex-wrap items-center gap-1 border-t border-[#22396F]/10 pt-2 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
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
                onClick={() => setSelectedStatus("available")}
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
                onClick={() => setSelectedStatus("in_use")}
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
                onClick={() => setSelectedStatus("maintenance")}
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

        {readError && (
          <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {readError}
          </p>
        )}

        {/* Daftar fasilitas: maksimal 6 kartu */}
        {filteredFacilities.length === 0 ? (
          <div className="rounded-2xl border border-[#D8DFEA] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#FCF1D0] text-[#22396F]">
              <Search className="size-5" />
            </div>

            <h3 className="font-heading text-base font-bold text-[#010736]">
              Tidak ada fasilitas yang cocok
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#52627D]">
              Periksa kata kunci atau kategori yang dipilih.
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
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedFacilities.map((facility) => {
                const isAvailable = facility.status === "available"
                const isInUse = ["in_use", "inactive", "unavailable"].includes(facility.status)
                const isMaintenance =
                  facility.status === "maintenance"

                return (
                  <div
                    key={facility.id}
                    className="flex flex-col rounded-2xl border border-[#D8DFEA] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#22396F]/40 hover:shadow-lg hover:shadow-[#010736]/5"
                  >
                    {/* Kode dan status fasilitas */}
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#FCF1D0] px-2.5 py-1 font-mono text-[11px] font-bold tracking-tight text-[#010736]">
                        {facility.code}
                      </span>

                      {isAvailable && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                          <CheckCircle2 className="size-3 text-green-600" />
                          Tersedia
                        </span>
                      )}

                      {isInUse && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          <Clock className="size-3 text-red-600" />
                          {facility.status === "inactive" ? 'Nonaktif' : facility.status === "in_use" ? 'Sedang Digunakan' : 'Tidak Tersedia'}
                        </span>
                      )}

                      {isMaintenance && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-semibold text-yellow-700">
                          <AlertTriangle className="size-3 text-yellow-600" />
                          Dalam Perbaikan
                        </span>
                      )}
                    </div>

                    {/* Informasi fasilitas */}
                    <h3 className="font-heading line-clamp-2 text-base font-bold text-[#010736]">
                      {facility.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#52627D]">
                      {facility.description}
                    </p>

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
                          {facility.capacity === null
                            ? 'Kapasitas belum dicantumkan'
                            : `Kapasitas: ${facility.capacity.toLocaleString('id-ID')} ${facility.capacityUnit}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl bg-[#F8F6ED] p-2 font-mono text-[11px] text-[#010736]">
                        <Clock className="size-3 shrink-0 text-[#22396F]" />

                        <span className="line-clamp-2">
                          {facility.operationalInfo}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Jumlah fasilitas yang ditampilkan */}
            <p className="mt-6 text-center text-sm text-[#52627D]">
              Menampilkan {displayedFacilities.length} dari{" "}
              {filteredFacilities.length} fasilitas yang cocok.
            </p>
          </>
        )}

        {/* Tombol menuju katalog lengkap */}
        <div className="mt-8 flex justify-center">
          <Link href="/fasilitas" className="w-full sm:w-auto">
            <Button
              variant="accent"
              size="sm"
              className="h-11 w-full rounded-full bg-[#010736] px-8 text-sm font-semibold text-white shadow-sm hover:bg-[#0D1C42]"
            >
              Lihat Semua Fasilitas
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}