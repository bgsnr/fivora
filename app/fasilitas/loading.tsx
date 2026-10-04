export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-[#E7EBF1]" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-[#E7EBF1]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
