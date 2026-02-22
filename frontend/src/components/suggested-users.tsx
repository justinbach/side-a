import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FollowButton } from './follow-button'

export async function SuggestedUsers({ currentUserId }: { currentUserId: string }) {
  const supabase = await createClient()

  // Get all collection IDs the current user is a member of
  const { data: myCollections } = await supabase
    .from('collection_members')
    .select('collection_id')
    .eq('user_id', currentUserId)

  const collectionIds = myCollections?.map(c => c.collection_id) || []

  if (collectionIds.length === 0) {
    return (
      <div className="text-center text-walnut/50 p-8 bg-warm-white rounded-xl border border-walnut/10">
        <p>No suggestions yet</p>
        <p className="text-sm mt-2">Join or create shared collections to discover users</p>
      </div>
    )
  }

  // Get other members from those collections
  const { data: collectionMembers } = await supabase
    .from('collection_members')
    .select('user_id, profiles(id, display_name, email)')
    .in('collection_id', collectionIds)
    .neq('user_id', currentUserId)

  if (!collectionMembers || collectionMembers.length === 0) {
    return (
      <div className="text-center text-walnut/50 p-8 bg-warm-white rounded-xl border border-walnut/10">
        No other members in your collections yet
      </div>
    )
  }

  // Deduplicate users (same user might be in multiple collections)
  const uniqueUsers = Array.from(
    new Map(
      collectionMembers
        .map(cm => {
          const profile = Array.isArray(cm.profiles) ? cm.profiles[0] : cm.profiles
          return profile ? [profile.id, profile] : null
        })
        .filter((entry): entry is [string, { id: string; display_name: string | null; email: string }] => entry !== null)
    ).values()
  )

  // Check which users are already followed
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
    .in('following_id', uniqueUsers.map(u => u.id))

  const followingIds = new Set(follows?.map(f => f.following_id) || [])

  const usersWithFollowStatus = uniqueUsers.map(user => ({
    ...user,
    isFollowing: followingIds.has(user.id),
  }))

  return (
    <div className="space-y-2">
      {usersWithFollowStatus.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 bg-warm-white rounded-xl border border-walnut/10"
        >
          <Link href={`/profile/${user.id}`} className="flex-1 min-w-0">
            <p className="font-medium text-walnut hover:text-burnt-orange transition-colors truncate">
              {user.display_name || 'Unknown User'}
            </p>
            <p className="text-sm text-walnut/60 truncate">{user.email}</p>
          </Link>
          <div className="ml-4">
            <FollowButton userId={user.id} initialIsFollowing={user.isFollowing} />
          </div>
        </div>
      ))}
    </div>
  )
}
