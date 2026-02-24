import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { WishListSearch } from '@/components/wish-list-search'
import { WishListItem } from '@/components/wish-list-item'

export default async function WishListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: wishListItems }, { data: collections }, { data: followsData }] = await Promise.all([
    supabase
      .from('wish_list_items')
      .select('id, mbid, title, artist, cover_art_url, release_date, track_count')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false }),
    supabase
      .from('collections')
      .select('id, name')
      .order('created_at', { ascending: true }),
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id),
  ])

  const safeCollections = collections || []
  const followedIds = (followsData ?? []).map(f => f.following_id)

  // Fetch wish list items for followed users (only if following anyone)
  let friendItems: {
    id: string
    title: string
    artist: string
    cover_art_url: string | null
    release_date: string | null
    user_id: string
    profiles: { id: string; display_name: string | null } | null
  }[] = []

  if (followedIds.length > 0) {
    const { data } = await supabase
      .from('wish_list_items')
      .select('id, title, artist, cover_art_url, release_date, user_id, profiles(id, display_name)')
      .in('user_id', followedIds)
      .order('added_at', { ascending: false })
    friendItems = (data ?? []).map(item => ({
      ...item,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] ?? null : item.profiles ?? null,
    }))
  }

  // Group friend items by user
  const friendsByUser = friendItems.reduce<
    Map<string, { profile: { id: string; display_name: string | null }; items: typeof friendItems }>
  >((map, item) => {
    if (!item.profiles) return map
    const existing = map.get(item.user_id)
    if (existing) {
      existing.items.push(item)
    } else {
      map.set(item.user_id, { profile: item.profiles, items: [item] })
    }
    return map
  }, new Map())

  const friendGroups = Array.from(friendsByUser.values())

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-serif text-3xl font-bold text-walnut">My Wish List</h1>
          <svg className="w-6 h-6 text-burnt-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>

        <WishListSearch />

        {!wishListItems || wishListItems.length === 0 ? (
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-12 text-center">
            <svg className="w-10 h-10 text-walnut/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

        {/* Friends' Wish Lists */}
        {friendGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-xl font-semibold text-walnut mb-5">
              Friends&apos; Wish Lists
            </h2>
            <div className="space-y-6">
              {friendGroups.map(({ profile, items }) => (
                <div key={profile.id}>
                  <Link
                    href={`/profile/${profile.id}`}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-tan flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-walnut/60">
                        {(profile.display_name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-walnut group-hover:text-burnt-orange transition-colors">
                      {profile.display_name || 'Unknown User'}
                    </span>
                    <svg className="w-3.5 h-3.5 text-walnut/30 group-hover:text-burnt-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const year = item.release_date ? item.release_date.split('-')[0] : null
                      return (
                        <div key={item.id} className="bg-warm-white rounded-xl border border-walnut/10 p-3 flex items-center gap-3">
                          {item.cover_art_url ? (
                            <Image
                              src={item.cover_art_url}
                              alt={item.title}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded object-cover flex-shrink-0"
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-tan flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-walnut truncate">{item.title}</p>
                            <p className="text-xs text-walnut/60 truncate">
                              {item.artist}{year ? ` · ${year}` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
