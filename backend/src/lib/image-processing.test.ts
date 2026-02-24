import { describe, it, expect } from 'vitest'
import { normalizedToPixels, processAlbumImage } from './image-processing'
import { AlbumBoundsAnalysis } from './claude'

describe('normalizedToPixels', () => {
  it('converts normalized coordinates to pixel coordinates', () => {
    const box = {
      topLeft: { x: 0.1, y: 0.1 },
      topRight: { x: 0.9, y: 0.1 },
      bottomRight: { x: 0.9, y: 0.9 },
      bottomLeft: { x: 0.1, y: 0.9 },
    }

    const result = normalizedToPixels(box, 1000, 800)

    expect(result.topLeft).toEqual({ x: 100, y: 80 })
    expect(result.topRight).toEqual({ x: 900, y: 80 })
    expect(result.bottomRight).toEqual({ x: 900, y: 720 })
    expect(result.bottomLeft).toEqual({ x: 100, y: 720 })
  })

  it('handles edge coordinates correctly', () => {
    const box = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 1, y: 0 },
      bottomRight: { x: 1, y: 1 },
      bottomLeft: { x: 0, y: 1 },
    }

    const result = normalizedToPixels(box, 500, 500)

    expect(result.topLeft).toEqual({ x: 0, y: 0 })
    expect(result.topRight).toEqual({ x: 500, y: 0 })
    expect(result.bottomRight).toEqual({ x: 500, y: 500 })
    expect(result.bottomLeft).toEqual({ x: 0, y: 500 })
  })
})

describe('processAlbumImage', () => {
  it('returns error when no album detected', async () => {
    const analysis: AlbumBoundsAnalysis = {
      albumDetected: false,
      boundingBox: null,
      rotationDegrees: 0,
      confidence: 'low',
    }

    const result = await processAlbumImage(Buffer.from(''), 'image/jpeg', analysis)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No album detected')
    expect(result.appliedCrop).toBe(false)
    expect(result.appliedRotation).toBe(0)
  })

  it('returns error when boundingBox is null', async () => {
    const analysis: AlbumBoundsAnalysis = {
      albumDetected: true,
      boundingBox: null,
      rotationDegrees: 0,
      confidence: 'high',
    }

    const result = await processAlbumImage(Buffer.from(''), 'image/jpeg', analysis)

    expect(result.success).toBe(false)
    expect(result.error).toBe('No album detected')
  })

  it('returns error when image data is invalid', async () => {
    const analysis: AlbumBoundsAnalysis = {
      albumDetected: true,
      boundingBox: {
        topLeft: { x: 0.1, y: 0.1 },
        topRight: { x: 0.9, y: 0.1 },
        bottomRight: { x: 0.9, y: 0.9 },
        bottomLeft: { x: 0.1, y: 0.9 },
      },
      rotationDegrees: 0,
      confidence: 'high',
    }

    const result = await processAlbumImage(Buffer.from('not-valid-image-data'), 'image/jpeg', analysis)

    expect(result.success).toBe(false)
    expect(result.appliedCrop).toBe(false)
    expect(result.appliedRotation).toBe(0)
  })
})
