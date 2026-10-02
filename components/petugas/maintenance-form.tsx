import Link from 'next/link'

interface MaintenanceFormProps {
  facilityId: number
  currentStatus: string
  upcomingActiveCount: number
}

const statusLabels: Record<string, string> = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  dalam_perbaikan: 'Dalam perbaikan',
}

export function MaintenanceForm({
  currentStatus,
}: MaintenanceFormProps) {
  return (
    <section className="rounded-2xl border border-[#D8DFEA] bg-white p-5">
      <h3 className="text-base font-bold text-[#010736]">
        Perbaikan Fasilitas
      </h3>

      <p className="mt-2 text-sm text-[#52627D]">
        Status layanan:{' '}
        {statusLabels[currentStatus] ?? currentStatus}
      </p>

      <p className="mt-2 text-sm text-[#52627D]">
        Buka laporan terkait fasilitas ini untuk memulai atau
        menyelesaikan kegiatan perbaikan.
      </p>

      <Link
        href="/petugas/laporan"
        className="mt-4 inline-block rounded-xl bg-[#010736] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D1C42]"
      >
        Buka Antrean Laporan
      </Link>
    </section>
  )
}