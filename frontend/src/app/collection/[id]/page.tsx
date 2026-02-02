import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { DeleteRecordButton } from '@/components/delete-record-button'
import { PlayButton } from '@/components/play-button'
import { NotesSection } from '@/components/notes-section'

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
    .select('id, title, artist, cover_image_url, metadata, created_at, collection_id')
    .eq('id', id)
    .single()

  if (!record) {
    notFound()
  }

  // Fetch play history
  const { data: plays } = await supabase
    .from('plays')
    .select('id, played_at, mood')
    .eq('record_id', id)
    .order('played_at', { ascending: false })

  // Fetch user's note for this record
  const { data: note } = await supabase
    .from('notes')
    .select('id, star_rating, text, updated_at')
    .eq('record_id', id)
    .eq('user_id', user.id)
    .single()

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
          </div>

          {/* Record Info */}
          <div className="flex-1">
            <h1 className="font-serif text-4xl font-bold text-walnut mb-2">
              {record.title}
            </h1>
            <p className="text-xl text-walnut/70 mb-8">{record.artist}</p>

            {/* Play Button with mood picker and history */}
            <div className="mb-8">
              <PlayButton recordId={record.id} initialPlays={plays || []} />
            </div>

            {/* Notes & Rating */}
            <div className="mb-8 p-6 bg-warm-white rounded-xl border border-walnut/10">
              <NotesSection recordId={record.id} initialNote={note} />
            </div>

            {/* Metadata */}
            {record.metadata && Object.keys(record.metadata).length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-lg text-walnut mb-3">Details</h2>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(record.metadata as Record<string, string>).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-walnut/50 capitalize">{key}</dt>
                      <dd className="text-walnut">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-walnut/10">
              <DeleteRecordButton recordId={record.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
