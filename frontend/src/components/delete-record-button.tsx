'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DeleteRecordButton({ recordId }: { recordId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('Failed to delete record:', error)
      setLoading(false)
      setConfirming(false)
      return
    }

    router.push('/collection')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-walnut/60">Delete this record?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-4 py-2 border border-walnut/20 text-walnut rounded-lg text-sm font-medium hover:bg-tan/50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-walnut/50 hover:text-red-600 transition-colors"
    >
      Delete Record
    </button>
  )
}
