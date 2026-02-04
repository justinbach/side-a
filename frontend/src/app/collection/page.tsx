import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { CollectionView } from '@/components/collection-view'

export default async function CollectionPage({
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

  // Accept any pending invitations for this user
  // Invitations store email as lowercase, so we lowercase the user's email to match
  const { data: pendingInvitations } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', user.email?.toLowerCase() || '')
    .is('accepted_at', null)

  if (pendingInvitations && pendingInvitations.length > 0) {
    for (const inv of pendingInvitations) {
      await supabase.rpc('accept_invitation', { invitation_id: inv.id })
    }
  }

  // Get all collections user has access to (owned or member of)
  let { data: collections } = await supabase
    .from('collections')
    .select('id, name, owner_id')
    .order('created_at', { ascending: true })

  // Create default collection if user doesn't have any
  if (!collections || collections.length === 0) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: newCollection, error } = await supabaseAdmin
      .from('collections')
      .insert({ name: 'My Collection', owner_id: user.id })
      .select('id, name, owner_id')
      .single()

    if (error) {
      console.error('Failed to create collection:', error)
      return (
        <main className="min-h-screen p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to create collection: {error.message}</p>
          </div>
        </main>
      )
    }

    collections = [newCollection]
  }

  // Find selected collection or default to first one
  let collection = selectedCollectionId
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
