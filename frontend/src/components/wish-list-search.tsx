'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlbumSearch } from './album-search'
import { addToWishList } from '@/app/actions/wish-list'

type MusicBrainzRelease = {
  id: string
  title: string
  artist: string
  releaseDate: string | null
  label: string | null
  country: string | null
  trackCount: number
  tracks: { position: number; title: string; length: number | null }[]
  coverArtUrl: string | null
}

export function WishListSearch() {
  const router = useRouter()
  const [showSearch, setShowSearch] = useState(false)
  const [status, setStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSelect = async (release: MusicBrainzRelease) => {
    setStatus('adding')
    const result = await addToWishList(release)
    if (!result.success) {
      setStatus('error')
      setErrorMsg(result.error || 'Failed to add')
      return
    }
    setStatus('added')
    setShowSearch(false)
    router.refresh()
    // Reset status after a moment so button is ready again
    setTimeout(() => setStatus('idle'), 1500)
  }

  if (showSearch) {
    return (
      <div className="bg-warm-white rounded-xl border border-walnut/10 p-4 mb-6">
        <h2 className="font-medium text-walnut mb-3">Find an album</h2>
        {status === 'adding' ? (
          <div className="flex items-center gap-2 py-4 text-walnut/60">
            <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Adding to wish list...</span>
          </div>
        ) : (
          <AlbumSearch
            onSelect={handleSelect}
            actionLabel="Add to Wish List"
            onCancel={() => setShowSearch(false)}
          />
        )}
        {status === 'error' && errorMsg && (
          <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setStatus('idle'); setShowSearch(true) }}
      className="flex items-center gap-2 px-4 py-2.5 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors mb-6"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Find an album
    </button>
  )
}
