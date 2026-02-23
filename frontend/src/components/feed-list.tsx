'use client'

import Link from 'next/link'
import { FeedCard } from './feed-card'

type Play = {
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
  play_reactions?: { id: string; user_id: string; emoji: string }[] | null
}

type FeedListProps = {
  plays: Play[]
  currentUserId?: string
}

export function FeedList({ plays, currentUserId }: FeedListProps) {
  if (plays.length === 0) {
    return (
      <div className="bg-warm-white rounded-xl border border-walnut/10 p-12 text-center">
        <svg className="w-16 h-16 text-walnut/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <p className="text-walnut/60 mb-4">No activity to show yet</p>
        <Link
          href="/discover"
          className="inline-block px-5 py-2.5 bg-burnt-orange text-warm-white rounded-full text-sm font-medium hover:bg-burnt-orange/90 transition-colors"
        >
          Discover Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {plays.map((play) => (
        <FeedCard key={play.id} play={play} isOwnPlay={currentUserId ? play.user_id === currentUserId : false} currentUserId={currentUserId} />
      ))}
    </div>
  )
}
