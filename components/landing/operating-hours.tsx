import Link from "next/link"

import {
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export function OperatingHours() {
  return (
    <section
      id="ketentuan"
      className="scroll-mt-16 border-b border-[#D8DFEA] bg-white py-16 lg:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#0D1C42] bg-[#010736] p-8 text-white shadow-xl shadow-[#010736]/10 md:p-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Guidelines & Policy */}
            <div className="lg:col-span-7">
              <div className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#FCF1D0]">
                KETENTUAN OPERASIONAL KAMPUS
              </div>

              <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                Jam Layanan dan Kebijakan Akun Terverifikasi
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
                Pengelolaan sarana akademik diselenggarakan dengan prinsip
                akuntabilitas penuh. Seluruh permohonan reservasi diproses
                dalam parameter waktu yang telah disepakati.
              </p>

              <div className="mt-8 space-y-4 text-xs">
                {/* Jam Kerja */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0D1C42]/80 p-4 transition-colors hover:bg-[#0D1C42]">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#FCF1D0] text-[#010736]">
                    <Clock className="size-4" />
                  </div>

                  <div>
                    <span className="font-bold text-white">
                      Jam Kerja Fasilitas (07.00 - 20.00 WIB):
                    </span>{" "}
                    <span className="text-white/65">
                      Peminjaman hanya dapat diajukan dalam rentang waktu
                      ini. Permintaan di luar jam kerja tidak dapat diproses
                      oleh sistem.
                    </span>
                  </div>
                </div>

                {/* Verifikasi Akun */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0D1C42]/80 p-4 transition-colors hover:bg-[#0D1C42]">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#FCF1D0] text-[#010736]">
                    <UserCheck className="size-4" />
                  </div>

                  <div>
                    <span className="font-bold text-white">
                      Verifikasi Akun Pengguna oleh Admin:
                    </span>{" "}
                    <span className="text-white/65">
                      Pengguna baru yang mendaftar mandiri perlu mendapatkan
                      persetujuan Administrator kampus sebelum dapat
                      mengajukan reservasi.
                    </span>
                  </div>
                </div>

                {/* Akun Petugas */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0D1C42]/80 p-4 transition-colors hover:bg-[#0D1C42]">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#FCF1D0] text-[#010736]">
                    <ShieldCheck className="size-4" />
                  </div>

                  <div>
                    <span className="font-bold text-white">
                      Integritas Akun Petugas Sarpras:
                    </span>{" "}
                    <span className="text-white/65">
                      Akun Petugas dibuat secara langsung oleh Administrator
                      tanpa jalur registrasi mandiri, demi menjaga keabsahan
                      otorisasi.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Action Box */}
            <div className="lg:col-span-5">
              <div className="flex flex-col justify-between rounded-3xl border border-[#22396F]/60 bg-[#0D1C42] p-7 shadow-lg shadow-black/10">
                <div>
                  <span className="mb-3 inline-block rounded-full bg-[#FCF1D0] px-3 py-1 font-mono text-[11px] font-bold text-[#010736]">
                    PORTAL SIVITAS
                  </span>

                  <h3 className="font-heading text-xl font-bold text-white">
                    Masuk ke Sistem Fivora
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-white/65">
                    Gunakan akun kampus Anda untuk melakukan reservasi
                    sarana, memantau riwayat peminjaman, atau melaporkan
                    kendala fasilitas di sekitar kampus.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {/* Masuk */}
                  <Link href="/login" className="block w-full">
                    <Button
                      variant="accent"
                      size="lg"
                      className="h-10 w-full justify-center rounded-full bg-[#FCF1D0] text-xs font-semibold text-[#010736] shadow-sm transition-all hover:bg-white"
                    >
                      Masuk Akun
                    </Button>
                  </Link>

                  {/* Daftar */}
                  <Link href="/register" className="block w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-10 w-full justify-center rounded-full border-white/25 bg-white/5 text-xs font-semibold text-white transition-all hover:border-[#FCF1D0]/40 hover:bg-[#010736] hover:text-[#FCF1D0]"
                    >
                      Daftar Pengguna Baru
                      <ArrowUpRight className="ml-1 size-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}