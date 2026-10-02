import {
  Clock,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowUpRight,
} from "lucide-react"

export function Features() {
  return (
    <section className="border-b border-[#D8DFEA] bg-white py-16 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="mb-3 inline-flex items-center rounded-full bg-[#FCF1D0] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#010736]">
            Standar dan Integritas Sistem
          </div>

          <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-[#010736] sm:text-4xl">
            Arsitektur Pengelolaan
            <br className="hidden sm:block" />
            Fasilitas Kampus
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#52627D]">
            Fivora menerapkan aturan bisnis yang ketat di sisi server dan
            database PostgreSQL. Setiap proses reservasi dan pengelolaan
            fasilitas dirancang agar transparan, konsisten, dan akuntabel.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Main Feature */}
          <div className="relative overflow-hidden rounded-3xl bg-[#010736] p-7 text-white shadow-xl shadow-[#010736]/10 md:p-9 lg:col-span-7">

            {/* Decorative Accent */}
            <div className="absolute -right-20 -top-20 size-56 rounded-full bg-[#22396F]/40 blur-3xl" />
            <div className="absolute -bottom-24 -left-12 size-48 rounded-full bg-[#FCF1D0]/10 blur-3xl" />

            <div className="relative">

              {/* Label */}
              <div className="mb-7 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FCF1D0] text-[#010736]">
                    <Clock className="size-5" />
                  </div>

                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#FCF1D0]">
                      Logika Validasi Server
                    </p>

                    <p className="mt-0.5 text-xs text-white/55">
                      Otomatis dan konsisten
                    </p>
                  </div>
                </div>

                <div className="hidden items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[10px] font-semibold text-green-300 sm:flex">
                  <CheckCircle2 className="size-3" />
                  Aktif
                </div>
              </div>

              {/* Title */}
              <h3 className="max-w-2xl font-heading text-2xl font-bold leading-tight tracking-tight text-white md:text-[30px]">
                Slot waktu baku 30 menit dan pencegahan bentrok otomatis
              </h3>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                Seluruh pengajuan reservasi diverifikasi langsung di server
                melalui Server Actions. Waktu mulai dan selesai wajib berupa
                kelipatan 30 menit dalam rentang operasional 07.00–20.00 WIB.
                Sistem juga mencegah petugas menyetujui reservasi yang
                bertabrakan pada fasilitas yang sama.
              </p>

              {/* Rules */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#FCF1D0]" />

                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FCF1D0]">
                      Operasional
                    </p>
                  </div>

                  <p className="font-heading text-xl font-bold text-white">
                    07.00–20.00 WIB
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/55">
                    Pengajuan di luar jam operasional otomatis ditolak oleh
                    sistem.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0D1C42] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="size-2 rounded-full bg-[#22396F]" />

                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/70">
                      Anti-Overlap
                    </p>
                  </div>

                  <p className="font-heading text-xl font-bold text-white">
                    Validasi Otomatis
                  </p>

                  <p className="mt-2 text-xs leading-6 text-white/55">
                    Sistem mendeteksi irisan waktu sebelum reservasi
                    disetujui petugas.
                  </p>
                </div>

              </div>

              {/* Bottom Note */}
              <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-white/55">
                <CheckCircle2 className="size-4 shrink-0 text-green-400" />

                <span>
                  Berlaku untuk seluruh ruang, aula, laboratorium, dan
                  perlengkapan kampus.
                </span>
              </div>

            </div>
          </div>

          {/* Right Column */}
          <div className="grid grid-cols-1 gap-6 lg:col-span-5">

            {/* RLS Card */}
            <div className="group rounded-3xl border border-[#D8DFEA] bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22396F]/25 hover:shadow-lg hover:shadow-[#010736]/5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0D1C42] text-[#FCF1D0]">
                  <Lock className="size-5" />
                </div>

                <ArrowUpRight className="size-4 text-[#22396F]/40 transition-colors group-hover:text-[#010736]" />

              </div>

              <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#22396F]">
                Supabase Row Level Security
              </p>

              <h4 className="mt-2 font-heading text-xl font-bold text-[#010736]">
                Otorisasi di Level Basis Data
              </h4>

              <p className="mt-3 text-sm leading-6 text-[#52627D]">
                Akses data dibatasi langsung pada PostgreSQL. Pengunjung,
                Pengguna, Petugas, dan Admin memiliki hak akses sesuai
                perannya.
              </p>

              <div className="mt-7 flex flex-wrap gap-2 border-t border-[#D8DFEA] pt-4">
                <span className="rounded-full bg-[#F3F5F8] px-2.5 py-1 font-mono text-[10px] font-medium text-[#52627D]">
                  Pengunjung
                </span>

                <span className="rounded-full bg-[#F3F5F8] px-2.5 py-1 font-mono text-[10px] font-medium text-[#52627D]">
                  Pengguna
                </span>

                <span className="rounded-full bg-[#F3F5F8] px-2.5 py-1 font-mono text-[10px] font-medium text-[#52627D]">
                  Petugas
                </span>

                <span className="rounded-full bg-[#010736] px-2.5 py-1 font-mono text-[10px] font-medium text-white">
                  Admin
                </span>
              </div>

            </div>

            {/* Verification Card */}
            <div className="group rounded-3xl border border-[#D8DFEA] bg-[#F6F8FB] p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22396F]/25 hover:shadow-lg hover:shadow-[#010736]/5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FCF1D0] text-[#010736]">
                  <ShieldCheck className="size-5" />
                </div>

                <div className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-[#22396F]">
                  VERIFIED
                </div>

              </div>

              <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#22396F]">
                Akuntabilitas Pengguna
              </p>

              <h4 className="mt-2 font-heading text-xl font-bold text-[#010736]">
                Verifikasi Akun Sivitas oleh Admin
              </h4>

              <p className="mt-3 text-sm leading-6 text-[#52627D]">
                Mahasiswa dan dosen yang mendaftar secara mandiri perlu
                diverifikasi oleh Administrator sebelum dapat menggunakan
                layanan reservasi fasilitas.
              </p>

              <div className="mt-7 flex items-center gap-2 border-t border-[#D8DFEA] pt-4 text-xs font-medium text-[#010736]">
                <CheckCircle2 className="size-4 text-[#22396F]" />

                <span>
                  Akun Petugas diterbitkan secara eksklusif oleh Admin.
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  )
}