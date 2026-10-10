import Link from "next/link"

import { Building2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#22396F]/15 bg-white text-[#010736]">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="flex flex-col items-start justify-between gap-8 border-b border-[#22396F]/10 pb-10 md:flex-row">

          {/* Brand Info */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2.5">

              <div className="flex size-8 items-center justify-center rounded-lg bg-[#010736] text-white">
                <Building2 className="size-4" />
              </div>

              <span className="font-heading text-lg font-bold tracking-tight text-[#010736]">
                FIVORA
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#22396F]">
              Sistem Informasi Terpadu Reservasi dan Pelaporan Fasilitas
              Kampus. Mengelola peminjaman ruang kelas, laboratorium, aula,
              sarana olahraga, serta penanganan kerusakan fasilitas secara
              terpusat dan transparan.
            </p>

            <div className="font-mono text-[11px] text-[#22396F]/70">
              Mata Kuliah Pengembangan Platform Khusus (PPK)
            </div>
          </div>

          {/* Direct Navigation Links */}
          <div className="flex flex-wrap gap-12 text-xs">

            {/* Menu Utama */}
            <div>
              <h4 className="mb-3 font-mono font-bold uppercase tracking-wider text-[#010736]">
                Menu Utama
              </h4>

              <ul className="space-y-2 text-[#22396F]">
                <li>
                  <Link
                    href="/#katalog"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Katalog Fasilitas
                  </Link>
                </li>

                <li>
                  <Link
                    href="/#alur"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Alur Layanan
                  </Link>
                </li>

                <li>
                  <Link
                    href="/#ketentuan"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Jam Layanan & Aturan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Akses Sivitas */}
            <div>
              <h4 className="mb-3 font-mono font-bold uppercase tracking-wider text-[#010736]">
                Akses Sivitas
              </h4>

              <ul className="space-y-2 text-[#22396F]">
                <li>
                  <Link
                    href="/login"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Masuk Akun
                  </Link>
                </li>

                <li>
                  <Link
                    href="/register"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Pendaftaran Pengguna
                  </Link>
                </li>

                <li>
                  <Link
                    href="/laporan/buat"
                    className="transition-colors hover:text-[#010736]"
                  >
                    Buat Laporan Kerusakan
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-[11px] text-[#22396F] sm:flex-row">

          <p>
            © {new Date().getFullYear()} FIVORA. Hak cipta dilindungi.
          </p>

          <div className="flex items-center gap-4 font-mono">

            <span>
              Jam Layanan: 07.00 - 20.00 WIB
            </span>

            <span className="text-[#22396F]/40">
              •
            </span>

            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Sistem Aktif
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}