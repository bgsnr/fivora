import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F9FC] px-4 text-center">
      <p className="text-xs font-bold tracking-widest text-[#22396f] uppercase">
        404
      </p>

      <h1 className="mt-2 text-2xl font-bold text-[#010736]">
        Halaman Tidak Ditemukan
      </h1>

      <p className="mt-2 max-w-md text-sm text-[#52627D]">
        Alamat yang Anda tuju tidak tersedia atau
        sudah dipindahkan.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#010736] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0D1C42]"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
