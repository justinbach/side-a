import Link from 'next/link'
import Image from 'next/image'
import { ReactionBar } from './reaction-bar'

const MOODS = [
  { value: 'Morning', emoji: '🌅' },
  { value: 'Cocktail Hour', emoji: '🍸' },
  { value: 'Dinner', emoji: '🍽️' },
  { value: 'Late Night', emoji: '🌙' },
  { value: 'Background', emoji: '🎧' },
  { value: 'Weekend', emoji: '☀️' },
] as const

function getMoodEmoji(mood: string): string {
  return MOODS.find(m => m.value === mood)?.emoji || '🎵'
}

const LIVE_WINDOW_MS = 30 * 60 * 1000

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMs < LIVE_WINDOW_MS) return 'Listening now 🎵'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Reaction = { id: string; user_id: string; emoji: string }

type FeedCardProps = {
  play: {
    id: string
    played_at: string
    mood: string | null
    user_id: string
    profiles: { id: string; display_name: string | null } | { id: string; display_name: string | null }[] | null
    records: {
      id: string
      title: string
      artist: string
      cover_image_url: string | null
      collection_id: string
    } | {
      id: string
      title: string
      artist: string
      cover_image_url: string | null
      collection_id: string
    }[] | null
    play_reactions?: Reaction[] | null
  }
  isOwnPlay?: boolean
  currentUserId?: string
}

export function FeedCard({ play, isOwnPlay, currentUserId }: FeedCardProps) {
  // Handle Supabase join result (could be object or array)
  const profile = Array.isArray(play.profiles) ? play.profiles[0] : play.profiles
  const record = Array.isArray(play.records) ? play.records[0] : play.records

  if (!profile || !record) return null

  const displayName = profile.display_name || 'Unknown User'
  const reactions = play.play_reactions ?? []

  return (
    <div className={`rounded-xl border border-walnut/10 p-4 shadow-sm hover:shadow-md transition-shadow ${isOwnPlay ? 'bg-cream border-l-2 border-l-burnt-orange/40' : 'bg-warm-white'}`}>
      <div className="flex items-start gap-4">
        {/* Album Cover */}
        <Link
          href={`/collection/${record.id}?c=${record.collection_id}`}
          className="flex-shrink-0"
        >
          {record.cover_image_url ? (
            <Image
              src={record.cover_image_url}
              alt=""
              width={80}
              height={80}
              className="w-20 h-20 rounded object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded bg-tan flex items-center justify-center">
              <svg className="w-8 h-8 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </Link>

        {/* Play Info */}
        <div className="flex-1 min-w-0">
          {/* User & Time */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-sm text-walnut/60">
            {isOwnPlay ? (
              <span className="font-medium text-walnut">You</span>
            ) : (
              <Link
                href={`/profile/${profile.id}`}
                className="font-medium text-walnut hover:text-burnt-orange transition-colors"
              >
                {displayName}
              </Link>
            )}
            <span>·</span>
            <span>{formatRelativeTime(play.played_at)}</span>
            {play.mood && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span>{getMoodEmoji(play.mood)}</span>
                  <span>{play.mood}</span>
                </span>
              </>
            )}
          </div>

          {/* Album Info */}
          <Link
            href={`/collection/${record.id}?c=${record.collection_id}`}
            className="block group"
          >
            <p className="font-medium text-walnut group-hover:text-burnt-orange transition-colors truncate">
              {record.title}
            </p>
            <p className="text-sm text-walnut/60 truncate">{record.artist}</p>
          </Link>

          {/* Reactions */}
          {currentUserId && (
            <ReactionBar
              playId={play.id}
              initialReactions={reactions}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  )
}
