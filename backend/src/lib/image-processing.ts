import sharp from 'sharp'
import { AlbumBoundsAnalysis, BoundingBox } from './claude'

export type ProcessingResult = {
  success: boolean
  processedImageBase64: string | null
  mimeType: string
  appliedRotation: number
  appliedCrop: boolean
  error?: string
}

/**
 * Process an album image by cropping to detected bounds and rotating to straighten.
 */
export async function processAlbumImage(
  imageBuffer: Buffer,
  mimeType: string,
  analysis: AlbumBoundsAnalysis
): Promise<ProcessingResult> {
  if (!analysis.albumDetected || !analysis.boundingBox) {
    return {
      success: false,
      processedImageBase64: null,
      mimeType,
      appliedRotation: 0,
      appliedCrop: false,
      error: 'No album detected',
    }
  }

  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (width === 0 || height === 0) {
      return {
        success: false,
        processedImageBase64: null,
        mimeType,
        appliedRotation: 0,
        appliedCrop: false,
        error: 'Could not read image dimensions',
      }
    }

    // Convert normalized bounding box to pixel coordinates
    const bounds = normalizedToPixels(analysis.boundingBox, width, height)

    // Calculate the axis-aligned bounding box that contains all 4 corners
    const minX = Math.max(0, Math.floor(Math.min(bounds.topLeft.x, bounds.bottomLeft.x)))
    const maxX = Math.min(width, Math.ceil(Math.max(bounds.topRight.x, bounds.bottomRight.x)))
    const minY = Math.max(0, Math.floor(Math.min(bounds.topLeft.y, bounds.topRight.y)))
    const maxY = Math.min(height, Math.ceil(Math.max(bounds.bottomLeft.y, bounds.bottomRight.y)))

    const cropWidth = maxX - minX
    const cropHeight = maxY - minY

    if (cropWidth <= 0 || cropHeight <= 0) {
      return {
        success: false,
        processedImageBase64: null,
        mimeType,
        appliedRotation: 0,
        appliedCrop: false,
        error: 'Invalid crop dimensions',
      }
    }

    // Build the Sharp pipeline
    let pipeline = sharp(imageBuffer)

    // Apply rotation if needed (Sharp rotates counter-clockwise, so negate)
    const rotation = analysis.rotationDegrees
    if (Math.abs(rotation) > 0.5) {
      pipeline = pipeline.rotate(-rotation, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
    }

    // After rotation, we need to recalculate crop area
    // For simplicity, if rotation is applied, we'll do a centered crop based on the detected bounds
    // This is an approximation that works well for small rotation angles
    if (Math.abs(rotation) > 0.5) {
      // Get new dimensions after rotation
      const rotatedMeta = await pipeline.toBuffer().then((buf) => sharp(buf).metadata())
      const newWidth = rotatedMeta.width || width
      const newHeight = rotatedMeta.height || height

      // Recalculate crop for rotated image
      // Use the center and size from original bounds, scaled to new dimensions
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2
      const scaleX = newWidth / width
      const scaleY = newHeight / height

      const newCenterX = centerX * scaleX
      const newCenterY = centerY * scaleY
      const newCropWidth = cropWidth * scaleX
      const newCropHeight = cropHeight * scaleY

      const newMinX = Math.max(0, Math.floor(newCenterX - newCropWidth / 2))
      const newMinY = Math.max(0, Math.floor(newCenterY - newCropHeight / 2))

      pipeline = sharp(await pipeline.toBuffer()).extract({
        left: newMinX,
        top: newMinY,
        width: Math.min(Math.floor(newCropWidth), newWidth - newMinX),
        height: Math.min(Math.floor(newCropHeight), newHeight - newMinY),
      })
    } else {
      // No rotation, apply direct crop
      pipeline = pipeline.extract({
        left: minX,
        top: minY,
        width: cropWidth,
        height: cropHeight,
      })
    }

    // Resize if too large (max 1200px on longest side)
    pipeline = pipeline.resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })

    // Output as JPEG for consistency and smaller size
    const outputBuffer = await pipeline.jpeg({ quality: 85 }).toBuffer()

    return {
      success: true,
      processedImageBase64: outputBuffer.toString('base64'),
      mimeType: 'image/jpeg',
      appliedRotation: Math.abs(rotation) > 0.5 ? rotation : 0,
      appliedCrop: true,
    }
  } catch (error) {
    return {
      success: false,
      processedImageBase64: null,
      mimeType,
      appliedRotation: 0,
      appliedCrop: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    }
  }
}

/**
 * Convert normalized (0-1) bounding box coordinates to pixel coordinates.
 */
export function normalizedToPixels(
  box: BoundingBox,
  width: number,
  height: number
): BoundingBox {
  return {
    topLeft: { x: box.topLeft.x * width, y: box.topLeft.y * height },
    topRight: { x: box.topRight.x * width, y: box.topRight.y * height },
    bottomRight: { x: box.bottomRight.x * width, y: box.bottomRight.y * height },
    bottomLeft: { x: box.bottomLeft.x * width, y: box.bottomLeft.y * height },
  }
}
