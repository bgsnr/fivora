import { Clock, CheckCircle2, ShieldCheck, Lock } from "lucide-react"

export function Features() {
  return (
    <section className="py-16 lg:py-24 border-b border-border bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="font-mono text-xs font-semibold text-[#5318eb] uppercase tracking-wider mb-2">
            STANDAR DAN INTEGRITAS SISTEM
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c021c]">
            Arsitektur Pengelolaan Fasilitas Kampus
          </h2>
          <p className="mt-3 text-sm text-[#4a454d] leading-relaxed">
            Fivora menerapkan aturan bisnis ketat di sisi server dan database Postgres. Setiap transaksi peminjaman dan pelaporan sarana kampus diproses secara transparan serta akuntabel.
          </p>
        </div>

        {/* Asymmetric Content Composition (RHYTHM 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Featured Large Block (7 cols): Slot 30 Menit & Pencegahan Bentrok */}
          <div className="lg:col-span-7 rounded-2xl border border-[#e2e2e2] bg-[#f9f9f9] p-7 md:p-9 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#0c021c] text-white">
                  <Clock className="size-4" />
                </div>
                <span className="font-mono text-xs font-bold text-[#0c021c] uppercase tracking-wider">
                  Logika Validasi Server
                </span>
              </div>

              <h3 className="font-heading text-2xl font-bold text-[#0c021c]">
                Slot Waktu Baku 30 Menit dan Pencegahan Bentrok Otomatis
              </h3>
              
              <p className="mt-3 text-sm text-[#4a454d] leading-relaxed">
                Seluruh pengajuan reservasi diverifikasi langsung di server (Server Actions). Waktu mulai dan selesai wajib berupa kelipatan 30 menit dalam rentang jam operasional resmi (07.00 sampai 20.00 WIB). Petugas sarpras tidak dapat menyetujui reservasi yang memiliki jadwal bertabrakan pada fasilitas yang sama.
              </p>

              {/* Visual Breakdown Matrix */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-4">
                  <div className="font-mono text-xs font-bold text-[#5318eb] mb-1">
                    OPERASIONAL 07.00 - 20.00 WIB
                  </div>
                  <p className="text-xs text-[#4a454d]">
                    Peminjaman di luar jam layanan kampus otomatis ditolak sistem untuk menjamin keamanan sarana.
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2e2e2] bg-white p-4">
                  <div className="font-mono text-xs font-bold text-[#5318eb] mb-1">
                    VALIDASI ANTI-OVERLAP
                  </div>
                  <p className="text-xs text-[#4a454d]">
                    Query database mendeteksi irisan waktu secara presisi sebelum status disetujui petugas.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2e2e2] flex items-center gap-2 text-xs font-medium text-[#4a454d]">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Diterapkan pada seluruh tipe ruang, aula, dan perlengkapan.</span>
            </div>
          </div>

          {/* Right Column (5 cols): RLS & Otorisasi Berjenjang */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Card 1: Row Level Security */}
            <div className="rounded-2xl border border-[#e2e2e2] bg-[#f9f9f9] p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#5318eb] text-white">
                    <Lock className="size-3.5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#0c021c]">
                    SUPABASE ROW LEVEL SECURITY (RLS)
                  </span>
                </div>
                <h4 className="font-heading text-lg font-bold text-[#0c021c]">
                  Otorisasi di Level Basis Data
                </h4>
                <p className="mt-2 text-xs text-[#4a454d] leading-relaxed">
                  Akses data dibatasi langsung di tingkat Postgres. Pengunjung hanya dapat membaca ketersediaan umum, Pengguna mengelola reservasinya sendiri, sedangkan Petugas dan Admin memproses verifikasi.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e2e2e2] text-[11px] font-mono text-[#5318eb]">
                RLS Policies: Pengunjung • Pengguna • Petugas • Admin
              </div>
            </div>

            {/* Card 2: Verifikasi Sivitas Mandiri */}
            <div className="rounded-2xl border border-[#e2e2e2] bg-[#f9f9f9] p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#0c021c] text-white">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#0c021c]">
                    AKUNTABILITAS PENGGUNA
                  </span>
                </div>
                <h4 className="font-heading text-lg font-bold text-[#0c021c]">
                  Verifikasi Akun Sivitas oleh Admin
                </h4>
                <p className="mt-2 text-xs text-[#4a454d] leading-relaxed">
                  Mahasiswa dan dosen yang mendaftar secara mandiri wajib diverifikasi oleh Administrator sebelum dapat melakukan reservasi fasilitas, mencegah penyalahgunaan aset kampus.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e2e2e2] text-[11px] font-mono text-[#4a454d]">
                Akun Petugas diterbitkan secara eksklusif oleh Admin
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
