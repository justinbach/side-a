import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { PlayButton } from '@/components/play-button'
import { NotesSection } from '@/components/notes-section'
import { FetchTracksButton } from '@/components/fetch-tracks-button'
import { ClearTracksButton } from '@/components/clear-tracks-button'
import { ReprocessImageButton } from '@/components/reprocess-image-button'
import { ReplaceImageButton } from '@/components/replace-image-button'
import { ShareButton } from '@/components/share-button'
import { MbidBackfiller } from '@/components/mbid-backfiller'

type Track = {
  position: number
  title: string
  length: number | null
}

type RecordMetadata = {
  releaseDate?: string
  label?: string
  tracks?: Track[]
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: record } = await supabase
    .from('records')
    .select('id, title, artist, cover_image_url, metadata, created_at, collection_id, mbid')
    .eq('id', id)
    .single()

  if (!record) {
    notFound()
  }

  // Check if the current user is a member of this record's collection.
  // RLS on collections only returns rows for members, so a null result means
  // the user is viewing via the social feed and has no edit rights.
  const { data: collection } = await supabase
    .from('collections')
    .select('id, owner_id')
    .eq('id', record.collection_id)
    .single()

  const isMember = !!collection
  const isOwner = collection?.owner_id === user.id

  // Fetch play history with user profiles
  const { data: plays } = await supabase
    .from('plays')
    .select('id, played_at, mood, user_id, profiles(display_name)')
    .eq('record_id', id)
    .order('played_at', { ascending: false })

  // Fetch user's note for this record
  const { data: note } = await supabase
    .from('notes')
    .select('id, star_rating, text, updated_at')
    .eq('record_id', id)
    .eq('user_id', user.id)
    .single()

  // Cross-collection stats — only when mbid is known
  let otherCollectionCount = 0
  let totalPlaysAcrossCollections = 0
  const mbid = (record as { mbid?: string | null }).mbid ?? null
  if (mbid) {
    const [{ count: otherCount }, { data: siblingRecords }] = await Promise.all([
      supabase
        .from('records')
        .select('id', { count: 'exact', head: true })
        .eq('mbid', mbid)
        .neq('id', record.id),
      supabase
        .from('records')
        .select('id')
        .eq('mbid', mbid),
    ])

    otherCollectionCount = otherCount ?? 0

    if (siblingRecords && siblingRecords.length > 0) {
      const siblingIds = siblingRecords.map((r) => r.id)
      const { count: playsCount } = await supabase
        .from('plays')
        .select('id', { count: 'exact', head: true })
        .in('record_id', siblingIds)
      totalPlaysAcrossCollections = playsCount ?? 0
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/collection"
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover Image */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="aspect-square bg-tan rounded-lg overflow-hidden shadow-md">
              {record.cover_image_url ? (
                <Image
                  src={record.cover_image_url}
                  alt={`${record.title} by ${record.artist}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-walnut/20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
            </div>
            {isOwner && record.cover_image_url && (
              <ReprocessImageButton
                recordId={record.id}
                currentImageUrl={record.cover_image_url}
              />
            )}
            {isOwner && (
              <ReplaceImageButton
                recordId={record.id}
                currentImageUrl={record.cover_image_url}
              />
            )}
          </div>

          {/* Record Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h1 className="font-serif text-4xl font-bold text-walnut">
                  {record.title}
                </h1>
              </div>
              <ShareButton
                title={`${record.title} by ${record.artist}`}
                text={`Check out ${record.title} by ${record.artist} on Side A`}
                iconOnly
              />
            </div>
            <p className="text-xl text-walnut/70">{record.artist}</p>

            <div className="mb-8">
              {/* Cross-collection stats */}
              {(otherCollectionCount > 0 || totalPlaysAcrossCollections > 0) && (
                <p className="text-sm text-walnut/40 mt-1">
                  {otherCollectionCount > 0 && `Also in ${otherCollectionCount} other collection${otherCollectionCount !== 1 ? 's' : ''}`}
                  {otherCollectionCount > 0 && totalPlaysAcrossCollections > 0 && ' · '}
                  {totalPlaysAcrossCollections > 0 && `${totalPlaysAcrossCollections} total play${totalPlaysAcrossCollections !== 1 ? 's' : ''}`}
                </p>
              )}

              {/* Silent mbid backfill for existing records without an mbid */}
              {!mbid && isMember && (
                <MbidBackfiller recordId={record.id} title={record.title} artist={record.artist} />
              )}
            </div>

            {/* Play Button with mood picker and history */}
            <div className="mb-8">
              <PlayButton recordId={record.id} initialPlays={plays || []} currentUserId={user.id} isMember={isMember} />
            </div>

            {/* Notes & Rating */}
            {isMember && (
              <div className="mb-8 p-6 bg-warm-white rounded-xl border border-walnut/10">
                <NotesSection recordId={record.id} initialNote={note} />
              </div>
            )}

            {/* Album Details */}
            {(() => {
              const metadata = record.metadata as RecordMetadata | null
              const hasDetails = metadata?.releaseDate || metadata?.label
              const hasTracks = metadata?.tracks && metadata.tracks.length > 0

              return (
                <>
                  {hasDetails && (
                    <div className="mb-6">
                      <h2 className="font-serif text-lg text-walnut mb-3">Details</h2>
                      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {metadata?.releaseDate && (
                          <div>
                            <dt className="text-walnut/50">Released</dt>
                            <dd className="text-walnut">{metadata.releaseDate.split('-')[0]}</dd>
                          </div>
                        )}
                        {metadata?.label && (
                          <div>
                            <dt className="text-walnut/50">Label</dt>
                            <dd className="text-walnut">{metadata.label}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Track List */}
                  {hasTracks ? (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="font-serif text-lg text-walnut">Track List</h2>
                        {isMember && <ClearTracksButton recordId={record.id} />}
                      </div>
                      <ol className="space-y-1">
                        {metadata!.tracks!.map((track) => (
                          <li key={track.position} className="flex items-center text-sm py-1.5 border-b border-walnut/5 last:border-0">
                            <span className="w-8 text-walnut/40 tabular-nums">{track.position}.</span>
                            <span className="flex-1 text-walnut">{track.title}</span>
                            {track.length && (
                              <span className="text-walnut/40 tabular-nums">{formatDuration(track.length)}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : isMember ? (
                    <div className="mb-8">
                      <FetchTracksButton
                        recordId={record.id}
                        title={record.title}
                        artist={record.artist}
                      />
                    </div>
                  ) : null}
                </>
              )
            })()}

            {/* Actions */}
            {isOwner && (
              <div className="pt-6 border-t border-walnut/10">
                <DeleteRecordButton recordId={record.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
