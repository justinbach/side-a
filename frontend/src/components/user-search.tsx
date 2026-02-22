'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FollowButton } from './follow-button'

type User = {
  id: string
  display_name: string | null
  email: string
}

type UserWithFollowStatus = User & {
  isFollowing: boolean
}

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<UserWithFollowStatus[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        // Search for users by email
        const { data: users } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .ilike('email', `%${searchTerm}%`)
          .neq('id', currentUserId) // Exclude current user
          .limit(10)

        if (users && users.length > 0) {
          // Check follow status for each user
          const { data: follows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
            .in('following_id', users.map(u => u.id))

          const followingIds = new Set(follows?.map(f => f.following_id) || [])

          setResults(users.map(user => ({
            ...user,
            isFollowing: followingIds.has(user.id),
          })))
        } else {
          setResults([])
        }
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, currentUserId])

  return (
    <div>
      <h2 className="font-serif text-xl text-walnut mb-4">Find Users</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by email..."
        className="w-full px-4 py-3 bg-warm-white rounded-xl border border-walnut/10 text-walnut placeholder:text-walnut/40 focus:outline-none focus:ring-2 focus:ring-burnt-orange/20 focus:border-burnt-orange/30 transition-all"
      />

      {loading && (
        <div className="mt-4 text-center text-walnut/50">
          <div className="inline-block w-5 h-5 border-2 border-walnut/20 border-t-burnt-orange rounded-full animate-spin" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((user) => (
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
      )}

      {!loading && searchTerm && results.length === 0 && (
        <div className="mt-4 text-center text-walnut/50 p-8 bg-warm-white rounded-xl border border-walnut/10">
          No users found matching &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}
