export default function WishlistLoading() {
  return (
    <main className="min-h-screen p-8 pb-24 animate-pulse">
      <div className="max-w-2xl mx-auto">

        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-36 bg-walnut/10 rounded-lg" />
          <div className="w-6 h-6 rounded bg-walnut/10" />
        </div>

        {/* Search bar */}
        <div className="h-12 w-full bg-walnut/10 rounded-xl mb-6" />

        {/* Items */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-warm-white rounded-xl border border-walnut/10 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-walnut/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-walnut/10 rounded" />
                <div className="h-3 w-28 bg-walnut/10 rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
