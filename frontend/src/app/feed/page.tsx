import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeedList } from '@/components/feed-list'
import { NowPlayingBar } from '@/components/now-playing-bar'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Two parallel queries — feed + live plays
  // RLS handles visibility: follows + shared collections
  const [{ data: feedPlays }, { data: livePlays }] = await Promise.all([
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
  ])

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Find people link */}
        <div className="mb-6 text-right">
          <Link
            href="/discover"
            className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
          >
            Find people →
          </Link>
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
    </main>
  )
}
