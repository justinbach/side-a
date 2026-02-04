'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RenameCollectionForm({
  collectionId,
  currentName,
}: {
  collectionId: string
  currentName: string
}) {
  const router = useRouter()
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() === currentName || !name.trim()) return

    setLoading(true)
    setSaved(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('collections')
      .update({ name: name.trim() })
      .eq('id', collectionId)

    setLoading(false)

    if (error) {
      console.error('Failed to rename collection:', error)
      return
    }

    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  const hasChanges = name.trim() !== currentName && name.trim() !== ''

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg border border-walnut/20 bg-cream focus:outline-none focus:ring-2 focus:ring-burnt-orange/50 text-walnut"
        placeholder="Collection name"
      />
      <button
        type="submit"
        disabled={loading || !hasChanges}
        className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : saved ? 'Saved!' : 'Save'}
      </button>
    </form>
  )
}
