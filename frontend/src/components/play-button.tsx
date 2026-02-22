'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MOODS = [
  { value: 'Morning', emoji: '🌅', label: 'Morning' },
  { value: 'Cocktail Hour', emoji: '🍸', label: 'Cocktail Hour' },
  { value: 'Dinner', emoji: '🍽️', label: 'Dinner' },
  { value: 'Late Night', emoji: '🌙', label: 'Late Night' },
  { value: 'Background', emoji: '🎧', label: 'Background' },
  { value: 'Weekend', emoji: '☀️', label: 'Weekend' },
] as const

type Mood = typeof MOODS[number]['value']

type Play = {
  id: string
  played_at: string
  mood: Mood | null
  user_id: string
  profiles: { display_name: string | null } | { display_name: string | null }[] | null
}

export function PlayButton({
  recordId,
  initialPlays,
  currentUserId,
  isMember = true,
}: {
  recordId: string
  initialPlays: Play[]
  currentUserId: string
  isMember?: boolean
}) {
  const [plays, setPlays] = useState<Play[]>(initialPlays)
  const [loggingMood, setLoggingMood] = useState<Mood | 'none' | null>(null)
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null)

  // Single-step log: tap a mood pill or "no mood" — one action, play created immediately
  const handleLog = async (mood: Mood | null) => {
    setLoggingMood(mood ?? 'none')
    const supabase = createClient()

    const { data, error } = await supabase
      .from('plays')
      .insert({ record_id: recordId, user_id: currentUserId, mood })
      .select('id, played_at, mood, user_id')
      .single()

    setLoggingMood(null)

    if (error) {
      console.error('Failed to log play:', error)
      return
    }

    setPlays(prev => [{ ...data, profiles: null }, ...prev])
  }

  const handleUpdateMood = async (playId: string, mood: Mood | null) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('plays')
      .update({ mood })
      .eq('id', playId)

    if (error) {
      console.error('Failed to update mood:', error)
      return
    }

    setPlays(prev => prev.map(p => p.id === playId ? { ...p, mood } : p))
    setEditingPlayId(null)
  }

  const handleDelete = async (playId: string) => {
    const previous = plays
    setPlays(prev => prev.filter(p => p.id !== playId))
    setEditingPlayId(null)

    const supabase = createClient()
    const { error } = await supabase.from('plays').delete().eq('id', playId)

    if (error) {
      console.error('Failed to delete play:', error)
      setPlays(previous)
    }
  }

  const formatPlayTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    if (date.toDateString() === now.toDateString()) return `Today, ${time}`
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const getMoodEmoji = (mood: Mood | null) => MOODS.find(m => m.value === mood)?.emoji ?? null

  const getDisplayName = (play: Play) => {
    if (play.user_id === currentUserId) return 'You'
    if (!play.profiles) return null
    const profile = Array.isArray(play.profiles) ? play.profiles[0] : play.profiles
    return profile?.display_name || null
  }

  const isOwnPlay = (play: Play) => play.user_id === currentUserId

  return (
    <div>
      {/* Logging UI: single-step — tap a mood to log, or log without one */}
      {isMember && (
        <div>
          <p className="text-sm text-walnut/60 mb-3">Log a play</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleLog(mood.value)}
                disabled={loggingMood !== null}
                className="px-4 py-2.5 bg-burnt-orange text-warm-white rounded-full font-medium text-sm hover:bg-burnt-orange/90 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-sm"
              >
                {loggingMood === mood.value ? (
                  <div className="w-3.5 h-3.5 border-2 border-warm-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{mood.emoji}</span>
                )}
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => handleLog(null)}
            disabled={loggingMood !== null}
            className="mt-3 text-sm text-walnut/50 hover:text-walnut transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loggingMood === 'none' && (
              <div className="w-3 h-3 border-2 border-walnut/50 border-t-transparent rounded-full animate-spin" />
            )}
            Log without mood
          </button>
        </div>
      )}

      {/* Play History */}
      {plays.length > 0 && (
        <div className={isMember ? 'mt-8' : ''}>
          <h3 className="font-serif text-lg text-walnut mb-4">Play History</h3>
          <div className="space-y-1">
            {plays.slice(0, 10).map((play) => (
              <div key={play.id}>
                <div className="flex items-center gap-2 py-2 px-2 -mx-2 rounded-lg group">
                  {/* Row — tappable to edit mood on own plays */}
                  <button
                    onClick={() => {
                      if (isMember && isOwnPlay(play)) {
                        setEditingPlayId(editingPlayId === play.id ? null : play.id)
                      }
                    }}
                    className={`flex-1 flex items-center justify-between text-left min-w-0 ${isMember && isOwnPlay(play) ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className="text-sm text-walnut/70 truncate">
                      {getDisplayName(play) && (
                        <span className="font-medium text-walnut">{getDisplayName(play)} · </span>
                      )}
                      {formatPlayTime(play.played_at)}
                    </span>
                    {play.mood ? (
                      <span className="text-sm text-walnut/50 flex items-center gap-1 flex-shrink-0 ml-2">
                        <span>{getMoodEmoji(play.mood)}</span>
                        <span>{play.mood}</span>
                      </span>
                    ) : isMember && isOwnPlay(play) ? (
                      <span className="text-sm text-walnut/30 italic flex-shrink-0 ml-2">+ mood</span>
                    ) : null}
                  </button>

                  {/* Delete — own plays, appears on hover/focus */}
                  {isMember && isOwnPlay(play) && (
                    <button
                      onClick={() => handleDelete(play.id)}
                      className="flex-shrink-0 text-walnut/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5"
                      title="Delete play"
                      aria-label="Delete play"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Inline mood editor */}
                {editingPlayId === play.id && (
                  <div className="py-3 px-2 -mx-2 bg-tan/20 rounded-lg mb-1">
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => handleUpdateMood(play.id, mood.value)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                            play.mood === mood.value
                              ? 'bg-burnt-orange text-warm-white'
                              : 'bg-warm-white border border-walnut/10 text-walnut hover:bg-burnt-orange/10'
                          }`}
                        >
                          <span>{mood.emoji}</span>
                          <span>{mood.label}</span>
                        </button>
                      ))}
                    </div>
                    {play.mood && (
                      <button
                        onClick={() => handleUpdateMood(play.id, null)}
                        className="mt-2 text-sm text-walnut/50 hover:text-walnut transition-colors"
                      >
                        Clear mood
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {plays.length > 10 && (
              <p className="text-sm text-walnut/40 pt-2">
                + {plays.length - 10} more plays
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
