import { CalendarSearch, Camera } from "lucide-react"

export function Workflow() {
  return (
    <section id="alur" className="scroll-mt-16 py-16 lg:py-24 border-b border-border bg-[#f9f9f9]">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="font-mono text-xs font-semibold text-[#5318eb] uppercase tracking-wider mb-2">
            PROSEDUR OPERASIONAL STANDAR
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0c021c]">
            Dua Alur Utama Layanan Fasilitas Kampus
          </h2>
          <p className="mt-3 text-sm text-[#4a454d] leading-relaxed">
            Penyelenggaraan peminjaman dan pemeliharaan fasilitas diproses secara terintegrasi antara pemohon, petugas sarana prasarana, dan administrator.
          </p>
        </div>

        {/* Structured Grid: Alur Reservasi & Alur Pelaporan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Flow A: Reservasi */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-7 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#0c021c] text-white">
                    <CalendarSearch className="size-4" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0c021c]">
                    Siklus Reservasi Fasilitas
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#5318eb] bg-[#5318eb]/10 px-2 py-0.5 rounded">
                  ALUR PEMINJAMAN
                </span>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#5318eb] bg-[#f3f3f3] px-2 py-1 rounded shrink-0">
                    TAHAP 01
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Pengecekan Ketersediaan dan Pemilihan Slot
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Pengguna masuk ke sistem, memilih fasilitas, dan menentukan durasi waktu kelipatan 30 menit dalam jam 07.00 sampai 20.00 WIB.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#0c021c] bg-[#f3f3f3] px-2 py-1 rounded shrink-0">
                    TAHAP 02
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Verifikasi Bentrok dan Peninjauan Petugas
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Sistem mengunci slot sementara dan memverifikasi jadwal. Petugas sarpras memeriksa tujuan kegiatan sebelum menerbitkan persetujuan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 border border-emerald-200">
                    TAHAP 03
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Konfirmasi Persetujuan dan Akses Sarana
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Status reservasi berubah menjadi disetujui. Pengguna menerima konfirmasi resmi dan dapat mengambil kunci atau mengakses peralatan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#e2e2e2] flex items-center justify-between text-[11px] text-[#4a454d]">
              <span>Tanggung jawab: Sivitas Akademika dan Petugas</span>
              <span className="font-mono text-[#0c021c] font-semibold">Slot 30 Menit</span>
            </div>
          </div>

          {/* Flow B: Pelaporan Kerusakan */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-7 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#e2e2e2] pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-md bg-[#5318eb] text-white">
                    <Camera className="size-4" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#0c021c]">
                    Siklus Pelaporan Kerusakan
                  </h3>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#0c021c] bg-[#f3f3f3] px-2 py-0.5 rounded">
                  ALUR PEMELIHARAAN
                </span>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#5318eb] bg-[#f3f3f3] px-2 py-1 rounded shrink-0">
                    TAHAP 01
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Pengunggahan Bukti Foto dan Deskripsi
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Pengguna yang menemukan kendala sarana (AC mati, proyektor redup, sound rusak) mengisi laporan dan mengunggah foto bukti ke Supabase Storage.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded shrink-0 border border-amber-200">
                    TAHAP 02
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Validasi Petugas dan Perubahan Status Pemeliharaan
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Petugas mengevaluasi laporan dan mengubah status sarana menjadi &#34;Perbaikan&#34; agar tidak dapat dipinjam selama penanganan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 border border-emerald-200">
                    TAHAP 03
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#0c021c]">
                      Penyelesaian Teknis dan Sarana Siap Kembali
                    </h4>
                    <p className="text-xs text-[#4a454d] mt-1 leading-relaxed">
                      Tim teknisi menuntaskan perbaikan, petugas memperbarui laporan, dan status fasilitas kembali otomatis menjadi &#34;Tersedia&#34;.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#e2e2e2] flex items-center justify-between text-[11px] text-[#4a454d]">
              <span>Tanggung jawab: Pelapor dan Tim Teknisi Kampus</span>
              <span className="font-mono text-[#5318eb] font-semibold">Bukti Foto Terlampir</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
