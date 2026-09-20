import Link from "next/link"
import { Clock, ShieldCheck, UserCheck, AlertCircle, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OperatingHours() {
  return (
    <section id="ketentuan" className="scroll-mt-16 py-16 lg:py-24 border-b border-border bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl border border-[#0c021c] bg-[#0c021c] text-white p-8 md:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Guidelines & Policy */}
            <div className="lg:col-span-7">
              <div className="font-mono text-xs font-semibold text-[#8d7da0] uppercase tracking-wider mb-3">
                KETENTUAN OPERASIONAL KAMPUS
              </div>

              <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Jam Layanan dan Kebijakan Akun Terverifikasi
              </h2>

              <p className="mt-4 text-sm text-[#cbc4cd] leading-relaxed">
                Pengelolaan sarana akademik diselenggarakan dengan prinsip akuntabilitas penuh. Seluruh permohonan reservasi diproses dalam parameter waktu yang telah disepakati.
              </p>

              <div className="mt-8 space-y-4 text-xs">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <Clock className="size-4 text-[#8d7da0] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Jam Kerja Fasilitas (07.00 - 20.00 WIB):</span>{" "}
                    <span className="text-[#cbc4cd]">
                      Peminjaman hanya dapat diajukan dalam rentang waktu ini. Permintaan di luar jam kerja tidak dapat diproses oleh sistem.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <UserCheck className="size-4 text-[#8d7da0] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Verifikasi Akun Pengguna oleh Admin:</span>{" "}
                    <span className="text-[#cbc4cd]">
                      Pengguna baru yang mendaftar mandiri perlu mendapatkan persetujuan Administrator kampus sebelum dapat mengajukan reservasi.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <ShieldCheck className="size-4 text-[#8d7da0] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Integritas Akun Petugas Sarpras:</span>{" "}
                    <span className="text-[#cbc4cd]">
                      Akun Petugas dibuat secara langsung oleh Administrator tanpa jalur registrasi mandiri, demi menjaga keabsahan otorisasi.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: High-contrast Action Box */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-7 backdrop-blur-xs flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[11px] font-bold text-white bg-[#5318eb] px-2.5 py-1 rounded inline-block mb-3">
                    PORTAL SIVITAS
                  </span>
                  <h3 className="font-heading text-xl font-bold text-white">
                    Masuk ke Sistem Fivora
                  </h3>
                  <p className="mt-2 text-xs text-[#cbc4cd] leading-relaxed">
                    Gunakan akun kampus Anda untuk melakukan reservasi sarana, memantau riwayat peminjaman, atau melaporkan kendala fasilitas di sekitar kampus.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <Link href="/login" className="block w-full">
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full bg-[#5318eb] text-white hover:bg-[#4312c4] font-semibold text-xs justify-center"
                    >
                      Masuk Akun
                    </Button>
                  </Link>
                  <Link href="/register" className="block w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold text-xs justify-center"
                    >
                      Daftar Pengguna Baru
                      <ArrowUpRight className="size-3.5 ml-1" />
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
