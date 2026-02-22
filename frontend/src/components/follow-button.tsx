'use client'

import { useState } from 'react'
import { followUser, unfollowUser } from '@/app/actions/follow-user'

export function FollowButton({
  userId,
  initialIsFollowing,
}: {
  userId: string
  initialIsFollowing: boolean
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFollow = async () => {
    setIsLoading(true)

    // Optimistic update
    const previousState = isFollowing
    setIsFollowing(!isFollowing)

    const result = isFollowing
      ? await unfollowUser(userId)
      : await followUser(userId)

    setIsLoading(false)

    if (!result.success) {
      // Revert on error
      setIsFollowing(previousState)
      console.error('Failed to toggle follow:', result.error)
    }
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`px-6 py-2.5 rounded-xl font-medium text-base transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 ${
        isFollowing
          ? 'bg-tan text-walnut border border-walnut/20 hover:bg-tan/80'
          : 'bg-burnt-orange text-warm-white hover:bg-burnt-orange/90'
      }`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </span>
      ) : (
        isFollowing ? 'Following' : 'Follow'
      )}
    </button>
  )
}
