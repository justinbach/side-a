import Link from 'next/link'
import Image from 'next/image'

type Record = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
}

type CollectionPreviewProps = {
  records: Record[] | null
  totalCount: number
  collectionId: string
}

export function CollectionPreview({ records, totalCount, collectionId }: CollectionPreviewProps) {
  const previewRecords = records?.slice(0, 4) || []

  if (previewRecords.length === 0) {
    return (
      <div className="bg-warm-white rounded-xl border border-walnut/10 p-8 text-center">
        <p className="text-walnut/60 mb-2">Your collection is empty</p>
        <p className="text-sm text-walnut/40 mb-4">Add your first record to get started</p>
        <Link
          href={`/collection/new?collectionId=${collectionId}`}
          className="inline-block px-5 py-2.5 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors"
        >
          Add Record
        </Link>
      </div>
    )
  }

  const showOverflow = totalCount > 4
  const colCount = showOverflow ? 5 : previewRecords.length || 4

  return (
    <div className="bg-warm-white rounded-xl border border-walnut/10 p-4">
      <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
        {previewRecords.map((record) => (
          <Link
            key={record.id}
            href={`/collection/${record.id}?c=${collectionId}`}
            className="block aspect-square"
          >
            {record.cover_image_url ? (
              <Image
                src={record.cover_image_url}
                alt={record.title}
                width={72}
                height={72}
                className="w-full h-full rounded object-cover hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-full h-full rounded bg-tan flex items-center justify-center">
                <svg className="w-7 h-7 text-walnut/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </Link>
        ))}
        {showOverflow && (
          <div className="aspect-square rounded bg-tan flex items-center justify-center">
            <span className="text-sm font-medium text-walnut/60">+{totalCount - 4}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Link
          href={`/collection/browse?c=${collectionId}`}
          className="text-sm text-burnt-orange hover:text-burnt-orange/80 transition-colors"
        >
          View all {totalCount} records →
        </Link>
        <Link
          href={`/collection/new?collectionId=${collectionId}`}
          className="px-4 py-2 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors"
        >
          Add Record
        </Link>
      </div>
    </div>
  )
}
