import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <h1 className="font-serif text-3xl font-bold text-walnut">Side A</h1>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-walnut/60 hover:text-walnut transition-colors"
          >
            Sign Out
          </button>
        </form>
      </header>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-2xl text-walnut">My Collection</h2>
          <button className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors">
            Add Record
          </button>
        </div>

        <div className="bg-warm-white rounded-lg border border-walnut/10 p-12 text-center">
          <p className="text-walnut/60 mb-4">Your collection is empty</p>
          <p className="text-sm text-walnut/40">
            Add your first vinyl record to get started
          </p>
        </div>
      </div>
    </main>
  )
}
