'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
      <header className="max-w-5xl mx-auto mb-8">
        {/* Row 1: Logo + nav icons + Sign Out */}
        <div className="flex justify-between items-center mb-4">
          <Link href="/collection" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Side A" width={40} height={40} />
            <span className="font-serif text-3xl font-bold text-walnut">Side A</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/feed"
              className="text-walnut/50 hover:text-walnut transition-colors p-1"
              title="Activity Feed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </Link>
            <Link
              href={`/collection/stats?c=${collection.id}`}
              className="text-walnut/50 hover:text-walnut transition-colors p-1"
              title="Listening Stats"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
            {isOwner && (
              <Link
                href={`/collection/settings?c=${collection.id}`}
                className="text-walnut/50 hover:text-walnut transition-colors p-1"
                title="Collection Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-walnut/60 hover:text-walnut transition-colors ml-1"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Row 2: Collection name/dropdown + Add Record */}
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
        {/* Back to Home link */}
        <div className="mb-6">
          <Link
            href="/collection"
            className="text-sm text-walnut/50 hover:text-walnut transition-colors"
          >
            ← Home
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
