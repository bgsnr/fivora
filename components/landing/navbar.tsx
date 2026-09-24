import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo Fivora */}
        <Link href="/" className="flex items-center group">
          <img
            src="/fivora-logo1.png"
            alt="Fivora - Facility & Venue Reservation"
            className="w-[155px] h-[160px] object-contain"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#4a454d]">
          <Link
            href="#katalog"
            className="transition-colors hover:text-[#0c021c]"
          >
            Katalog Fasilitas
          </Link>

          <Link
            href="#ketentuan"
            className="transition-colors hover:text-[#0c021c]"
          >
            Jam Operasional & Aturan
          </Link>

          <Link
            href="#alur"
            className="transition-colors hover:text-[#0c021c]"
          >
            Alur Layanan
          </Link>
        </nav>

        {/* Tombol */}
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="font-medium text-xs text-[#0c021c]"
            >
              Masuk
            </Button>
          </Link>

          <Link href="/register">
            <Button
              variant="accent"
              size="sm"
              className="font-semibold text-xs bg-[#5318eb] text-white hover:bg-[#4312c4]"
            >
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}