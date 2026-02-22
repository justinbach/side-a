'use client'

import { useRouter } from 'next/navigation'
import { PullToRefresh } from './pull-to-refresh'
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
}

type FeedListProps = {
  plays: Play[]
}

export function FeedList({ plays }: FeedListProps) {
  const router = useRouter()

  const handleRefresh = async () => {
    router.refresh()
  }

  if (plays.length === 0) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="bg-warm-white rounded-xl border border-walnut/10 p-12 text-center">
          <svg className="w-16 h-16 text-walnut/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-walnut/60 mb-2">No activity to show yet</p>
          <p className="text-sm text-walnut/40">
            Follow users or log plays in your collections to see activity here
          </p>
        </div>
      </PullToRefresh>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-3">
        {plays.map((play) => (
          <FeedCard key={play.id} play={play} />
        ))}
      </div>
    </PullToRefresh>
  )
}
