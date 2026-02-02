'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecordGrid } from './record-grid'

type Collection = {
  id: string
  name: string
}

type Record = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
  created_at: string
}

export function CollectionView({
  collection,
  records,
}: {
  collection: Collection
  records: Record[] | null
}) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
        <h1 className="font-serif text-3xl font-bold text-walnut">Side A</h1>
        <button
          onClick={handleSignOut}
          className="text-sm text-walnut/60 hover:text-walnut transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif text-2xl text-walnut">My Collection</h2>
          <Link
            href={`/collection/new?collectionId=${collection.id}`}
            className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors"
          >
            Add Record
          </Link>
        </div>

        {records && records.length > 0 ? (
          <RecordGrid records={records} />
        ) : (
          <div className="bg-warm-white rounded-lg border border-walnut/10 p-12 text-center">
            <p className="text-walnut/60 mb-4">Your collection is empty</p>
            <p className="text-sm text-walnut/40 mb-6">
              Add your first vinyl record to get started
            </p>
            <Link
              href={`/collection/new?collectionId=${collection.id}`}
              className="inline-block px-6 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors"
            >
              Add Your First Record
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
