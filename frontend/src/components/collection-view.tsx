'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecordGrid } from './record-grid'

type Collection = {
  id: string
  name: string
  owner_id: string
}

type Play = {
  record_id: string
  played_at: string
  mood: string | null
}

type Record = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
  created_at: string
}

const MOODS = [
  { value: 'Morning', emoji: '🌅' },
  { value: 'Cocktail Hour', emoji: '🍸' },
  { value: 'Dinner', emoji: '🍽️' },
  { value: 'Late Night', emoji: '🌙' },
  { value: 'Background', emoji: '🎧' },
  { value: 'Weekend', emoji: '☀️' },
] as const

type SortOption = 'date_desc' | 'date_asc' | 'title' | 'artist' | 'recently_played'

export function CollectionView({
  collection,
  allCollections,
  records,
  plays,
  isOwner,
}: {
  collection: Collection
  allCollections: Collection[]
  records: Record[] | null
  plays: Play[] | null
  isOwner: boolean
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [moodFilter, setMoodFilter] = useState<string | null>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get most recent play date for each record
  const lastPlayedMap = useMemo(() => {
    const map = new Map<string, string>()
    if (plays) {
      for (const play of plays) {
        const existing = map.get(play.record_id)
        if (!existing || play.played_at > existing) {
          map.set(play.record_id, play.played_at)
        }
      }
    }
    return map
  }, [plays])

  // Get records that have been played with a specific mood
  const recordsWithMood = useMemo(() => {
    if (!moodFilter || !plays) return null
    const recordIds = new Set<string>()
    for (const play of plays) {
      if (play.mood === moodFilter) {
        recordIds.add(play.record_id)
      }
    }
    return recordIds
  }, [plays, moodFilter])

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    if (!records) return []

    let result = [...records]

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.artist.toLowerCase().includes(searchLower)
      )
    }

    // Apply mood filter
    if (recordsWithMood) {
      result = result.filter((r) => recordsWithMood.has(r.id))
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'artist':
          return a.artist.localeCompare(b.artist)
        case 'recently_played':
          const aPlayed = lastPlayedMap.get(a.id) || ''
          const bPlayed = lastPlayedMap.get(b.id) || ''
          return bPlayed.localeCompare(aPlayed)
        default:
          return 0
      }
    })

    return result
  }, [records, search, sortBy, recordsWithMood, lastPlayedMap])

  const hasFilters = search.trim() || moodFilter

  return (
    <main className="min-h-screen p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
        <h1 className="font-serif text-3xl font-bold text-walnut">Side A</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-walnut/60 hover:text-walnut transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {allCollections.length > 1 ? (
              <select
                value={collection.id}
                onChange={(e) => router.push(`/collection?c=${e.target.value}`)}
                className="font-serif text-2xl text-walnut bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-8 -mr-4"
                style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A3728' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '1.25rem' }}
              >
                {allCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="font-serif text-2xl text-walnut">{collection.name}</h2>
            )}
            {isOwner && (
              <Link
                href={`/collection/settings?c=${collection.id}`}
                className="text-walnut/50 hover:text-walnut transition-colors"
                title="Collection Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
          </div>
          <Link
            href={`/collection/new?collectionId=${collection.id}`}
            className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors"
          >
            Add Record
          </Link>
        </div>

        {/* Search, Sort, Filter Controls */}
        {records && records.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-walnut/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or artist..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 text-walnut placeholder:text-walnut/40"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-walnut/40 hover:text-walnut"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 text-walnut"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="artist">Artist A-Z</option>
                <option value="recently_played">Recently Played</option>
              </select>
            </div>

            {/* Mood Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-walnut/60 py-1">Filter by mood:</span>
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setMoodFilter(moodFilter === mood.value ? null : mood.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    moodFilter === mood.value
                      ? 'bg-burnt-orange text-warm-white'
                      : 'bg-tan/50 text-walnut hover:bg-tan'
                  }`}
                >
                  {mood.emoji} {mood.value}
                </button>
              ))}
              {moodFilter && (
                <button
                  onClick={() => setMoodFilter(null)}
                  className="px-3 py-1 rounded-full text-sm text-walnut/60 hover:text-walnut"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {records && records.length > 0 ? (
          <>
            {filteredRecords.length > 0 ? (
              <>
                {hasFilters && (
                  <p className="text-sm text-walnut/60 mb-4">
                    Showing {filteredRecords.length} of {records.length} records
                  </p>
                )}
                <RecordGrid records={filteredRecords} />
              </>
            ) : (
              <div className="bg-warm-white rounded-lg border border-walnut/10 p-12 text-center">
                <p className="text-walnut/60 mb-4">No records match your search</p>
                <button
                  onClick={() => {
                    setSearch('')
                    setMoodFilter(null)
                  }}
                  className="text-burnt-orange hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-warm-white rounded-lg border border-walnut/10 p-12 text-center">
            <p className="text-walnut/60 mb-4">Your collection is empty</p>
            <p className="text-sm text-walnut/40 mb-6">
              Add your first vinyl record to get started
            </p>
            <Link
              href={`/collection/new?collectionId=${collection.id}`}
              className="inline-block px-6 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors"
            >
              Add Your First Record
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
