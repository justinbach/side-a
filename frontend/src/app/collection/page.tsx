import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { CollectionPreview } from '@/components/collection-preview'
import { FeedList } from '@/components/feed-list'
import { DashboardCollectionSwitcher } from '@/components/dashboard-collection-switcher'

const MOODS = [
  { value: 'Morning', emoji: '🌅' },
  { value: 'Cocktail Hour', emoji: '🍸' },
  { value: 'Dinner', emoji: '🍽️' },
  { value: 'Late Night', emoji: '🌙' },
  { value: 'Background', emoji: '🎧' },
  { value: 'Weekend', emoji: '☀️' },
] as const

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c: selectedCollectionId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Accept any pending invitations for this user
  const { data: pendingInvitations } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', user.email?.toLowerCase() || '')
    .is('accepted_at', null)

  if (pendingInvitations && pendingInvitations.length > 0) {
    for (const inv of pendingInvitations) {
      await supabase.rpc('accept_invitation', { invitation_id: inv.id })
    }
  }

  // Get all collections user has access to
  let { data: collections } = await supabase
    .from('collections')
    .select('id, name, owner_id')
    .order('created_at', { ascending: true })

  // Create default collection if user doesn't have any
  if (!collections || collections.length === 0) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: newCollection, error } = await supabaseAdmin
      .from('collections')
      .insert({ name: 'My Collection', owner_id: user.id })
      .select('id, name, owner_id')
      .single()

    if (error) {
      console.error('Failed to create collection:', error)
      return (
        <main className="min-h-screen p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to create collection: {error.message}</p>
          </div>
        </main>
      )
    }

    collections = [newCollection]
  }

  // Find selected collection or default to first one
  const collection = selectedCollectionId
    ? collections.find(c => c.id === selectedCollectionId) || collections[0]
    : collections[0]

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Five parallel dashboard queries
  const [
    { data: recentRecords },
    { count: recordCount },
    { count: playsThisWeek },
    { data: feedPlays },
    { data: nowPlaying },
  ] = await Promise.all([
    // 4 most recently added records for preview
    supabase
      .from('records')
      .select('id, title, artist, cover_image_url')
      .eq('collection_id', collection.id)
      .order('created_at', { ascending: false })
      .limit(4),
    // Total record count
    supabase
      .from('records')
      .select('id', { count: 'exact', head: true })
      .eq('collection_id', collection.id),
    // Own plays in last 7 days
    supabase
      .from('plays')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('played_at', weekAgo),
    // 20 recent plays: own + social (no .neq filter so own plays appear)
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
      .order('played_at', { ascending: false })
      .limit(20),
    // Current user's most recent play in last 30 min (now spinning)
    supabase
      .from('plays')
      .select('id, played_at, mood, records(id, title, artist, cover_image_url, collection_id)')
      .eq('user_id', user.id)
      .gte('played_at', thirtyMinutesAgo)
      .order('played_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const isOwner = collection.owner_id === user.id

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Now Spinning banner — current user's active play */}
        {(() => {
          const nowPlayingRecord = nowPlaying
            ? (Array.isArray(nowPlaying.records) ? nowPlaying.records[0] : nowPlaying.records)
            : null
          return nowPlaying && nowPlayingRecord ? (
            <Link href={`/collection/${nowPlayingRecord.id}?c=${nowPlayingRecord.collection_id}`}>
              <div className="flex items-center gap-3 bg-warm-white border border-burnt-orange/20 rounded-xl px-4 py-3">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-burnt-orange opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-burnt-orange" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-walnut truncate">{nowPlayingRecord.title}</p>
                  <p className="text-xs text-walnut/60 truncate">{nowPlayingRecord.artist}</p>
                </div>
                <span className="text-xs text-walnut/40 flex-shrink-0">Now spinning →</span>
              </div>
            </Link>
          ) : null
        })()}

        {/* Collection identity + stats */}
        <section>
          {/* Collection name / dropdown */}
          <div className="mb-4">
            {collections.length > 1 ? (
              <DashboardCollectionSwitcher
                collections={collections}
                collectionId={collection.id}
              />
            ) : (
              <h2 className="font-serif text-2xl text-walnut">{collection.name}</h2>
            )}
          </div>

          {/* Stat tiles */}
          <div className="flex gap-4">
            <Link href={`/collection/browse?c=${collection.id}`} className="flex-1">
              <div className="bg-warm-white rounded-xl border border-walnut/10 p-4 text-center hover:border-burnt-orange/30 hover:shadow-sm transition-all">
                <p className="text-2xl font-bold text-walnut font-serif">{recordCount ?? 0}</p>
                <p className="text-sm text-walnut/60 mt-1">Records</p>
              </div>
            </Link>
            <Link href={`/collection/stats?c=${collection.id}&filter=week`} className="flex-1">
              <div className="bg-warm-white rounded-xl border border-walnut/10 p-4 text-center hover:border-burnt-orange/30 hover:shadow-sm transition-all">
                <p className="text-2xl font-bold text-walnut font-serif">{playsThisWeek ?? 0}</p>
                <p className="text-sm text-walnut/60 mt-1">Plays This Week</p>
              </div>
            </Link>
          </div>
          <div className="mt-2 text-right">
            <Link
              href={`/collection/stats?c=${collection.id}`}
              className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
            >
              Full stats →
            </Link>
          </div>
        </section>

        {/* Collection Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-walnut">Collection</h3>
            {isOwner && (
              <Link
                href={`/collection/settings?c=${collection.id}`}
                className="text-walnut/50 hover:text-walnut transition-colors"
                title="Collection Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
          </div>
          <CollectionPreview
            records={recentRecords}
            totalCount={recordCount ?? 0}
            collectionId={collection.id}
          />
        </section>

        {/* What vibe are we going for? — mood quick-pick */}
        <section>
          <h3 className="font-serif text-lg font-semibold text-walnut mb-3">What vibe are we going for?</h3>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(({ value, emoji }) => (
              <Link
                key={value}
                href={`/collection/pick?c=${collection.id}&mood=${encodeURIComponent(value)}`}
                className="flex flex-col items-center gap-1 p-3 bg-warm-white rounded-xl border border-walnut/10 hover:border-burnt-orange/30 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs text-walnut/70 text-center leading-tight">{value}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Wish list teaser */}
        <div className="text-right -mt-6">
          <Link
            href="/wishlist"
            className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
          >
            My wish list →
          </Link>
        </div>

        {/* Activity Feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-walnut">Activity</h3>
            <Link
              href="/feed"
              className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
            >
              See full feed →
            </Link>
          </div>
          <FeedList plays={feedPlays || []} currentUserId={user.id} />
        </section>
      </div>
    </main>
  )
}
