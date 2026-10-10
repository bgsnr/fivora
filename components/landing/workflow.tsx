import { CalendarSearch, Camera } from 'lucide-react'

const flows = [
  {
    title: 'Reservasi Fasilitas',
    icon: CalendarSearch,
    steps: [
      { title: 'Pilih Fasilitas dan Jadwal', description: 'Cari fasilitas yang sesuai, lalu pilih tanggal, jam penggunaan, dan isi tujuan kegiatanmu.' },
      { title: 'Kirim Pengajuan', description: 'Petugas akan memeriksa pengajuanmu. Selama masih Menunggu, jadwal yang sama masih bisa diajukan oleh pengguna lain.' },
      { title: 'Cek Hasil Pengajuan', description: 'Lihat keputusan petugas di riwayat reservasi. Jadwal baru terisi setelah pengajuan disetujui. Jika ditolak, alasan penolakannya juga tercantum di sana.' },
    ],
  },
  {
    title: 'Lapor Kerusakan',
    icon: Camera,
    steps: [
      { title: 'Ceritakan Kondisi Fasilitas', description: 'Pilih fasilitas, jelaskan kerusakan yang ditemukan, dan lampirkan satu foto. Kamu bisa melapor meskipun belum pernah meminjam fasilitas itu.' },
      { title: 'Petugas Memeriksa Laporan', description: 'Petugas menentukan tindak lanjutnya. Jika fasilitas perlu dihentikan penggunaannya, petugas akan memulai perbaikan.' },
      { title: 'Ikuti Perkembangan Laporan', description: 'Buka riwayat laporan untuk melihat status, catatan petugas, dan hasil penanganannya.' },
    ],
  },
]

export function Workflow() {
  return (
    <section id="alur" className="scroll-mt-20 border-b border-[#D8DFEA] bg-white py-16 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-medium tracking-wider text-[#22396F]">Alur Layanan</p>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#010736] sm:text-4xl">Cara Reservasi dan Melapor</h2>
          <p className="mt-3 text-base leading-relaxed text-[#52627D]">Dari pengajuan sampai hasil penanganan, semuanya bisa kamu ikuti lewat akunmu.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {flows.map((flow, index) => (
            <article key={flow.title} className={`rounded-3xl border border-[#D8DFEA] p-6 sm:p-8 ${index === 0 ? 'bg-white' : 'bg-[#FCF1D0]/40'}`}>
              <div className="mb-7 flex items-center gap-3 border-b border-[#22396F]/15 pb-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#010736] text-[#FCF1D0]">
                  <flow.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-2xl font-semibold text-[#010736]">{flow.title}</h3>
              </div>

              <ol className="space-y-7">
                {flow.steps.map((step, stepIndex) => (
                  <li key={step.title} className="flex items-start gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#22396F]/20 text-xs font-semibold text-[#22396F]" aria-hidden="true">
                      {String(stepIndex + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-base font-semibold text-[#010736]">{step.title}</h4>
                      <p className="mt-2 text-sm leading-7 text-[#52627D]">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
