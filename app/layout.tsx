import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

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
        "font-sans"
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#5318eb]/15 selection:text-[#0c021c]">
        {children}
      </body>
    </html>
  );
}