import Link from "next/link"
import { Clock, ShieldCheck, CalendarClock, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative border-b border-border bg-background pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Display Typography */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Meta Label using Space Mono */}
            <div className="inline-flex items-center gap-2 rounded border border-[#e2e2e2] bg-[#f9f9f9] px-2.5 py-1 text-xs font-mono font-medium text-[#0c021c] mb-6">
              <span className="size-2 rounded-full bg-[#5318eb]" />
              SISTEM FASILITAS KAMPUS TERPADU
            </div>

            {/* Monumental Headline */}
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-[-0.03em] text-[#0c021c] leading-[1.02]">
              Reservasi ruang dan peralatan kampus,{" "}
              <span className="text-[#5318eb]">tanpa bentrok jadwal.</span>
            </h1>

            {/* Crisp Body Text (No em-dashes!) */}
            <p className="mt-6 max-w-xl text-base sm:text-lg font-normal text-[#4a454d] leading-relaxed">
              Pantau ketersediaan ruang kelas, laboratorium, aula, dan perlengkapan akademik secara transparan. Sistem tervalidasi per kelipatan 30 menit dalam jam layanan resmi 07.00 sampai 20.00 WIB.
            </p>

            {/* Single Verb CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#katalog">
                <Button variant="accent" size="lg" className="bg-[#5318eb] text-white hover:bg-[#4513c7] font-semibold text-sm">
                  Cari Fasilitas
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="lg" className="border-border text-[#0c021c] hover:bg-[#f3f3f3] font-medium text-sm">
                  Lapor Kerusakan
                  <ArrowUpRight className="size-4 text-[#4a454d]" />
                </Button>
              </Link>
            </div>

            {/* Operational Metrics (Real Campus Constraints) */}
            <div className="mt-12 pt-8 border-t border-[#e2e2e2] w-full grid grid-cols-3 gap-4 font-mono">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-[#0c021c]">07:00-20:00</div>
                <div className="text-[11px] text-[#4a454d] mt-0.5">Jam Operasional WIB</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-[#5318eb]">30 Menit</div>
                <div className="text-[11px] text-[#4a454d] mt-0.5">Slot Waktu Tetap</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-[#0c021c]">RLS Postgres</div>
                <div className="text-[11px] text-[#4a454d] mt-0.5">Keamanan Berbasis Peran</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Status Snapshot Widget */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#e2e2e2] bg-[#f9f9f9] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-heading text-sm font-bold text-[#0c021c]">
                    Papan Monitoring Ketersediaan
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#4a454d] bg-white border border-[#e2e2e2] px-2 py-0.5 rounded">
                  HARI INI
                </span>
              </div>

              {/* Sample Live Records */}
              <div className="space-y-3">
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#0c021c]">Lab Multimedia & AI</span>
                    <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      TERSEDIA
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4a454d] flex items-center gap-2">
                    <span>Gedung C Lantai 2</span>
                    <span>•</span>
                    <span>Kapasitas 45 PC</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#0c021c]">Aula Graha Utama</span>
                    <span className="font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      DIPAKAI (s.d 15:30)
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4a454d] flex items-center gap-2">
                    <span>Gedung Rektorat</span>
                    <span>•</span>
                    <span>Kapasitas 500 Orang</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#e2e2e2] bg-white p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#0c021c]">Smart Room B.301</span>
                    <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      TERSEDIA
                    </span>
                  </div>
                  <div className="text-[11px] text-[#4a454d] flex items-center gap-2">
                    <span>Gedung Kuliah Bersama</span>
                    <span>•</span>
                    <span>Kapasitas 60 Kursi</span>
                  </div>
                </div>
              </div>

              {/* Status footer information */}
              <div className="mt-4 pt-3 border-t border-[#e2e2e2] flex items-center justify-between text-[11px] text-[#4a454d]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-[#5318eb]" />
                  <span>Verifikasi Petugas Terpusat</span>
                </div>
                <Link href="#katalog" className="text-[#5318eb] font-semibold hover:underline">
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
