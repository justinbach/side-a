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
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-3xl font-bold text-walnut">Activity Feed</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/discover"
                className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
              >
                Discover users
              </Link>
              <Link
                href="/profile/settings"
                className="text-walnut/50 hover:text-walnut transition-colors p-1"
                title="Privacy Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
          <p className="text-walnut/60">
            Recent plays from people you follow and collections you share
          </p>
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

        {/* Bottom Navigation Hint */}
        <div className="mt-8 text-center">
          <Link
            href="/collection"
            className="text-sm text-walnut/50 hover:text-walnut transition-colors"
          >
            Back to Collection
          </Link>
        </div>
      </div>
    </main>
  )
}
