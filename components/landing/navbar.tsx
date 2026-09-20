import Link from "next/link"
import { Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#0c021c] text-white transition-colors group-hover:bg-[#5318eb]">
            <Building2 className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-[#0c021c]">
              FIVORA
            </span>
            <span className="font-mono text-[10px] -mt-1 font-medium text-[#4a454d] tracking-wider uppercase">
              Fasilitas Kampus
            </span>
          </div>
        </Link>

        {/* Navigation - Real destinations only (R-24) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#4a454d]">
          <Link href="#katalog" className="transition-colors hover:text-[#0c021c]">
            Katalog Fasilitas
          </Link>
          <Link href="#ketentuan" className="transition-colors hover:text-[#0c021c]">
            Jam Operasional & Aturan
          </Link>
          <Link href="#alur" className="transition-colors hover:text-[#0c021c]">
            Alur Layanan
          </Link>
        </nav>

        {/* Action Buttons with single verb (DESIGN.md) */}
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium text-xs text-[#0c021c]">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="accent" size="sm" className="font-semibold text-xs bg-[#5318eb] text-white hover:bg-[#4312c4]">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
