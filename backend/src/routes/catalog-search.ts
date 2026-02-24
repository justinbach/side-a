import { Router } from 'express'
import { searchReleaseCatalog, getReleaseByMbid } from '../lib/musicbrainz'

const router = Router()

// GET /api/catalog-search?q=... — multi-result search, no cover art
router.get('/', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q) {
    res.json({ results: [] })
    return
  }

  try {
    const results = await searchReleaseCatalog(q)
    res.json({ results })
  } catch (err) {
    console.error('Catalog search error:', err)
    res.json({ results: [] })
  }
})

// GET /api/catalog-search/:mbid — full release detail with cover art
router.get('/:mbid', async (req, res) => {
  const { mbid } = req.params
  try {
    const release = await getReleaseByMbid(mbid)
    res.json({ release })
  } catch (err) {
    console.error('Catalog detail error:', err)
    res.json({ release: null })
  }
})

export default router
