export default function CollectionLoading() {
  return (
    <main className="min-h-screen p-8 pb-24 animate-pulse">
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Collection name + stat tiles */}
        <section>
          <div className="h-8 w-48 bg-walnut/10 rounded-lg mb-4" />
          <div className="flex gap-4">
            <div className="flex-1 bg-warm-white rounded-xl border border-walnut/10 p-4 text-center">
              <div className="h-8 w-12 bg-walnut/10 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-walnut/10 rounded mx-auto" />
            </div>
            <div className="flex-1 bg-warm-white rounded-xl border border-walnut/10 p-4 text-center">
              <div className="h-8 w-12 bg-walnut/10 rounded mx-auto mb-1" />
              <div className="h-3 w-24 bg-walnut/10 rounded mx-auto" />
            </div>
          </div>
        </section>

        {/* Mood grid */}
        <section>
          <div className="h-6 w-56 bg-walnut/10 rounded mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-warm-white rounded-xl border border-walnut/10 p-3 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-walnut/10" />
                <div className="h-3 w-16 bg-walnut/10 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Collection preview */}
        <section>
          <div className="h-6 w-28 bg-walnut/10 rounded mb-3" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-walnut/10" />
            ))}
          </div>
        </section>

        {/* Activity feed */}
        <section>
          <div className="h-6 w-20 bg-walnut/10 rounded mb-3" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
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
        </section>

      </div>
    </main>
  )
}
