export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[#E7EBF1]" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-[#E7EBF1]"
            />
          ))}
        </div>

        <div className="h-64 animate-pulse rounded-2xl bg-[#E7EBF1]" />
      </div>
    </div>
  )
}
