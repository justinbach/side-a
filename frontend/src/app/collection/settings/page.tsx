import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { InviteMemberForm } from '@/components/invite-member-form'
import { MembersList } from '@/components/members-list'
import { RenameCollectionForm } from '@/components/rename-collection-form'

export default async function CollectionSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c: collectionId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the specified collection or fall back to user's owned collection
  let collection
  if (collectionId) {
    const { data } = await supabase
      .from('collections')
      .select('id, name, owner_id')
      .eq('id', collectionId)
      .single()
    collection = data
  } else {
    const { data } = await supabase
      .from('collections')
      .select('id, name, owner_id')
      .eq('owner_id', user.id)
      .single()
    collection = data
  }

  if (!collection) {
    redirect('/collection')
  }

  // Only owners can access settings
  const isOwner = collection.owner_id === user.id
  if (!isOwner) {
    redirect(`/collection?c=${collection.id}`)
  }

  // Get current members
  const { data: membersData } = await supabase
    .from('collection_members')
    .select(`
      id,
      role,
      user_id,
      created_at
    `)
    .eq('collection_id', collection.id)

  // Fetch user emails using admin client
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const members = await Promise.all(
    (membersData || []).map(async (member) => {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
      return {
        ...member,
        email: userData?.user?.email || null,
      }
    })
  )

  // Get pending invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, email, created_at, accepted_at')
    .eq('collection_id', collection.id)
    .is('accepted_at', null)

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/collection?c=${collection.id}`}
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>

        <h1 className="font-serif text-3xl font-bold text-walnut mb-8">Collection Settings</h1>

        {/* Collection Name */}
        <section className="mb-10">
          <h2 className="font-serif text-xl text-walnut mb-4">Collection Name</h2>
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-6">
            <RenameCollectionForm collectionId={collection.id} currentName={collection.name} />
          </div>
        </section>

        {/* Invite Section */}
        {isOwner && (
          <section className="mb-10">
            <h2 className="font-serif text-xl text-walnut mb-4">Invite Someone</h2>
            <div className="bg-warm-white rounded-xl border border-walnut/10 p-6">
              <p className="text-sm text-walnut/60 mb-4">
                Share your collection with friends and family. They will be able to view, add records, and log plays.
              </p>
              <InviteMemberForm collectionId={collection.id} collectionName={collection.name} />
            </div>
          </section>
        )}

        {/* Pending Invitations */}
        {isOwner && invitations && invitations.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl text-walnut mb-4">Pending Invitations</h2>
            <div className="bg-warm-white rounded-xl border border-walnut/10 divide-y divide-walnut/10">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-walnut">{inv.email}</p>
                    <p className="text-sm text-walnut/50">
                      Invited {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm text-mustard bg-mustard/10 px-3 py-1 rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Current Members */}
        <section>
          <h2 className="font-serif text-xl text-walnut mb-4">Members</h2>
          <MembersList
            members={members || []}
            currentUserId={user.id}
            ownerId={collection.owner_id}
            collectionId={collection.id}
            isOwner={isOwner}
          />
        </section>
      </div>
    </main>
  )
}
