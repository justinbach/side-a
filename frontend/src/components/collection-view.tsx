'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecordGrid } from './record-grid'

type Collection = {
  id: string
  name: string
  owner_id: string
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
  isOwner,
}: {
  collection: Collection
  records: Record[] | null
  isOwner: boolean
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
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-2xl text-walnut">{collection.name}</h2>
            {isOwner && (
              <Link
                href="/collection/settings"
                className="text-walnut/50 hover:text-walnut transition-colors"
                title="Collection Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
          </div>
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
