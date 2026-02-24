import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WishListSearch } from '@/components/wish-list-search'
import { WishListItem } from '@/components/wish-list-item'

export default async function WishListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: wishListItems }, { data: collections }] = await Promise.all([
    supabase
      .from('wish_list_items')
      .select('id, mbid, title, artist, cover_art_url, release_date, track_count')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name')
      .order('created_at', { ascending: true }),
  ])

  const safeCollections = collections || []

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/collection"
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-serif text-3xl font-bold text-walnut">My Wish List</h1>
          <svg className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>

        <WishListSearch />

        {!wishListItems || wishListItems.length === 0 ? (
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-12 text-center">
            <svg className="w-10 h-10 text-walnut/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-walnut/60 mb-2">Your wish list is empty</p>
            <p className="text-sm text-walnut/40">Search for albums you want to acquire</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishListItems.map((item) => (
              <WishListItem
                key={item.id}
                item={item}
                collections={safeCollections}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
