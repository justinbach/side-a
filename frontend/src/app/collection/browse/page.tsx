import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CollectionView } from '@/components/collection-view'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c: selectedCollectionId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all collections user has access to
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, owner_id')
    .order('created_at', { ascending: true })

  if (!collections || collections.length === 0) {
    redirect('/collection')
  }

  // Find selected collection or default to first one
  const collection = selectedCollectionId
    ? collections.find(c => c.id === selectedCollectionId) || collections[0]
    : collections[0]

  // Fetch records
  const { data: records } = await supabase
    .from('records')
    .select('id, title, artist, cover_image_url, created_at')
    .eq('collection_id', collection.id)
    .order('created_at', { ascending: false })

  // Fetch all plays for records in this collection (for filtering/sorting)
  const recordIds = records?.map(r => r.id) || []
  let plays = null
  if (recordIds.length > 0) {
    const { data } = await supabase
      .from('plays')
      .select('record_id, played_at, mood')
      .in('record_id', recordIds)
      .order('played_at', { ascending: false })
    plays = data
  }

  const isOwner = collection.owner_id === user.id

  return (
    <CollectionView
      collection={collection}
      allCollections={collections}
      records={records}
      plays={plays}
      isOwner={isOwner}
    />
  )
}
