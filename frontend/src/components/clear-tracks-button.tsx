'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ClearTracksButton({
  recordId,
}: {
  recordId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleClear = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Get current metadata first to preserve other fields
      const { data: record } = await supabase
        .from('records')
        .select('metadata')
        .eq('id', recordId)
        .single()

      const currentMetadata = (record?.metadata || {}) as Record<string, unknown>

      // Remove tracks from metadata
      const metadataWithoutTracks = { ...currentMetadata }
      delete metadataWithoutTracks.tracks

      const { error: updateError } = await supabase
        .from('records')
        .update({ metadata: metadataWithoutTracks })
        .eq('id', recordId)

      if (updateError) {
        console.error('Failed to clear tracks:', updateError)
        setLoading(false)
        setConfirming(false)
        return
      }

      router.refresh()
    } catch (err) {
      console.error('Failed to clear tracks:', err)
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-walnut/60">Clear track list?</span>
        <button
          onClick={handleClear}
          disabled={loading}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          {loading ? 'Clearing...' : 'Yes, clear'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-walnut/60 hover:text-walnut"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-walnut/50 hover:text-walnut transition-colors"
    >
      Clear track list
    </button>
  )
}
