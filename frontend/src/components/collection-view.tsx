'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RecordGrid } from './record-grid'

type NowPlayingRecord = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
  collection_id: string
}

type NowPlayingPlay = {
  id: string
  played_at: string
  mood: string | null
  records: NowPlayingRecord | NowPlayingRecord[] | null
}


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
  nowPlaying,
}: {
  collection: Collection
  allCollections: Collection[]
  records: Record[] | null
  plays: Play[] | null
  isOwner: boolean
  nowPlaying?: NowPlayingPlay | null
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [moodFilter, setMoodFilter] = useState<string | null>(null)

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
    <main className="min-h-screen p-8 pb-24">
      <header className="max-w-5xl mx-auto mb-8">
        {/* Collection name/dropdown + Add Record */}
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            {allCollections.length > 1 ? (
              <select
                value={collection.id}
                onChange={(e) => router.push(`/collection/browse?c=${e.target.value}`)}
                className="font-serif text-2xl text-walnut bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-8 min-w-0 max-w-full"
                style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A3728' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', backgroundSize: '1.25rem' }}
              >
                {allCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <h2 className="font-serif text-2xl text-walnut truncate">{collection.name}</h2>
            )}
          </div>
          <Link
            href={`/collection/new?collectionId=${collection.id}`}
            className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Add Record
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto">
        {/* Now Spinning banner — current user's active play */}
        {(() => {
          const nowPlayingRecord = nowPlaying
            ? (Array.isArray(nowPlaying.records) ? nowPlaying.records[0] : nowPlaying.records)
            : null
          return nowPlaying && nowPlayingRecord ? (
            <Link href={`/collection/${nowPlayingRecord.id}?c=${nowPlayingRecord.collection_id}`} className="block mb-6">
              <div className="flex items-center gap-3 bg-warm-white border border-burnt-orange/20 rounded-xl px-4 py-3">
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-burnt-orange opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-burnt-orange" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-walnut truncate">{nowPlayingRecord.title}</p>
                  <p className="text-xs text-walnut/60 truncate">{nowPlayingRecord.artist}</p>
                </div>
                <span className="text-xs text-walnut/40 flex-shrink-0">Now spinning →</span>
              </div>
            </Link>
          ) : null
        })()}

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
