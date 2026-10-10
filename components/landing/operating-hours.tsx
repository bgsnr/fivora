import Link from 'next/link'
import { Clock, UserCheck, CalendarX, ArrowUpRight } from 'lucide-react'
import type { NavbarUser } from './navbar'

const guidelines = [
  { icon: Clock, title: 'Penggunaan Fasilitas: 07.00–20.00 WIB', description: 'Berlaku setiap hari, termasuk akhir pekan. Pilih waktu dalam kelipatan 30 menit dan pastikan penggunaan selesai pada hari yang sama.' },
  { icon: UserCheck, title: 'Gunakan Akun yang Sudah Aktif', description: 'Setelah mendaftar, tunggu persetujuan admin sebelum masuk. Pengajuan reservasi diperiksa oleh petugas.' },
  { icon: CalendarX, title: 'Ada Perubahan Rencana?', description: 'Batalkan reservasi paling lambat 3 jam sebelum waktu mulai. Untuk mengganti jadwal, batalkan pengajuan lama lalu buat pengajuan baru.' },
]

export function OperatingHours({ user = null }: { user?: NavbarUser | null }) {
  const isStaff = user?.role === 'petugas' || user?.role === 'admin'
  const destination = isStaff ? (user.role === 'petugas' ? '/petugas' : '/admin') : '/catalog'

  return (
    <section id="ketentuan" className="scroll-mt-20 bg-white py-16 lg:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#0D1C42] bg-[#010736] p-6 text-white sm:p-8 md:p-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="mb-3 text-xs font-medium tracking-wider text-[#FCF1D0]">Sebelum Mengajukan</p>
              <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">Jam Layanan dan Aturan Penggunaan</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">Sesuaikan jadwal kegiatanmu dengan jam penggunaan fasilitas. Berikut ketentuan yang perlu kamu tahu.</p>

              <div className="mt-8 space-y-6">
                {guidelines.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#FCF1D0] text-[#010736]">
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/75">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/15 bg-[#0D1C42] p-6 sm:p-8">
                <p className="mb-4 text-xs font-medium tracking-wider text-[#FCF1D0]">FIVORA</p>
                <h3 className="font-heading text-2xl font-semibold">{user ? (isStaff ? 'Lanjut ke Ruang Kerja' : 'Sudah Punya Rencana Kegiatan?') : 'Mulai dengan Akun Fivora'}</h3>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  {user ? (isStaff ? 'Buka halaman akunmu untuk melanjutkan pekerjaan.' : 'Pilih fasilitas dan ajukan jadwal yang kamu butuhkan.') : 'Masuk untuk mengajukan reservasi atau melapor. Belum punya akun? Daftar terlebih dahulu.'}
                </p>
                <div className="mt-6 space-y-3">
                  <Link href={user ? destination : '/login?redirect=%2Fcatalog'} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#FCF1D0] px-5 py-3 text-sm font-semibold text-[#010736] transition-colors hover:bg-white">
                    {user ? (isStaff ? 'Buka Ruang Kerja' : 'Buat Reservasi') : 'Masuk Akun'}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                  {!user && <Link href="/register" className="flex min-h-11 items-center justify-center rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">Daftar Akun</Link>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
