'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Track = {
  position: number
  title: string
  length: number | null
}

type LookupResponse = {
  success: boolean
  metadata: {
    releaseDate: string | null
    label: string | null
    tracks: Track[]
  } | null
  error?: string
}

export function FetchTracksButton({
  recordId,
  title,
  artist,
}: {
  recordId: string
  title: string
  artist: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetch = async () => {
    setLoading(true)
    setError(null)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      })

      const data: LookupResponse = await response.json()

      if (!data.success || !data.metadata) {
        setError('Could not find track information for this album')
        setLoading(false)
        return
      }

      // Update record metadata in Supabase
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('records')
        .update({
          metadata: {
            releaseDate: data.metadata.releaseDate,
            label: data.metadata.label,
            tracks: data.metadata.tracks,
          },
        })
        .eq('id', recordId)

      if (updateError) {
        setError('Failed to save track information')
        setLoading(false)
        return
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-tan/30 rounded-lg border border-walnut/10">
      <p className="text-sm text-walnut/60 mb-3">
        Track list not available for this record.
      </p>
      <button
        onClick={handleFetch}
        disabled={loading}
        className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Looking up tracks...' : 'Fetch Track List'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
