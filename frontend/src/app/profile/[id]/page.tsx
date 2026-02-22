import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from '@/components/follow-button'

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

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: profileId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, email, created_at, share_activity')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  const isOwnProfile = user.id === profileId

  // Check if current user follows this profile
  let isFollowing = false
  if (!isOwnProfile) {
    const { data: followCheck } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profileId)
      .maybeSingle()

    isFollowing = !!followCheck
  }

  // Fetch recent plays (RLS will handle privacy)
  const { data: recentPlays } = await supabase
    .from('plays')
    .select(`
      id,
      played_at,
      mood,
      records(id, title, artist, cover_image_url, collection_id)
    `)
    .eq('user_id', profileId)
    .order('played_at', { ascending: false })
    .limit(20)

  // Calculate basic stats
  const totalPlays = recentPlays?.length || 0
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const playsThisWeek = recentPlays?.filter(p => new Date(p.played_at) >= weekAgo).length || 0

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/feed"
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </Link>

        {/* Profile Header */}
        <div className="bg-warm-white rounded-xl border border-walnut/10 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-walnut mb-2">
                {profile.display_name || 'Unknown User'}
              </h1>
              <p className="text-walnut/60">{profile.email}</p>
              <p className="text-sm text-walnut/40 mt-1">
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
            {!isOwnProfile && (
              <FollowButton userId={profileId} initialIsFollowing={isFollowing} />
            )}
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-tan/30 rounded-lg">
              <p className="text-3xl font-serif text-walnut">{totalPlays}</p>
              <p className="text-sm text-walnut/60">Recent Plays</p>
            </div>
            <div className="text-center p-4 bg-tan/30 rounded-lg">
              <p className="text-3xl font-serif text-walnut">{playsThisWeek}</p>
              <p className="text-sm text-walnut/60">This Week</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="font-serif text-xl text-walnut mb-4">Recent Activity</h2>
          {!recentPlays || recentPlays.length === 0 ? (
            <div className="bg-warm-white rounded-xl border border-walnut/10 p-8 text-center">
              <p className="text-walnut/60">
                {profile.share_activity
                  ? 'No recent activity to show'
                  : 'This user has disabled activity sharing'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPlays.map((play) => {
                const record = Array.isArray(play.records) ? play.records[0] : play.records
                if (!record) return null

                return (
                  <Link
                    key={play.id}
                    href={`/collection/${record.id}?c=${record.collection_id}`}
                    className="block bg-warm-white rounded-xl border border-walnut/10 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {/* Album Cover */}
                      {record.cover_image_url ? (
                        <Image
                          src={record.cover_image_url}
                          alt=""
                          width={60}
                          height={60}
                          className="w-15 h-15 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded bg-tan flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                          </svg>
                        </div>
                      )}

                      {/* Play Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-walnut/60">
                            {formatRelativeTime(play.played_at)}
                          </span>
                          {play.mood && (
                            <span className="text-sm text-walnut/50 flex items-center gap-1">
                              <span>{getMoodEmoji(play.mood)}</span>
                              <span>{play.mood}</span>
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-walnut truncate">{record.title}</p>
                        <p className="text-sm text-walnut/60 truncate">{record.artist}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
