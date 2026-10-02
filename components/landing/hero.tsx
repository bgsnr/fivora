import Link from "next/link"

import { ShieldCheck, ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D8DFEA] pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Background foto */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px]"
        style={{
          backgroundImage: 'url("/wp.png")',
          opacity: 0.5,
          transform: "scale(1.03)",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/55" />

      {/* Soft navy glow */}
      <div className="absolute -left-24 top-20 size-72 rounded-full bg-[#010736]/5 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-[#FCF1D0]/40 blur-3xl" />

      {/* Isi Hero */}
      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Kolom kiri */}
          <div className="flex flex-col items-start lg:col-span-7">
            {/* Label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#22396F]/20 bg-white/90 px-3 py-1.5 font-mono text-xs font-semibold text-[#010736] shadow-sm backdrop-blur-sm">
              <span className="size-2 rounded-full bg-[#010736]" />
              SISTEM FASILITAS KAMPUS TERPADU
            </div>

            {/* Judul */}
            <h1 className="font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[#010736] sm:text-6xl lg:text-[68px]">
              Reservasi ruang dan peralatan kampus,{" "}
              <span className="text-[#22396F]">
                tanpa bentrok jadwal.
              </span>
            </h1>

            {/* Deskripsi */}
            <p className="mt-6 max-w-xl text-base font-normal leading-relaxed text-[#52627D] sm:text-lg">
              Pantau ketersediaan ruang kelas, laboratorium, aula, dan
              perlengkapan akademik secara transparan. Sistem tervalidasi per
              kelipatan 30 menit dalam jam layanan resmi 07.00 sampai 20.00 WIB.
            </p>

            {/* Tombol */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#katalog">
                <Button
                  variant="accent"
                  size="lg"
                  className="rounded-full bg-[#010736] px-5 text-sm font-semibold text-white shadow-md shadow-[#010736]/15 transition-all hover:bg-[#0D1C42] hover:shadow-lg"
                >
                  Cari Fasilitas
                </Button>
              </Link>

              <Link href="/reports">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-[#22396F]/25 bg-white/90 px-5 text-sm font-medium text-[#010736] shadow-sm transition-all hover:bg-[#FCF1D0] hover:text-[#010736]"
                >
                  Lapor Kerusakan
                  <ArrowUpRight className="ml-1 size-4 text-[#22396F]" />
                </Button>
              </Link>
            </div>

            {/* Informasi operasional */}
            <div className="mt-12 grid w-full grid-cols-3 gap-4 border-t border-[#22396F]/15 pt-8 font-mono">
              <div>
                <div className="text-xl font-bold text-[#010736] sm:text-2xl">
                  07:00-20:00
                </div>

                <div className="mt-0.5 text-[11px] text-[#52627D]">
                  Jam Operasional WIB
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-[#22396F] sm:text-2xl">
                  30 Menit
                </div>

                <div className="mt-0.5 text-[11px] text-[#52627D]">
                  Slot Waktu Tetap
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-[#010736] sm:text-2xl">
                  RLS Postgres
                </div>

                <div className="mt-0.5 text-[11px] text-[#52627D]">
                  Keamanan Berbasis Peran
                </div>
              </div>
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#D8DFEA] bg-white/90 p-6 shadow-xl shadow-[#010736]/10 backdrop-blur-sm">
              {/* Header monitoring */}
              <div className="mb-4 flex items-center justify-between border-b border-[#D8DFEA] pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 animate-pulse rounded-full bg-emerald-500" />

                  <span className="font-heading text-sm font-bold text-[#010736]">
                    Papan Monitoring Ketersediaan
                  </span>
                </div>

                <span className="rounded-full border border-[#22396F]/15 bg-[#FCF1D0] px-2.5 py-1 font-mono text-[10px] font-bold text-[#010736]">
                  HARI INI
                </span>
              </div>

              {/* Data fasilitas */}
              <div className="space-y-3">
                {/* Fasilitas 1 */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition-colors hover:bg-emerald-50">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#010736]">
                      Lab Multimedia & AI
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-700">
                      TERSEDIA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#52627D]">
                    <span>Gedung C Lantai 2</span>
                    <span>•</span>
                    <span>Kapasitas 45 PC</span>
                  </div>
                </div>

                {/* Fasilitas 2 */}
                <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 transition-colors hover:bg-red-50">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#010736]">
                      Aula Graha Utama
                    </span>

                    <span className="rounded-full border border-red-200 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-red-700">
                      TIDAK TERSEDIA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#52627D]">
                    <span>Gedung Rektorat</span>
                    <span>•</span>
                    <span>Kapasitas 500 Orang</span>
                  </div>
                </div>

                {/* Fasilitas 3 */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 transition-colors hover:bg-emerald-50">
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#010736]">
                      Smart Room B.301
                    </span>

                    <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-700">
                      TERSEDIA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#52627D]">
                    <span>Gedung Kuliah Bersama</span>
                    <span>•</span>
                    <span>Kapasitas 60 Kursi</span>
                  </div>
                </div>
              </div>

              {/* Footer monitoring */}
              <div className="mt-4 flex items-center justify-between border-t border-[#D8DFEA] pt-3 text-[11px] text-[#52627D]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#22396F]" />
                  <span>Verifikasi Petugas Terpusat</span>
                </div>

                <Link
                  href="#katalog"
                  className="font-semibold text-[#010736] transition-colors hover:text-[#22396F] hover:underline"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}