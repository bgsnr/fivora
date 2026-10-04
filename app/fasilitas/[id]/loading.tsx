export default function Loading() {
  return (
    <div className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-4 w-40 animate-pulse rounded bg-[#E7EBF1]" />

        <div className="h-40 animate-pulse rounded-2xl bg-[#E7EBF1]" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-[#E7EBF1]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
