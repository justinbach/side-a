export default function ProfileLoading() {
  return (
    <main className="min-h-screen p-8 pb-24 animate-pulse">
      <div className="max-w-4xl mx-auto">

        {/* Profile card */}
        <div className="bg-warm-white rounded-xl border border-walnut/10 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-2">
              <div className="h-9 w-48 bg-walnut/10 rounded-lg" />
              <div className="h-4 w-40 bg-walnut/10 rounded" />
              <div className="h-3 w-32 bg-walnut/10 rounded" />
            </div>
            <div className="w-24 h-10 bg-walnut/10 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-tan/20 rounded-lg p-4 text-center">
              <div className="h-9 w-12 bg-walnut/10 rounded mx-auto mb-1" />
              <div className="h-3 w-20 bg-walnut/10 rounded mx-auto" />
            </div>
            <div className="bg-tan/20 rounded-lg p-4 text-center">
              <div className="h-9 w-12 bg-walnut/10 rounded mx-auto mb-1" />
              <div className="h-3 w-16 bg-walnut/10 rounded mx-auto" />
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="h-7 w-36 bg-walnut/10 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-warm-white rounded-xl border border-walnut/10 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded bg-walnut/10 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-walnut/10 rounded" />
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
