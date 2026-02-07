import { Router } from 'express'
import multer from 'multer'
import { analyzeAlbumBounds } from '../lib/claude'
import { processAlbumImage } from '../lib/image-processing'

const router = Router()

// Configure multer for memory storage
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

export type PreprocessResponse = {
  success: boolean
  processedImageDataUrl: string | null
  analysis: {
    albumDetected: boolean
    rotationDegrees: number
    confidence: 'high' | 'medium' | 'low'
  }
  error?: string
}

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        processedImageDataUrl: null,
        analysis: {
          albumDetected: false,
          rotationDegrees: 0,
          confidence: 'low',
        },
        error: 'No image file provided',
      } satisfies PreprocessResponse)
    }

    const imageBase64 = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype

    // Step 1: Analyze album bounds
    console.log('Analyzing album bounds for preprocessing...')
    const boundsAnalysis = await analyzeAlbumBounds(imageBase64, mimeType)
    console.log('Bounds analysis:', boundsAnalysis)

    // If no album detected or low confidence, return original
    if (!boundsAnalysis.albumDetected || boundsAnalysis.confidence === 'low') {
      return res.json({
        success: false,
        processedImageDataUrl: null,
        analysis: {
          albumDetected: boundsAnalysis.albumDetected,
          rotationDegrees: boundsAnalysis.rotationDegrees,
          confidence: boundsAnalysis.confidence,
        },
        error: 'Could not detect album in image with sufficient confidence',
      } satisfies PreprocessResponse)
    }

    // Step 2: Process the image (crop and rotate)
    console.log('Processing image...')
    const processingResult = await processAlbumImage(
      req.file.buffer,
      mimeType,
      boundsAnalysis
    )

    if (!processingResult.success || !processingResult.processedImageBase64) {
      return res.json({
        success: false,
        processedImageDataUrl: null,
        analysis: {
          albumDetected: boundsAnalysis.albumDetected,
          rotationDegrees: boundsAnalysis.rotationDegrees,
          confidence: boundsAnalysis.confidence,
        },
        error: processingResult.error || 'Image processing failed',
      } satisfies PreprocessResponse)
    }

    console.log('Image preprocessed successfully')
    return res.json({
      success: true,
      processedImageDataUrl: `data:${processingResult.mimeType};base64,${processingResult.processedImageBase64}`,
      analysis: {
        albumDetected: boundsAnalysis.albumDetected,
        rotationDegrees: processingResult.appliedRotation,
        confidence: boundsAnalysis.confidence,
      },
    } satisfies PreprocessResponse)
  } catch (error) {
    console.error('Preprocess error:', error)
    return res.status(500).json({
      success: false,
      processedImageDataUrl: null,
      analysis: {
        albumDetected: false,
        rotationDegrees: 0,
        confidence: 'low',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    } satisfies PreprocessResponse)
  }
})

export default router
