'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Note = {
  id: string
  star_rating: number | null
  text: string | null
  updated_at: string
}

export function NotesSection({
  recordId,
  initialNote,
}: {
  recordId: string
  initialNote: Note | null
}) {
  const [rating, setRating] = useState<number | null>(initialNote?.star_rating || null)
  const [text, setText] = useState(initialNote?.text || '')
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialNote?.updated_at ? new Date(initialNote.updated_at) : null
  )

  // Debounced save for text changes
  const saveNote = useCallback(async (newRating: number | null, newText: string) => {
    setIsSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('notes')
      .upsert(
        {
          record_id: recordId,
          user_id: user.id,
          star_rating: newRating,
          text: newText || null,
        },
        {
          onConflict: 'record_id,user_id',
        }
      )

    setIsSaving(false)

    if (error) {
      console.error('Failed to save note:', error)
      return
    }

    setLastSaved(new Date())
  }, [recordId])

  // Debounce text changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text !== (initialNote?.text || '') || rating !== initialNote?.star_rating) {
        saveNote(rating, text)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [text, rating, saveNote, initialNote?.text, initialNote?.star_rating])

  const handleRatingClick = (newRating: number) => {
    // If clicking the same rating, clear it
    const finalRating = rating === newRating ? null : newRating
    setRating(finalRating)
    saveNote(finalRating, text)
  }

  const displayRating = hoverRating ?? rating

  return (
    <div className="space-y-6">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-walnut mb-2">
          Your Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`Rate ${star} stars`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  displayRating && star <= displayRating
                    ? 'text-mustard fill-mustard'
                    : 'text-walnut/20 fill-transparent'
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          ))}
          {rating && (
            <button
              type="button"
              onClick={() => handleRatingClick(rating)}
              className="ml-2 text-sm text-walnut/50 hover:text-walnut transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notes Text */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-walnut mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add your thoughts about this album..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 resize-none text-walnut placeholder:text-walnut/40"
        />
        <div className="flex justify-between items-center mt-2 text-sm text-walnut/50">
          <span>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-walnut/30 border-t-walnut rounded-full animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              `Saved ${formatTimeSince(lastSaved)}`
            ) : (
              'Auto-saves as you type'
            )}
          </span>
          <span>{text.length} characters</span>
        </div>
      </div>
    </div>
  )
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return date.toLocaleDateString()
}
