'use client'

import { useState, useEffect } from 'react'
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
}: {
  recordId: string
  initialPlays: Play[]
  currentUserId: string
}) {
  const [plays, setPlays] = useState<Play[]>(initialPlays)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [currentPlayId, setCurrentPlayId] = useState<string | null>(null)
  const [editingPlayId, setEditingPlayId] = useState<string | null>(null)
  const [isLogging, setIsLogging] = useState(false)

  const handlePlay = async () => {
    setIsLogging(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsLogging(false)
      return
    }

    const { data, error } = await supabase
      .from('plays')
      .insert({
        record_id: recordId,
        user_id: user.id,
      })
      .select('id, played_at, mood, user_id, profiles(display_name)')
      .single()

    setIsLogging(false)

    if (error) {
      console.error('Failed to log play:', error)
      return
    }

    // Add to plays list and show mood picker
    setPlays([data as Play, ...plays])
    setCurrentPlayId(data.id)
    setShowMoodPicker(true)
  }

  const handleMoodSelect = async (mood: Mood) => {
    if (!currentPlayId) return

    const supabase = createClient()
    const { error } = await supabase
      .from('plays')
      .update({ mood })
      .eq('id', currentPlayId)

    if (error) {
      console.error('Failed to update mood:', error)
      return
    }

    // Update local state
    setPlays(plays.map(p =>
      p.id === currentPlayId ? { ...p, mood } : p
    ))
    setShowMoodPicker(false)
    setCurrentPlayId(null)
  }

  const handleSkipMood = () => {
    setShowMoodPicker(false)
    setCurrentPlayId(null)
  }

  const handleEditMood = (playId: string) => {
    setEditingPlayId(editingPlayId === playId ? null : playId)
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

    setPlays(plays.map(p =>
      p.id === playId ? { ...p, mood } : p
    ))
    setEditingPlayId(null)
  }

  // Auto-hide mood picker after 10 seconds
  useEffect(() => {
    if (showMoodPicker) {
      const timer = setTimeout(() => {
        setShowMoodPicker(false)
        setCurrentPlayId(null)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showMoodPicker])

  const formatPlayTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    if (isToday) {
      return `Today, ${time}`
    } else if (isYesterday) {
      return `Yesterday, ${time}`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }

  const getMoodEmoji = (mood: Mood | null) => {
    if (!mood) return null
    return MOODS.find(m => m.value === mood)?.emoji
  }

  return (
    <div>
      {/* Log Play Button */}
      <button
        onClick={handlePlay}
        disabled={isLogging || showMoodPicker}
        className="w-full md:w-auto px-10 py-5 bg-burnt-orange text-warm-white rounded-xl font-medium text-xl hover:bg-burnt-orange/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <span className="flex items-center justify-center gap-3">
          {isLogging ? (
            <>
              <div className="w-6 h-6 border-2 border-warm-white border-t-transparent rounded-full animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Play
            </>
          )}
        </span>
      </button>

      {/* Mood Picker */}
      {showMoodPicker && (
        <div className="mt-6 p-5 bg-warm-white rounded-xl border border-walnut/10 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-walnut/70 mb-3">How are you listening?</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                className="px-4 py-2 bg-tan/50 hover:bg-burnt-orange/10 border border-walnut/10 rounded-full text-sm text-walnut transition-colors flex items-center gap-2"
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleSkipMood}
            className="mt-3 text-sm text-walnut/50 hover:text-walnut transition-colors"
          >
            Skip
          </button>
        </div>
      )}

      {/* Play History */}
      {plays.length > 0 && (
        <div className="mt-8">
          <h3 className="font-serif text-lg text-walnut mb-4">Play History</h3>
          <div className="space-y-1">
            {plays.slice(0, 10).map((play) => (
              <div key={play.id}>
                <button
                  onClick={() => play.user_id === currentUserId ? handleEditMood(play.id) : undefined}
                  className={`w-full flex items-center justify-between py-2 px-2 -mx-2 rounded-lg transition-colors text-left ${
                    play.user_id === currentUserId ? 'hover:bg-tan/30 cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span className="text-sm text-walnut/70">
                    <span className="font-medium">
                      {play.user_id === currentUserId ? 'You' : (
                        Array.isArray(play.profiles)
                          ? play.profiles[0]?.display_name
                          : play.profiles?.display_name
                      ) || 'Unknown'}
                    </span>
                    <span className="mx-1.5 text-walnut/30">·</span>
                    {formatPlayTime(play.played_at)}
                  </span>
                  {play.mood ? (
                    <span className="text-sm text-walnut/50 flex items-center gap-1">
                      <span>{getMoodEmoji(play.mood)}</span>
                      <span>{play.mood}</span>
                    </span>
                  ) : play.user_id === currentUserId ? (
                    <span className="text-sm text-walnut/30 italic">
                      + Add mood
                    </span>
                  ) : null}
                </button>
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
