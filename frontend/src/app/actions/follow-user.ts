'use server'

import { createClient } from '@/lib/supabase/server'

export async function followUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (user.id === userId) {
    return { success: false, error: 'Cannot follow yourself' }
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id: userId })

  if (error) {
    // Handle duplicate follow attempt gracefully
    if (error.code === '23505') { // PostgreSQL unique violation
      return { success: true } // Already following, treat as success
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function unfollowUser(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
