import { Router } from 'express'
import { rankAlbumsForContext } from '../lib/claude'

const router = Router()

export type RecommendResponse = {
  recommendations: string[]
}

router.post('/', async (req, res) => {
  try {
    const { context, albums } = req.body as {
      context: string
      albums: { id: string; title: string; artist: string }[]
    }

    if (!context || !Array.isArray(albums)) {
      return res.status(400).json({ recommendations: [] } satisfies RecommendResponse)
    }

    const recommendations = await rankAlbumsForContext(context, albums)
    return res.json({ recommendations } satisfies RecommendResponse)
  } catch (error) {
    console.error('Recommend error:', error)
    // Graceful degradation — Tier 1 still shows on the frontend
    return res.json({ recommendations: [] } satisfies RecommendResponse)
  }
})

export default router
