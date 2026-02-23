'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type Album = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
}

type Props = {
  tier1: Album[]
  tier2Candidates: Album[]
  mood: string
  context: string
  collectionId: string
  currentUserId: string
}

function RecPick({
  album,
  mood,
  currentUserId,
  logged,
  onLogged,
}: {
  album: Album
  mood: string
  currentUserId: string
  logged: boolean
  onLogged: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const handlePlay = async () => {
    if (logged || loading) return
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.from('plays').insert({
        record_id: album.id,
        user_id: currentUserId,
        mood,
        played_at: new Date().toISOString(),
      })
      onLogged(album.id)
    } catch {
      // Silent failure — user can log from the record page
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 bg-warm-white rounded-xl border border-walnut/10 p-3">
      {/* Cover */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-tan/30">
        {album.cover_image_url ? (
          <Image
            src={album.cover_image_url}
            alt={album.title}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-walnut/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-walnut truncate">{album.title}</p>
        <p className="text-xs text-walnut/60 truncate">{album.artist}</p>
      </div>

      {/* Play button */}
      <button
        onClick={handlePlay}
        disabled={logged || loading}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          logged
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-burnt-orange text-warm-white hover:bg-burnt-orange/90 active:scale-95 disabled:opacity-60'
        }`}
      >
        {loading ? (
          <div className="w-3 h-3 border-2 border-warm-white border-t-transparent rounded-full animate-spin" />
        ) : logged ? (
          <>
            <span>✓</span>
            <span>Now playing</span>
          </>
        ) : (
          <>
            <span>▶</span>
            <span>Play</span>
          </>
        )}
      </button>
    </div>
  )
}

export function PickResults({ tier1, tier2Candidates, mood, context, currentUserId }: Props) {
  const [claudeResults, setClaudeResults] = useState<string[] | null>(null)
  const [loadingClaude, setLoadingClaude] = useState(tier2Candidates.length > 0)
  const [loggedPlays, setLoggedPlays] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (tier2Candidates.length === 0) {
      setLoadingClaude(false)
      return
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      setLoadingClaude(false)
      return
    }

    fetch(`${backendUrl}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        albums: tier2Candidates.map(a => ({ id: a.id, title: a.title, artist: a.artist })),
      }),
    })
      .then(r => r.json())
      .then((data: { recommendations: string[] }) => {
        setClaudeResults(data.recommendations ?? [])
      })
      .catch(() => {
        setClaudeResults([])
      })
      .finally(() => {
        setLoadingClaude(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogged = (id: string) => {
    setLoggedPlays(prev => new Set([...prev, id]))
  }

  // Build Tier 2 ordered list from Claude's ranked IDs
  const tier2Albums: Album[] = claudeResults
    ? claudeResults
        .map(id => tier2Candidates.find(a => a.id === id))
        .filter((a): a is Album => !!a)
    : []

  const hasTier1 = tier1.length > 0
  const hasTier2 = tier2Albums.length > 0

  return (
    <div className="space-y-8">
      {/* Tier 1 — history-based picks */}
      {hasTier1 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-serif text-lg font-semibold text-walnut">Your top picks</h2>
            <span className="text-xs text-walnut/40 bg-tan/40 px-2 py-0.5 rounded-full">
              {tier1.length} record{tier1.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {tier1.map(album => (
              <RecPick
                key={album.id}
                album={album}
                mood={mood}
                currentUserId={currentUserId}
                logged={loggedPlays.has(album.id)}
                onLogged={handleLogged}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tier 2 — Claude discovery picks */}
      {tier2Candidates.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-serif text-lg font-semibold text-walnut">Try something new</h2>
          </div>

          {loadingClaude ? (
            <div className="flex items-center gap-3 py-6 text-walnut/50 text-sm">
              <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Finding the best fit…
            </div>
          ) : hasTier2 ? (
            <div className="space-y-2">
              {tier2Albums.map(album => (
                <RecPick
                  key={album.id}
                  album={album}
                  mood={mood}
                  currentUserId={currentUserId}
                  logged={loggedPlays.has(album.id)}
                  onLogged={handleLogged}
                />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Edge case: nothing to show at all yet */}
      {!hasTier1 && !loadingClaude && !hasTier2 && (
        <p className="text-walnut/50 text-sm">No suggestions available right now.</p>
      )}
    </div>
  )
}
