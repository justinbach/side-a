'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { removeFromWishList, promoteToCollection } from '@/app/actions/wish-list'

type WishListItemData = {
  id: string
  mbid: string
  title: string
  artist: string
  cover_art_url: string | null
  release_date: string | null
  track_count: number
}

type Collection = {
  id: string
  name: string
}

export function WishListItem({
  item,
  collections,
}: {
  item: WishListItemData
  collections: Collection[]
}) {
  const router = useRouter()
  const [fading, setFading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '')
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)

  const handleRemove = async () => {
    setFading(true)
    const result = await removeFromWishList(item.id)
    if (!result.success) {
      setFading(false)
      setError(result.error || 'Failed to remove')
      return
    }
    router.refresh()
  }

  const handlePromote = async (collectionId: string) => {
    setFading(true)
    const result = await promoteToCollection(item.id, collectionId)
    if (!result.success) {
      setFading(false)
      setError(result.error || 'Failed to add to collection')
      return
    }
    router.refresh()
  }

  const handleAddToCollection = () => {
    if (collections.length === 1) {
      handlePromote(collections[0].id)
    } else {
      setShowCollectionPicker(true)
    }
  }

  const year = item.release_date ? item.release_date.split('-')[0] : null

  return (
    <div
      className={`bg-warm-white rounded-xl border border-walnut/10 p-4 transition-opacity duration-300 ${fading ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Cover thumbnail */}
        {item.cover_art_url ? (
          <Image
            src={item.cover_art_url}
            alt={item.title}
            width={48}
            height={48}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded bg-tan flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* Album info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-walnut truncate">{item.title}</p>
          <p className="text-sm text-walnut/60 truncate">{item.artist}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {year && <span className="text-xs text-walnut/40">{year}</span>}
            {item.track_count > 0 && (
              <span className="text-xs text-walnut/40">{item.track_count} tracks</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleRemove}
            title="Remove from wish list"
            className="p-1.5 text-walnut/40 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      {/* Add to Collection */}
      <div className="mt-3 pt-3 border-t border-walnut/5">
        {showCollectionPicker ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 text-walnut"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handlePromote(selectedCollectionId)}
              className="px-3 py-1.5 bg-burnt-orange text-warm-white rounded-lg text-xs font-medium hover:bg-burnt-orange/90 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCollectionPicker(false)}
              className="px-3 py-1.5 border border-walnut/20 text-walnut rounded-lg text-xs hover:bg-tan/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddToCollection}
            className="text-sm text-burnt-orange hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Collection
          </button>
        )}
      </div>
    </div>
  )
}
