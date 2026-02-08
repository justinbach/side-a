import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

const MOODS = [
  { value: 'Morning', emoji: '🌅' },
  { value: 'Cocktail Hour', emoji: '🍸' },
  { value: 'Dinner', emoji: '🍽️' },
  { value: 'Late Night', emoji: '🌙' },
  { value: 'Background', emoji: '🎧' },
  { value: 'Weekend', emoji: '☀️' },
] as const

type MoodValue = typeof MOODS[number]['value']

function getMoodEmoji(mood: string): string {
  return MOODS.find(m => m.value === mood)?.emoji || '🎵'
}

export default async function CollectionStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c: collectionId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the specified collection or fall back to first accessible collection
  let collection
  if (collectionId) {
    const { data } = await supabase
      .from('collections')
      .select('id, name, owner_id')
      .eq('id', collectionId)
      .single()
    collection = data
  } else {
    const { data } = await supabase
      .from('collections')
      .select('id, name, owner_id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    collection = data
  }

  if (!collection) {
    redirect('/collection')
  }

  // Get all records in the collection
  const { data: records } = await supabase
    .from('records')
    .select('id, title, artist, cover_image_url')
    .eq('collection_id', collection.id)

  const recordIds = records?.map(r => r.id) || []
  const recordMap = new Map(records?.map(r => [r.id, r]) || [])

  // Get all plays for records in this collection with user profiles
  let plays: Array<{
    id: string
    played_at: string
    mood: MoodValue | null
    user_id: string
    record_id: string
    profiles: { display_name: string | null } | { display_name: string | null }[] | null
  }> = []

  if (recordIds.length > 0) {
    const { data } = await supabase
      .from('plays')
      .select('id, played_at, mood, user_id, record_id, profiles(display_name)')
      .in('record_id', recordIds)
      .order('played_at', { ascending: false })
    plays = data || []
  }

  // Aggregate stats per user
  const userStats = new Map<string, {
    displayName: string
    totalPlays: number
    playsThisWeek: number
    playsThisMonth: number
    topRecords: Map<string, number>
    moodCounts: Map<string, number>
    lastPlayedAt: string | null
  }>()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (const play of plays) {
    const userId = play.user_id
    const playDate = new Date(play.played_at)

    // Handle both single object and array from Supabase join
    const profile = Array.isArray(play.profiles) ? play.profiles[0] : play.profiles
    const displayName = profile?.display_name || 'Unknown'

    if (!userStats.has(userId)) {
      userStats.set(userId, {
        displayName: userId === user.id ? 'You' : displayName,
        totalPlays: 0,
        playsThisWeek: 0,
        playsThisMonth: 0,
        topRecords: new Map(),
        moodCounts: new Map(),
        lastPlayedAt: null,
      })
    }

    const stats = userStats.get(userId)!
    stats.totalPlays++

    if (playDate >= weekAgo) stats.playsThisWeek++
    if (playDate >= monthAgo) stats.playsThisMonth++

    // Track top records
    const currentCount = stats.topRecords.get(play.record_id) || 0
    stats.topRecords.set(play.record_id, currentCount + 1)

    // Track moods
    if (play.mood) {
      const moodCount = stats.moodCounts.get(play.mood) || 0
      stats.moodCounts.set(play.mood, moodCount + 1)
    }

    // Track last played
    if (!stats.lastPlayedAt || play.played_at > stats.lastPlayedAt) {
      stats.lastPlayedAt = play.played_at
    }
  }

  // Sort users by total plays (current user first)
  const sortedUsers = Array.from(userStats.entries())
    .sort((a, b) => {
      if (a[0] === user.id) return -1
      if (b[0] === user.id) return 1
      return b[1].totalPlays - a[1].totalPlays
    })

  // Get top 3 records for each user
  const getTopRecords = (topRecords: Map<string, number>) => {
    return Array.from(topRecords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([recordId, count]) => ({
        record: recordMap.get(recordId),
        count,
      }))
      .filter(r => r.record)
  }

  // Get top moods for each user
  const getTopMoods = (moodCounts: Map<string, number>) => {
    return Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/collection?c=${collection.id}`}
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>

        <h1 className="font-serif text-3xl font-bold text-walnut mb-2">
          Listening Stats
        </h1>
        <p className="text-walnut/60 mb-8">{collection.name}</p>

        {sortedUsers.length === 0 ? (
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-8 text-center">
            <p className="text-walnut/60">No plays logged yet. Start listening!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedUsers.map(([userId, stats]) => (
              <div key={userId} className="bg-warm-white rounded-xl border border-walnut/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-serif text-xl text-walnut">{stats.displayName}</h2>
                  {stats.lastPlayedAt && (
                    <span className="text-sm text-walnut/50">
                      Last played {formatRelativeTime(stats.lastPlayedAt)}
                    </span>
                  )}
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-tan/30 rounded-lg">
                    <p className="text-3xl font-serif text-walnut">{stats.totalPlays}</p>
                    <p className="text-sm text-walnut/60">Total Plays</p>
                  </div>
                  <div className="text-center p-4 bg-tan/30 rounded-lg">
                    <p className="text-3xl font-serif text-walnut">{stats.playsThisWeek}</p>
                    <p className="text-sm text-walnut/60">This Week</p>
                  </div>
                  <div className="text-center p-4 bg-tan/30 rounded-lg">
                    <p className="text-3xl font-serif text-walnut">{stats.playsThisMonth}</p>
                    <p className="text-sm text-walnut/60">This Month</p>
                  </div>
                </div>

                {/* Top Records */}
                {getTopRecords(stats.topRecords).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-walnut/70 mb-3">Most Played</h3>
                    <div className="space-y-2">
                      {getTopRecords(stats.topRecords).map(({ record, count }, index) => (
                        <Link
                          key={record!.id}
                          href={`/collection/${record!.id}`}
                          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-tan/30 transition-colors"
                        >
                          <span className="text-walnut/40 w-4 text-center">{index + 1}</span>
                          {record!.cover_image_url ? (
                            <Image
                              src={record!.cover_image_url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-tan flex items-center justify-center">
                              <svg className="w-5 h-5 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                                <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-walnut truncate">{record!.title}</p>
                            <p className="text-sm text-walnut/50 truncate">{record!.artist}</p>
                          </div>
                          <span className="text-sm text-walnut/50">{count} plays</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Moods */}
                {getTopMoods(stats.moodCounts).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-walnut/70 mb-3">Favorite Moods</h3>
                    <div className="flex flex-wrap gap-2">
                      {getTopMoods(stats.moodCounts).map(([mood, count]) => (
                        <span
                          key={mood}
                          className="px-3 py-1.5 bg-tan/50 rounded-full text-sm text-walnut flex items-center gap-1.5"
                        >
                          <span>{getMoodEmoji(mood)}</span>
                          <span>{mood}</span>
                          <span className="text-walnut/50">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
