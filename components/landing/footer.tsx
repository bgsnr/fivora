import Link from "next/link"
import { Building2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-white text-[#0c021c]">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 pb-10 border-b border-[#e2e2e2]">
          {/* Brand Info */}
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#0c021c] text-white">
                <Building2 className="size-4" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-[#0c021c]">
                FIVORA
              </span>
            </div>
            <p className="text-xs text-[#4a454d] leading-relaxed">
              Sistem Informasi Terpadu Reservasi dan Pelaporan Fasilitas Kampus. Mengelola peminjaman ruang kelas, laboratorium, aula, sarana olahraga, serta penanganan kerusakan fasilitas secara terpusat dan transparan.
            </p>
            <div className="font-mono text-[11px] text-[#7b757d]">
              Mata Kuliah Pengembangan Perangkat Lunak Berorientasi Komponen (PPK)
            </div>
          </div>

          {/* Direct Navigation Links */}
          <div className="flex flex-wrap gap-12 text-xs">
            <div>
              <h4 className="font-mono font-bold text-[#0c021c] uppercase tracking-wider mb-3">
                Menu Utama
              </h4>
              <ul className="space-y-2 text-[#4a454d]">
                <li>
                  <Link href="#katalog" className="hover:text-[#0c021c] transition-colors">
                    Katalog Fasilitas
                  </Link>
                </li>
                <li>
                  <Link href="#ketentuan" className="hover:text-[#0c021c] transition-colors">
                    Jam Operasional
                  </Link>
                </li>
                <li>
                  <Link href="#alur" className="hover:text-[#0c021c] transition-colors">
                    Alur Layanan
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-[#0c021c] uppercase tracking-wider mb-3">
                Akses Sivitas
              </h4>
              <ul className="space-y-2 text-[#4a454d]">
                <li>
                  <Link href="/login" className="hover:text-[#0c021c] transition-colors">
                    Masuk Akun
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#0c021c] transition-colors">
                    Pendaftaran Pengguna
                  </Link>
                </li>
                <li>
                  <Link href="/reports" className="hover:text-[#0c021c] transition-colors">
                    Pusat Lapor Kerusakan
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Operational Status and Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#4a454d]">
          <p>© {new Date().getFullYear()} FIVORA. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4 font-mono">
            <span>Jam Layanan: 07.00 - 20.00 WIB</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              Sistem Aktif
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
