import { Router } from 'express'
import multer from 'multer'
import { extractAlbumInfo, analyzeAlbumBounds, AlbumBoundsAnalysis } from '../lib/claude'
import { searchRelease, MusicBrainzRelease } from '../lib/musicbrainz'
import { processAlbumImage } from '../lib/image-processing'

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

export type PreprocessingResult = {
  applied: boolean
  processedImageDataUrl: string | null
  analysis: {
    albumDetected: boolean
    rotationDegrees: number
    confidence: 'high' | 'medium' | 'low'
  }
}

export type RecognizeResponse = {
  success: boolean
  extraction: {
    title: string | null
    artist: string | null
    confidence: 'high' | 'medium' | 'low'
  }
  metadata: MusicBrainzRelease | null
  preprocessing?: PreprocessingResult
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
    const originalImageBase64 = req.file.buffer.toString('base64')
    const originalMimeType = req.file.mimetype

    // Step 1: Analyze album bounds for preprocessing
    console.log('Analyzing album bounds...')
    let boundsAnalysis: AlbumBoundsAnalysis
    let preprocessing: PreprocessingResult = {
      applied: false,
      processedImageDataUrl: null,
      analysis: {
        albumDetected: false,
        rotationDegrees: 0,
        confidence: 'low',
      },
    }

    try {
      boundsAnalysis = await analyzeAlbumBounds(originalImageBase64, originalMimeType)
      console.log('Bounds analysis:', boundsAnalysis)

      preprocessing.analysis = {
        albumDetected: boundsAnalysis.albumDetected,
        rotationDegrees: boundsAnalysis.rotationDegrees,
        confidence: boundsAnalysis.confidence,
      }
    } catch (boundsError) {
      console.error('Bounds analysis failed, continuing with original image:', boundsError)
      boundsAnalysis = {
        albumDetected: false,
        boundingBox: null,
        rotationDegrees: 0,
        confidence: 'low',
      }
    }

    // Step 2: Process image if bounds were detected with sufficient confidence
    let imageBase64ForRecognition = originalImageBase64
    let mimeTypeForRecognition = originalMimeType

    if (boundsAnalysis.albumDetected && boundsAnalysis.confidence !== 'low') {
      console.log('Processing image...')
      const processingResult = await processAlbumImage(
        req.file.buffer,
        originalMimeType,
        boundsAnalysis
      )

      if (processingResult.success && processingResult.processedImageBase64) {
        imageBase64ForRecognition = processingResult.processedImageBase64
        mimeTypeForRecognition = processingResult.mimeType
        preprocessing.applied = true
        preprocessing.processedImageDataUrl = `data:${processingResult.mimeType};base64,${processingResult.processedImageBase64}`
        console.log('Image processed successfully')
      } else {
        console.log('Image processing failed, using original:', processingResult.error)
      }
    }

    // Step 3: Extract album info using Claude Vision (on processed or original image)
    console.log('Extracting album info with Claude Vision...')
    const extraction = await extractAlbumInfo(imageBase64ForRecognition, mimeTypeForRecognition)
    console.log('Extraction result:', extraction)

    // If we couldn't extract anything useful, return early
    if (!extraction.title && !extraction.artist) {
      return res.json({
        success: false,
        extraction,
        metadata: null,
        preprocessing,
        error: 'Could not identify album from image',
      } satisfies RecognizeResponse)
    }

    // Step 4: Look up metadata from MusicBrainz
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
      preprocessing,
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
