export default function FeedLoading() {
  return (
    <main className="min-h-screen p-8 pb-24 animate-pulse">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="h-9 w-44 bg-walnut/10 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-walnut/10 rounded mb-2" />
          <div className="h-4 w-36 bg-walnut/10 rounded" />
        </div>

        {/* Feed cards */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-warm-white rounded-xl border border-walnut/10 p-4 flex items-start gap-4">
              <div className="w-20 h-20 rounded bg-walnut/10 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-28 bg-walnut/10 rounded" />
                <div className="h-4 w-44 bg-walnut/10 rounded" />
                <div className="h-3 w-32 bg-walnut/10 rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
