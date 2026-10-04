import {
  CalendarSearch,
  Camera,
} from "lucide-react"

export function Workflow() {
  return (
    <section
      id="alur"
      className="scroll-mt-16 border-b border-[#D8DFEA] bg-white py-16 lg:py-24"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#22396F]">
            PROSEDUR OPERASIONAL STANDAR
          </div>

          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#010736] sm:text-4xl">
            Dua Alur Utama Layanan Fasilitas Kampus
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#52627D]">
            Penyelenggaraan peminjaman dan pemeliharaan fasilitas diproses
            secara terintegrasi antara pemohon, petugas sarana prasarana,
            dan administrator.
          </p>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Flow A: Reservasi */}
          <div className="group flex flex-col justify-between rounded-3xl border border-[#D8DFEA] bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22396F]/30 hover:shadow-lg hover:shadow-[#010736]/5 md:p-8">
            <div>
              {/* Header */}
              <div className="mb-6 flex items-center justify-between border-b border-[#D8DFEA] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#010736] text-white shadow-sm">
                    <CalendarSearch className="size-4" />
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#010736]">
                    Siklus Reservasi Fasilitas
                  </h3>
                </div>

                <span className="rounded-full border border-[#22396F]/10 bg-[#FCF1D0] px-3 py-1 font-mono text-[10px] font-semibold text-[#010736]">
                  ALUR PEMINJAMAN
                </span>
              </div>

              <div className="space-y-5">
                {/* Tahap 01 */}
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-full bg-[#FCF1D0] px-3 py-1 font-mono text-[10px] font-bold text-[#010736]">
                    TAHAP 01
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Pengecekan Ketersediaan dan Pemilihan Slot
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Pengguna masuk ke sistem, memilih fasilitas, dan
                      menentukan durasi waktu kelipatan 30 menit dalam jam
                      07.00 sampai 20.00 WIB.
                    </p>
                  </div>
                </div>

                {/* Tahap 02 */}
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-full bg-[#0D1C42] px-3 py-1 font-mono text-[10px] font-bold text-white">
                    TAHAP 02
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Verifikasi Bentrok dan Peninjauan Petugas
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Sistem mengunci slot sementara dan memverifikasi
                      jadwal. Petugas sarpras memeriksa tujuan kegiatan
                      sebelum menerbitkan persetujuan.
                    </p>
                  </div>
                </div>

                {/* Tahap 03 */}
                <div className="flex items-start gap-4">
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 font-mono text-[10px] font-bold text-green-700">
                    TAHAP 03
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Konfirmasi Persetujuan dan Akses Sarana
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Status reservasi berubah menjadi disetujui. Pengguna
                      menerima konfirmasi resmi dan dapat mengambil kunci
                      atau mengakses peralatan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between border-t border-[#D8DFEA] pt-4 text-[11px] text-[#52627D]">
              <span>
                Tanggung jawab: Sivitas Akademika dan Petugas
              </span>

              <span className="rounded-full bg-[#FCF1D0] px-2.5 py-1 font-mono font-semibold text-[#010736]">
                Slot 30 Menit
              </span>
            </div>
          </div>

          {/* Flow B: Pelaporan Kerusakan */}
          <div className="group flex flex-col justify-between rounded-3xl border border-[#D8DFEA] bg-[#F8FAFC] p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#22396F]/30 hover:shadow-lg hover:shadow-[#010736]/5 md:p-8">
            <div>
              {/* Header */}
              <div className="mb-6 flex items-center justify-between border-b border-[#D8DFEA] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#0D1C42] text-white shadow-sm">
                    <Camera className="size-4" />
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#010736]">
                    Siklus Pelaporan Kerusakan
                  </h3>
                </div>

                <span className="rounded-full border border-[#22396F]/10 bg-[#FCF1D0] px-3 py-1 font-mono text-[10px] font-semibold text-[#010736]">
                  ALUR PEMELIHARAAN
                </span>
              </div>

              <div className="space-y-5">
                {/* Tahap 01 */}
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-full bg-[#FCF1D0] px-3 py-1 font-mono text-[10px] font-bold text-[#010736]">
                    TAHAP 01
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Pengunggahan Bukti Foto dan Deskripsi
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Pengguna yang menemukan kendala sarana (AC mati,
                      proyektor redup, sound rusak) mengisi laporan dan
                      mengunggah foto bukti ke Supabase Storage.
                    </p>
                  </div>
                </div>

                {/* Tahap 02 */}
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 font-mono text-[10px] font-bold text-yellow-800">
                    TAHAP 02
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Validasi Petugas dan Perubahan Status Pemeliharaan
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Petugas mengevaluasi laporan dan mengubah status
                      sarana menjadi "Perbaikan" agar tidak dapat dipinjam
                      selama penanganan.
                    </p>
                  </div>
                </div>

                {/* Tahap 03 */}
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 font-mono text-[10px] font-bold text-green-700">
                    TAHAP 03
                  </span>

                  <div>
                    <h4 className="text-xs font-bold text-[#010736]">
                      Penyelesaian Teknis dan Sarana Siap Kembali
                    </h4>

                    <p className="mt-1 text-xs leading-relaxed text-[#52627D]">
                      Tim teknisi menuntaskan perbaikan, petugas
                      memperbarui laporan, dan status fasilitas kembali
                      otomatis menjadi "Tersedia".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between border-t border-[#D8DFEA] pt-4 text-[11px] text-[#52627D]">
              <span>
                Tanggung jawab: Pelapor dan Tim Teknisi Kampus
              </span>

              <span className="rounded-full bg-[#FCF1D0] px-2.5 py-1 font-mono font-semibold text-[#010736]">
                Bukti Foto Terlampir
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}