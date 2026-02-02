import { Router } from 'express'
import multer from 'multer'
import { extractAlbumInfo } from '../lib/claude'
import { searchRelease, MusicBrainzRelease } from '../lib/musicbrainz'

const router = Router()

// Configure multer for memory storage (we'll convert to base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'))
    }
  },
})

export type RecognizeResponse = {
  success: boolean
  extraction: {
    title: string | null
    artist: string | null
    confidence: 'high' | 'medium' | 'low'
  }
  metadata: MusicBrainzRelease | null
  error?: string
}

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        extraction: { title: null, artist: null, confidence: 'low' },
        metadata: null,
        error: 'No image file provided',
      } satisfies RecognizeResponse)
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype

    // Step 1: Extract album info using Claude Vision
    console.log('Extracting album info with Claude Vision...')
    const extraction = await extractAlbumInfo(imageBase64, mimeType)
    console.log('Extraction result:', extraction)

    // If we couldn't extract anything useful, return early
    if (!extraction.title && !extraction.artist) {
      return res.json({
        success: false,
        extraction,
        metadata: null,
        error: 'Could not identify album from image',
      } satisfies RecognizeResponse)
    }

    // Step 2: Look up metadata from MusicBrainz
    let metadata: MusicBrainzRelease | null = null
    if (extraction.title) {
      console.log('Looking up metadata from MusicBrainz...')
      metadata = await searchRelease(
        extraction.title,
        extraction.artist || ''
      )
      console.log('MusicBrainz result:', metadata ? 'Found' : 'Not found')
    }

    return res.json({
      success: true,
      extraction,
      metadata,
    } satisfies RecognizeResponse)
  } catch (error) {
    console.error('Recognition error:', error)
    return res.status(500).json({
      success: false,
      extraction: { title: null, artist: null, confidence: 'low' },
      metadata: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    } satisfies RecognizeResponse)
  }
})

export default router
