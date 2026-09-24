import Link from "next/link"
import { ShieldCheck, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border pt-12 pb-16 lg:pt-20 lg:pb-24">
      {/* Background foto */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[2px]"
        style={{
          backgroundImage: 'url("/wp.png")',
          opacity: 0.6,
          transform: "scale(1.03)",
        }}
      />

      {/* Overlay transparan */}
      <div className="absolute inset-0 bg-white/40" />

      {/* Isi Hero */}
      <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Kolom kiri */}
          <div className="flex flex-col items-start lg:col-span-7">
            
            {/* Label */}
            <div className="mb-6 inline-flex items-center gap-2 rounded border border-[#e2e2e2] bg-[#f9f9f9]/95 px-2.5 py-1 text-xs font-mono font-medium text-[#0c021c]">
              <span className="size-2 rounded-full bg-[#5318eb]" />
              SISTEM FASILITAS KAMPUS TERPADU
            </div>

            {/* Judul */}
            <h1 className="font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0c021c] sm:text-6xl lg:text-[68px]">
              Reservasi ruang dan peralatan kampus,{" "}
              <span className="text-[#5318eb]">
                tanpa bentrok jadwal.
              </span>
            </h1>

            {/* Deskripsi */}
            <p className="mt-6 max-w-xl text-base font-normal leading-relaxed text-[#4a454d] sm:text-lg">
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
                  className="bg-[#5318eb] text-sm font-semibold text-white hover:bg-[#4513c7]"
                >
                  Cari Fasilitas
                </Button>
              </Link>

              <Link href="/reports">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border bg-white/90 text-sm font-medium text-[#0c021c] hover:bg-white"
                >
                  Lapor Kerusakan
                  <ArrowUpRight className="size-4 text-[#4a454d]" />
                </Button>
              </Link>
            </div>

            {/* Informasi operasional */}
            <div className="mt-12 grid w-full grid-cols-3 gap-4 border-t border-[#e2e2e2] pt-8 font-mono">
              <div>
                <div className="text-xl font-bold text-[#0c021c] sm:text-2xl">
                  07:00-20:00
                </div>
                <div className="mt-0.5 text-[11px] text-[#4a454d]">
                  Jam Operasional WIB
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-[#5318eb] sm:text-2xl">
                  30 Menit
                </div>
                <div className="mt-0.5 text-[11px] text-[#4a454d]">
                  Slot Waktu Tetap
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-[#0c021c] sm:text-2xl">
                  RLS Postgres
                </div>
                <div className="mt-0.5 text-[11px] text-[#4a454d]">
                  Keamanan Berbasis Peran
                </div>
              </div>
            </div>
          </div>

          {/* Kolom kanan */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#e2e2e2] bg-[#f9f9f9]/95 p-6 shadow-sm backdrop-blur-sm">
              
              {/* Header monitoring */}
              <div className="mb-4 flex items-center justify-between border-b border-[#e2e2e2] pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 animate-pulse rounded-full bg-emerald-500" />

                  <span className="font-heading text-sm font-bold text-[#0c021c]">
                    Papan Monitoring Ketersediaan
                  </span>
                </div>

                <span className="rounded border border-[#e2e2e2] bg-white px-2 py-0.5 font-mono text-[11px] text-[#4a454d]">
                  HARI INI
                </span>
              </div>

              {/* Data fasilitas */}
              <div className="space-y-3">
                
                {/* Fasilitas 1 */}
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0c021c]">
                      Lab Multimedia & AI
                    </span>

                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                      TERSEDIA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#4a454d]">
                    <span>Gedung C Lantai 2</span>
                    <span>•</span>
                    <span>Kapasitas 45 PC</span>
                  </div>
                </div>

                {/* Fasilitas 2 */}
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0c021c]">
                      Aula Graha Utama
                    </span>

                    <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                      DIPAKAI (s.d 15:30)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#4a454d]">
                    <span>Gedung Rektorat</span>
                    <span>•</span>
                    <span>Kapasitas 500 Orang</span>
                  </div>
                </div>

                {/* Fasilitas 3 */}
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0c021c]">
                      Smart Room B.301
                    </span>

                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                      TERSEDIA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#4a454d]">
                    <span>Gedung Kuliah Bersama</span>
                    <span>•</span>
                    <span>Kapasitas 60 Kursi</span>
                  </div>
                </div>
              </div>

              {/* Footer monitoring */}
              <div className="mt-4 flex items-center justify-between border-t border-[#e2e2e2] pt-3 text-[11px] text-[#4a454d]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#5318eb]" />
                  <span>Verifikasi Petugas Terpusat</span>
                </div>

                <Link
                  href="#katalog"
                  className="font-semibold text-[#5318eb] hover:underline"
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