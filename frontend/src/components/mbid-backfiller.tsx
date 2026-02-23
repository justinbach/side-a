'use client'

import { useEffect } from 'react'
import { backfillMbid } from '@/app/actions/backfill-mbid'

export function MbidBackfiller({
  recordId,
  title,
  artist,
}: {
  recordId: string
  title: string
  artist: string
}) {
  useEffect(() => {
    backfillMbid({ recordId, title, artist })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
