import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-5xl font-bold text-walnut mb-4">
          Side A
        </h1>
        <p className="text-lg text-walnut/70 mb-8">
          Track your vinyl collection. Log your plays. Share with friends.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 border border-walnut/20 text-walnut rounded-lg font-medium hover:bg-tan/50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
