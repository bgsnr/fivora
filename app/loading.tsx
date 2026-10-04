export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D8DFEA] border-t-[#010736]" />

        <p className="text-sm text-[#52627D]">
          Memuat halaman...
        </p>
      </div>
    </div>
  )
}
