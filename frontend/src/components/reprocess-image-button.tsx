'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type PreprocessResponse = {
  success: boolean
  processedImageDataUrl: string | null
  analysis: {
    albumDetected: boolean
    rotationDegrees: number
    confidence: 'high' | 'medium' | 'low'
  }
  error?: string
}

type PreviewState =
  | { status: 'idle' }
  | { status: 'analyzing' }
  | { status: 'preview'; processedImageDataUrl: string; rotationDegrees: number }
  | { status: 'uploading' }

export function ReprocessImageButton({
  recordId,
  currentImageUrl,
}: {
  recordId: string
  currentImageUrl: string
}) {
  const router = useRouter()
  const [state, setState] = useState<PreviewState>({ status: 'idle' })
  const [error, setError] = useState<string | null>(null)

  // Only show for Supabase storage URLs (not external URLs like MusicBrainz)
  const isSupabaseUrl = currentImageUrl.includes('supabase')

  if (!isSupabaseUrl) {
    return null
  }

  const handleAnalyze = async () => {
    setState({ status: 'analyzing' })
    setError(null)

    try {
      // Step 1: Fetch the current image
      const imageResponse = await fetch(currentImageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch current image')
      }
      const imageBlob = await imageResponse.blob()

      // Step 2: Send to preprocess endpoint
      const formData = new FormData()
      formData.append('image', imageBlob, 'image.jpg')

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/preprocess`, {
        method: 'POST',
        body: formData,
      })

      const data: PreprocessResponse = await response.json()

      if (!data.success || !data.processedImageDataUrl) {
        setError(data.error || 'Could not enhance image')
        setState({ status: 'idle' })
        return
      }

      // Show preview for user approval
      setState({
        status: 'preview',
        processedImageDataUrl: data.processedImageDataUrl,
        rotationDegrees: data.analysis.rotationDegrees,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
      setState({ status: 'idle' })
    }
  }

  const handleAccept = async () => {
    if (state.status !== 'preview') return

    setState({ status: 'uploading' })
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setState({ status: 'idle' })
        return
      }

      // Convert data URL to blob
      const [header, base64] = state.processedImageDataUrl.split(',')
      const mimeMatch = header.match(/:(.*?);/)
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      const binary = atob(base64)
      const array = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
      }
      const processedBlob = new Blob([array], { type: mime })

      // Upload to storage
      const fileName = `${crypto.randomUUID()}.jpg`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, processedBlob)

      if (uploadError) {
        setError(`Failed to upload: ${uploadError.message}`)
        setState({ status: 'idle' })
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      // Update record with new URL
      const { error: updateError } = await supabase
        .from('records')
        .update({ cover_image_url: publicUrl })
        .eq('id', recordId)

      if (updateError) {
        setError(`Failed to update record: ${updateError.message}`)
        setState({ status: 'idle' })
        return
      }

      // Success - refresh page
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save image')
      setState({ status: 'idle' })
    }
  }

  const handleReject = () => {
    setState({ status: 'idle' })
    setError(null)
  }

  // Preview mode - show side-by-side comparison
  if (state.status === 'preview') {
    return (
      <div className="mt-4 p-4 bg-tan/30 rounded-lg border border-walnut/10">
        <p className="text-sm font-medium text-walnut mb-3">Review enhanced image</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-walnut/60 mb-1">Current</p>
            <div className="aspect-square bg-tan rounded-lg overflow-hidden">
              <Image
                src={currentImageUrl}
                alt="Current image"
                width={150}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-walnut/60 mb-1">Enhanced</p>
            <div className="aspect-square bg-tan rounded-lg overflow-hidden">
              <Image
                src={state.processedImageDataUrl}
                alt="Enhanced image"
                width={150}
                height={150}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>

        {state.rotationDegrees !== 0 && (
          <p className="text-xs text-walnut/50 mb-3">
            Rotated {Math.abs(state.rotationDegrees).toFixed(0)}° and cropped
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 py-2 px-3 border border-walnut/20 text-walnut rounded-lg text-sm font-medium hover:bg-tan/50 transition-colors"
          >
            Keep Original
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-3 bg-sage text-warm-white rounded-lg text-sm font-medium hover:bg-sage/90 transition-colors"
          >
            Use Enhanced
          </button>
        </div>
      </div>
    )
  }

  // Uploading state
  if (state.status === 'uploading') {
    return (
      <div className="mt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm text-walnut/60">
          <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
          <span>Saving enhanced image...</span>
        </div>
      </div>
    )
  }

  // Default button state
  return (
    <div className="mt-4">
      <button
        onClick={handleAnalyze}
        disabled={state.status === 'analyzing'}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-walnut border border-walnut/20 rounded-lg hover:bg-tan/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state.status === 'analyzing' ? (
          <>
            <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Enhance Image</span>
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
