'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Member = {
  id: string
  role: 'owner' | 'member'
  user_id: string
  created_at: string
}

export function MembersList({
  members,
  currentUserId,
  ownerId,
  collectionId,
  isOwner,
}: {
  members: Member[]
  currentUserId: string
  ownerId: string
  collectionId: string
  isOwner: boolean
}) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (memberId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    setRemovingId(memberId)
    const supabase = createClient()

    const { error } = await supabase
      .from('collection_members')
      .delete()
      .eq('id', memberId)

    setRemovingId(null)

    if (error) {
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
      return
    }

    router.refresh()
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this collection?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('collection_members')
      .delete()
      .eq('collection_id', collectionId)
      .eq('user_id', currentUserId)

    if (error) {
      console.error('Failed to leave collection:', error)
      alert('Failed to leave collection')
      return
    }

    router.push('/collection')
    router.refresh()
  }

  return (
    <div className="bg-warm-white rounded-xl border border-walnut/10 divide-y divide-walnut/10">
      {members.map((member) => {
        const isCurrentUser = member.user_id === currentUserId
        const isMemberOwner = member.user_id === ownerId

        return (
          <div key={member.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tan flex items-center justify-center">
                <svg className="w-5 h-5 text-walnut/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-walnut">
                  {isCurrentUser ? 'You' : `User ${member.user_id.slice(0, 8)}...`}
                </p>
                <p className="text-sm text-walnut/50 capitalize">{member.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMemberOwner && (
                <span className="text-sm text-burnt-orange bg-burnt-orange/10 px-3 py-1 rounded-full">
                  Owner
                </span>
              )}
              {!isMemberOwner && isOwner && !isCurrentUser && (
                <button
                  onClick={() => handleRemove(member.id, member.user_id)}
                  disabled={removingId === member.id}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {removingId === member.id ? 'Removing...' : 'Remove'}
                </button>
              )}
              {!isMemberOwner && isCurrentUser && (
                <button
                  onClick={handleLeave}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Leave
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
