import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeedList } from '@/components/feed-list'
import { NowPlayingBar } from '@/components/now-playing-bar'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { FollowingButton } from '@/components/following-button'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Three parallel queries — feed + live plays + following list
  // RLS handles visibility: follows + shared collections
  const [{ data: feedPlays }, { data: livePlays }, { data: followingData }] = await Promise.all([
    supabase
      .from('plays')
      .select(`
        id,
        played_at,
        mood,
        user_id,
        profiles(id, display_name),
        records(id, title, artist, cover_image_url, collection_id),
        play_reactions(id, user_id, emoji)
      `)
      .neq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(50),

    supabase
      .from('plays')
      .select(`
        id,
        played_at,
        mood,
        user_id,
        profiles(id, display_name),
        records(id, title, artist, cover_image_url, collection_id)
      `)
      .neq('user_id', user.id)
      .gte('played_at', thirtyMinutesAgo)
      .order('played_at', { ascending: false }),

    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, display_name)')
      .eq('follower_id', user.id),
  ])

  const following = (followingData ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return { id: p?.id ?? row.following_id, display_name: p?.display_name ?? null }
  })

  return (
    <main className="min-h-screen pb-24">
      <PullToRefresh>
      <div className="p-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-1">
            <h1 className="font-serif text-3xl font-bold text-walnut">Activity Feed</h1>
          </div>
          <p className="text-walnut/60 mb-2">Recent plays from people you follow</p>
          <div className="flex items-center gap-2 text-sm">
            <FollowingButton following={following} />
            <span className="text-walnut/30">·</span>
            <Link
              href="/discover"
              className="text-burnt-orange hover:text-burnt-orange/80 transition-colors"
            >
              Find people →
            </Link>
          </div>
        </div>

        {/* Live listeners strip */}
        <NowPlayingBar
          currentUserId={user.id}
          initialLivePlays={(livePlays ?? []).map(p => ({
            ...p,
            profiles: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles ?? null,
            records: Array.isArray(p.records) ? p.records[0] ?? null : p.records ?? null,
          }))}
        />

        {/* Feed */}
        <FeedList plays={feedPlays || []} currentUserId={user.id} />
      </div>
      </PullToRefresh>
    </main>
  )
}
