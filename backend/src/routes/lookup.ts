import { Router } from 'express'
import { searchRelease, MusicBrainzRelease } from '../lib/musicbrainz'

const router = Router()

export type LookupResponse = {
  success: boolean
  metadata: MusicBrainzRelease | null
  error?: string
}

router.post('/', async (req, res) => {
  try {
    const { title, artist } = req.body

    if (!title) {
      return res.status(400).json({
        success: false,
        metadata: null,
        error: 'Title is required',
      } satisfies LookupResponse)
    }

    const metadata = await searchRelease(title, artist || '')

    return res.json({
      success: !!metadata,
      metadata,
    } satisfies LookupResponse)
  } catch (error) {
    console.error('Lookup error:', error)
    return res.status(500).json({
      success: false,
      metadata: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    } satisfies LookupResponse)
  }
})

export default router
