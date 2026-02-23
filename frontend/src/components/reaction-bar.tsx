'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REACTIONS = ['❤️', '🔥', '👏', '🎵'] as const

type Reaction = { id: string; user_id: string; emoji: string }

export function ReactionBar({
  playId,
  initialReactions,
  currentUserId,
}: {
  playId: string
  initialReactions: Reaction[]
  currentUserId: string
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions)

  const toggle = async (emoji: string) => {
    const existing = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji)

    if (existing) {
      // Optimistic remove
      setReactions(prev => prev.filter(r => r.id !== existing.id))
      const supabase = createClient()
      const { error } = await supabase.from('play_reactions').delete().eq('id', existing.id)
      if (error) {
        console.error('Failed to remove reaction:', error)
        setReactions(prev => [...prev, existing])
      }
    } else {
      // Optimistic add
      const tempId = `temp-${Date.now()}`
      setReactions(prev => [...prev, { id: tempId, user_id: currentUserId, emoji }])
      const supabase = createClient()
      const { data, error } = await supabase
        .from('play_reactions')
        .insert({ play_id: playId, user_id: currentUserId, emoji })
        .select('id')
        .single()
      if (error) {
        console.error('Failed to add reaction:', error)
        setReactions(prev => prev.filter(r => r.id !== tempId))
      } else if (data) {
        setReactions(prev => prev.map(r => r.id === tempId ? { ...r, id: data.id } : r))
      }
    }
  }

  const counts = REACTIONS.map(emoji => ({
    emoji,
    count: reactions.filter(r => r.emoji === emoji).length,
    reacted: reactions.some(r => r.emoji === emoji && r.user_id === currentUserId),
  }))

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-walnut/5">
      {counts.map(({ emoji, count, reacted }) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
            reacted
              ? 'bg-burnt-orange/10 text-burnt-orange border border-burnt-orange/20'
              : count > 0
              ? 'bg-tan/50 text-walnut/70 border border-walnut/10 hover:bg-tan'
              : 'text-walnut/30 hover:text-walnut/60 hover:bg-tan/30 border border-transparent'
          }`}
        >
          <span>{emoji}</span>
          {count > 0 && <span className="text-xs font-medium">{count}</span>}
        </button>
      ))}
    </div>
  )
}
