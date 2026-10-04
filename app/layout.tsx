import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastProvider } from "@/components/ui/toast";

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
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#FCF1D0] selection:text-[#010736]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}