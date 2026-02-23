'use server'

import { createClient } from '@/lib/supabase/server'

export async function backfillMbid({
  recordId,
  title,
  artist,
}: {
  recordId: string
  title: string
  artist: string
}): Promise<string | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist }),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data.success || !data.metadata?.id) return null

    const mbid: string = data.metadata.id

    const supabase = await createClient()
    await supabase.from('records').update({ mbid }).eq('id', recordId)

    return mbid
  } catch {
    return null
  }
}
