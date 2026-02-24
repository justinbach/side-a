'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type MusicBrainzSearchResult = {
  mbid: string
  title: string
  artist: string
  releaseDate: string | null
  label: string | null
  trackCount: number
}

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

type Phase =
  | { name: 'idle' }
  | { name: 'loading-results' }
  | { name: 'results'; results: MusicBrainzSearchResult[] }
  | { name: 'loading-detail'; mbid: string }
  | { name: 'preview'; release: MusicBrainzRelease }

export function AlbumSearch({
  onSelect,
  actionLabel,
  onCancel,
}: {
  onSelect: (release: MusicBrainzRelease) => void
  actionLabel: string
  onCancel?: () => void
}) {
  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setPhase({ name: 'idle' })
      return
    }
    setError(null)
    setPhase({ name: 'loading-results' })
    try {
      const res = await fetch(`${backendUrl}/api/catalog-search?q=${encodeURIComponent(q)}`)
      const data = await res.json() as { results: MusicBrainzSearchResult[] }
      setPhase({ name: 'results', results: data.results || [] })
    } catch {
      setError('Search failed. Please try again.')
      setPhase({ name: 'idle' })
    }
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 400)
  }

  const handleSearchClick = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    runSearch(query)
  }

  const handleResultClick = async (result: MusicBrainzSearchResult) => {
    setPhase({ name: 'loading-detail', mbid: result.mbid })
    try {
      const res = await fetch(`${backendUrl}/api/catalog-search/${result.mbid}`)
      const data = await res.json() as { release: MusicBrainzRelease | null }
      if (data.release) {
        setPhase({ name: 'preview', release: data.release })
      } else {
        setError('Could not load album details.')
        setPhase({ name: 'results', results: phase.name === 'loading-detail' ? [] : (phase as { name: 'results'; results: MusicBrainzSearchResult[] }).results })
      }
    } catch {
      setError('Could not load album details.')
    }
  }

  const handleBack = () => {
    setPhase({ name: 'idle' })
    setQuery('')
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Search bar — always visible unless in preview */}
      {phase.name !== 'preview' && (
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            placeholder="Search by title or artist..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 text-walnut placeholder:text-walnut/40 text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={phase.name === 'loading-results'}
            className="px-4 py-2.5 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors disabled:opacity-50"
          >
            Search
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Loading results */}
      {phase.name === 'loading-results' && (
        <div className="flex items-center gap-2 py-4 text-walnut/60">
          <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Searching catalog...</span>
        </div>
      )}

      {/* Results list */}
      {phase.name === 'results' && (
        <>
          {phase.results.length === 0 ? (
            <p className="text-sm text-walnut/60 py-2">No results found. Try a different search.</p>
          ) : (
            <div className="divide-y divide-walnut/10 border border-walnut/10 rounded-lg overflow-hidden">
              {phase.results.map((result) => (
                <button
                  key={result.mbid}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 bg-warm-white hover:bg-tan/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-walnut text-sm truncate">{result.title}</p>
                      <p className="text-walnut/60 text-xs truncate">{result.artist}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {result.releaseDate && (
                        <p className="text-xs text-walnut/60">{result.releaseDate.split('-')[0]}</p>
                      )}
                      {result.trackCount > 0 && (
                        <p className="text-xs text-walnut/40">{result.trackCount} tracks</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Loading detail */}
      {phase.name === 'loading-detail' && (
        <div className="flex items-center gap-2 py-4 text-walnut/60">
          <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading album details...</span>
        </div>
      )}

      {/* Preview card */}
      {phase.name === 'preview' && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-burnt-orange hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to results
          </button>

          <div className="bg-warm-white rounded-xl border border-walnut/10 p-4">
            <div className="flex gap-4">
              {phase.release.coverArtUrl ? (
                <Image
                  src={phase.release.coverArtUrl}
                  alt={phase.release.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-tan flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-walnut text-lg leading-tight">{phase.release.title}</p>
                <p className="text-walnut/70 text-sm mt-0.5">{phase.release.artist}</p>
                {phase.release.releaseDate && (
                  <p className="text-walnut/50 text-xs mt-1">
                    {phase.release.releaseDate.split('-')[0]}
                    {phase.release.label && ` · ${phase.release.label}`}
                  </p>
                )}
                <p className="text-walnut/40 text-xs mt-0.5">{phase.release.trackCount} tracks</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSelect(phase.release)}
              className="flex-1 py-2.5 px-4 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors"
            >
              {actionLabel}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 border border-walnut/20 text-walnut rounded-lg text-sm hover:bg-tan/50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel button when idle/searching */}
      {phase.name !== 'preview' && onCancel && (
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-walnut/60 hover:text-walnut transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
