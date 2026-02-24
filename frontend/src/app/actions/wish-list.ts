'use server'

import { createClient } from '@/lib/supabase/server'

type MusicBrainzRelease = {
  id: string
  title: string
  artist: string
  releaseDate: string | null
  label: string | null
  country: string | null
  trackCount: number
  tracks: { position: number; title: string; length: number | null }[]
  coverArtUrl: string | null
}

export async function addToWishList(release: MusicBrainzRelease): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('wish_list_items')
    .upsert(
      {
        user_id: user.id,
        mbid: release.id,
        title: release.title,
        artist: release.artist,
        cover_art_url: release.coverArtUrl,
        release_date: release.releaseDate,
        label: release.label,
        track_count: release.trackCount,
        tracks: release.tracks,
      },
      { onConflict: 'user_id,mbid' }
    )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function removeFromWishList(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('wish_list_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function promoteToCollection(
  id: string,
  collectionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  // Fetch the wish list item
  const { data: item, error: fetchError } = await supabase
    .from('wish_list_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !item) return { success: false, error: 'Wish list item not found' }

  // Insert into records
  const { error: insertError } = await supabase
    .from('records')
    .insert({
      collection_id: collectionId,
      title: item.title,
      artist: item.artist,
      cover_image_url: item.cover_art_url,
      mbid: item.mbid,
      metadata: {
        releaseDate: item.release_date,
        label: item.label,
        tracks: item.tracks,
      },
    })

  if (insertError) return { success: false, error: insertError.message }

  // Remove from wish list (best-effort — don't fail if this errors)
  const { error: deleteError } = await supabase
    .from('wish_list_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Failed to remove wish list item after promotion:', deleteError.message)
  }

  return { success: true }
}
