'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const LIVE_WINDOW_MS = 30 * 60 * 1000

type LivePlay = {
  id: string
  played_at: string
  mood: string | null
  user_id: string
  profiles: { id: string; display_name: string | null } | null
  records: {
    id: string
    title: string
    artist: string
    cover_image_url: string | null
    collection_id: string
  } | null
}

function NowPlayingCard({ play }: { play: LivePlay }) {
  const profile = play.profiles
  const record = play.records

  if (!profile || !record) return null

  return (
    <div className="flex items-center gap-3 border border-burnt-orange/20 bg-warm-white rounded-xl px-3 py-2.5">
      {/* Album cover */}
      <Link
        href={`/collection/${record.id}?c=${record.collection_id}`}
        className="flex-shrink-0"
      >
        {record.cover_image_url ? (
          <Image
            src={record.cover_image_url}
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 rounded object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded bg-tan flex items-center justify-center">
            <svg className="w-5 h-5 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </Link>

      {/* Title + artist */}
      <Link
        href={`/collection/${record.id}?c=${record.collection_id}`}
        className="flex-1 min-w-0 block"
      >
        <p className="text-sm font-medium text-walnut truncate">{record.title}</p>
        <p className="text-xs text-walnut/60 truncate">{record.artist}</p>
      </Link>

      {/* Display name */}
      <Link
        href={`/profile/${profile.id}`}
        className="text-xs text-walnut/50 hover:text-burnt-orange transition-colors flex-shrink-0 truncate max-w-[80px]"
      >
        {profile.display_name || 'Unknown'}
      </Link>
    </div>
  )
}

export function NowPlayingBar({
  currentUserId,
  initialLivePlays,
}: {
  currentUserId: string
  initialLivePlays: LivePlay[]
}) {
  const [livePlays, setLivePlays] = useState<LivePlay[]>(initialLivePlays)

  const prune = useCallback(() => {
    const cutoff = new Date(Date.now() - LIVE_WINDOW_MS).toISOString()
    setLivePlays(prev => prev.filter(p => p.played_at >= cutoff))
  }, [])

  const fetchFullPlay = useCallback(async (id: string): Promise<LivePlay | null> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('plays')
      .select('id, played_at, mood, user_id, profiles(id, display_name), records(id, title, artist, cover_image_url, collection_id)')
      .eq('id', id)
      .maybeSingle()

    if (!data) return null

    // Normalize join shapes
    const profiles = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
    const records = Array.isArray(data.records) ? data.records[0] : data.records

    return {
      id: data.id,
      played_at: data.played_at,
      mood: data.mood,
      user_id: data.user_id,
      profiles: profiles ?? null,
      records: records ?? null,
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('now-playing-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'plays' },
        async (payload) => {
          const newPlay = payload.new as { id: string; user_id: string }

          // Skip own plays
          if (newPlay.user_id === currentUserId) return

          const full = await fetchFullPlay(newPlay.id)
          if (!full) return // RLS blocked it — not a visible user

          setLivePlays(prev => {
            // Deduplicate by user_id — new play supersedes previous one
            const without = prev.filter(p => p.user_id !== full.user_id)
            return [full, ...without]
          })

          prune()
        }
      )
      .subscribe()

    const interval = setInterval(prune, 60_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [currentUserId, fetchFullPlay, prune])

  if (livePlays.length === 0) return null

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-burnt-orange opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-burnt-orange" />
        </span>
        <span className="text-sm font-medium text-walnut/70">Listening Now</span>
      </div>
      <div className="space-y-2">
        {livePlays.map(play => (
          <NowPlayingCard key={play.user_id} play={play} />
        ))}
      </div>
    </section>
  )
}
