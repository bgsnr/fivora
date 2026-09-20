import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, Space_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "FIVORA - Sistem Reservasi & Pelaporan Fasilitas Kampus",
  description:
    "Portal terpadu ketersediaan fasilitas, reservasi anti-bentrok jadwal, dan pelaporan sarana kampus.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full scroll-smooth",
        "antialiased",
        outfit.variable,
        plusJakartaSans.variable,
        spaceMono.variable,
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
        {children}
      </body>
    </html>
  );
}
