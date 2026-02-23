import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PickResults } from '@/components/pick-results'

const MOODS = [
  { value: 'Morning', emoji: '🌅' },
  { value: 'Cocktail Hour', emoji: '🍸' },
  { value: 'Dinner', emoji: '🍽️' },
  { value: 'Late Night', emoji: '🌙' },
  { value: 'Background', emoji: '🎧' },
  { value: 'Weekend', emoji: '☀️' },
] as const

type MoodValue = typeof MOODS[number]['value']

// Rich context strings sent to Claude — frontend owns this mapping
const MOOD_CONTEXTS: Record<MoodValue, string> = {
  Morning: 'morning listening — gentle, warm, unhurried; coffee and quiet',
  'Cocktail Hour': 'cocktail hour — sophisticated, jazz-friendly, convivial pre-dinner vibes',
  Dinner: 'dinner — elegant background music that enhances conversation without demanding attention',
  'Late Night': 'late night — intimate, atmospheric, introspective; the day winding down',
  Background: 'background listening — unobtrusive, pleasant, works while focused on other things',
  Weekend: 'weekend — relaxed, feel-good, no agenda; anything goes',
}

type RecordRow = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
  moodPlayCount?: number
}

export default async function PickPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; mood?: string; context?: string }>
}) {
  const { c: collectionId, mood: moodParam, context: contextParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validate mood param
  const selectedMood = MOODS.find(m => m.value === moodParam)?.value ?? null

  // --- Mood picker (no mood selected) ---
  if (!selectedMood) {
    return (
      <main className="min-h-screen p-8">
        <header className="max-w-lg mx-auto flex items-center gap-3 mb-10">
          <Link href={collectionId ? `/collection/browse?c=${collectionId}` : '/collection'} className="text-walnut/50 hover:text-walnut transition-colors">
            ←
          </Link>
          <Link href="/collection" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Side A" width={32} height={32} />
          </Link>
          <h1 className="font-serif text-2xl font-bold text-walnut">What vibe are we going for?</h1>
        </header>

        <div className="max-w-lg mx-auto">
          <p className="text-walnut/60 mb-8 text-sm">Pick the mood and we&apos;ll suggest something from your collection.</p>
          <div className="grid grid-cols-2 gap-3">
            {MOODS.map(({ value, emoji }) => {
              const context = encodeURIComponent(MOOD_CONTEXTS[value])
              const href = `/collection/pick?c=${collectionId ?? ''}&mood=${encodeURIComponent(value)}&context=${context}`
              return (
                <Link
                  key={value}
                  href={href}
                  className="flex flex-col items-center gap-3 p-6 bg-warm-white rounded-2xl border border-walnut/10 hover:border-burnt-orange/30 hover:shadow-sm transition-all"
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className="text-sm font-medium text-walnut text-center">{value}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    )
  }

  // --- Recommendations page (mood selected) ---
  if (!collectionId) redirect('/collection')

  // Fetch all records in this collection
  const { data: records } = await supabase
    .from('records')
    .select('id, title, artist, cover_image_url')
    .eq('collection_id', collectionId)
    .order('title', { ascending: true })

  if (!records || records.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-lg mx-auto">
          <Link href={`/collection/pick?c=${collectionId}`} className="text-walnut/50 hover:text-walnut transition-colors text-sm">
            ← Back
          </Link>
          <p className="mt-8 text-walnut/60">No records in this collection yet.</p>
        </div>
      </main>
    )
  }

  // Fetch all plays for this mood across the collection
  const recordIds = records.map(r => r.id)
  const { data: moodPlays } = await supabase
    .from('plays')
    .select('record_id')
    .eq('mood', selectedMood)
    .in('record_id', recordIds)

  // Build play count map
  const playCountMap = new Map<string, number>()
  for (const play of moodPlays ?? []) {
    playCountMap.set(play.record_id, (playCountMap.get(play.record_id) ?? 0) + 1)
  }

  // Tier 1: records with ≥1 mood-match play, sorted by count desc, top 5
  const tier1: RecordRow[] = records
    .filter(r => (playCountMap.get(r.id) ?? 0) > 0)
    .sort((a, b) => (playCountMap.get(b.id) ?? 0) - (playCountMap.get(a.id) ?? 0))
    .slice(0, 5)
    .map(r => ({ ...r, moodPlayCount: playCountMap.get(r.id) ?? 0 }))

  // Tier 2 candidates: records with 0 mood-match plays, capped at 30
  const tier2Candidates: RecordRow[] = records
    .filter(r => (playCountMap.get(r.id) ?? 0) === 0)
    .slice(0, 30)

  const moodEmoji = MOODS.find(m => m.value === selectedMood)?.emoji ?? ''
  const context = contextParam ? decodeURIComponent(contextParam) : MOOD_CONTEXTS[selectedMood]

  return (
    <main className="min-h-screen p-8">
      <header className="max-w-lg mx-auto flex items-center gap-3 mb-8">
        <Link href={`/collection/pick?c=${collectionId}`} className="text-walnut/50 hover:text-walnut transition-colors">
          ←
        </Link>
        <span className="text-2xl">{moodEmoji}</span>
        <h1 className="font-serif text-xl font-bold text-walnut">{selectedMood}</h1>
      </header>

      <div className="max-w-lg mx-auto">
        <PickResults
          tier1={tier1}
          tier2Candidates={tier2Candidates}
          mood={selectedMood}
          context={context}
          collectionId={collectionId}
          currentUserId={user.id}
        />
      </div>
    </main>
  )
}
