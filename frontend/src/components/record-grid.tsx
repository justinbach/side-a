'use client'

import Image from 'next/image'
import Link from 'next/link'

type Record = {
  id: string
  title: string
  artist: string
  cover_image_url: string | null
  created_at: string
}

export function RecordGrid({ records }: { records: Record[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {records.map((record) => (
        <Link
          key={record.id}
          href={`/collection/${record.id}`}
          className="group"
        >
          <div className="aspect-square bg-tan rounded-lg overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition-shadow">
            {record.cover_image_url ? (
              <Image
                src={record.cover_image_url}
                alt={`${record.title} by ${record.artist}`}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-walnut/20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="font-serif text-walnut font-medium truncate group-hover:text-burnt-orange transition-colors">
            {record.title}
          </h3>
          <p className="text-sm text-walnut/60 truncate">{record.artist}</p>
        </Link>
      ))}
    </div>
  )
}
