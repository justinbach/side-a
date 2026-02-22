'use client'

import { useRouter } from 'next/navigation'

type Collection = { id: string; name: string }

export function DashboardCollectionSwitcher({
  collections,
  collectionId,
}: {
  collections: Collection[]
  collectionId: string
}) {
  const router = useRouter()

  return (
    <select
      value={collectionId}
      onChange={(e) => router.push(`/collection?c=${e.target.value}`)}
      className="font-serif text-2xl text-walnut bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-8"
      style={{
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A3728' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0 center',
        backgroundSize: '1.25rem',
      }}
    >
      {collections.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
