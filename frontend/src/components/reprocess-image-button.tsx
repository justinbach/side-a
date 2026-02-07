'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function ReprocessImageButton({
  recordId,
  currentImageUrl,
}: {
  recordId: string
  currentImageUrl: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Only show for Supabase storage URLs (not external URLs like MusicBrainz)
  const isSupabaseUrl = currentImageUrl.includes('supabase')

  if (!isSupabaseUrl) {
    return null
  }

  const handleReprocess = async () => {
    setLoading(true)
    setError(null)
    setStatus('Fetching image...')

    try {
      // Step 1: Fetch the current image
      const imageResponse = await fetch(currentImageUrl)
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch current image')
      }
      const imageBlob = await imageResponse.blob()

      // Step 2: Send to preprocess endpoint
      setStatus('Analyzing image...')
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
        setLoading(false)
        setStatus(null)
        return
      }

      // Step 3: Upload processed image to Supabase Storage
      setStatus('Uploading enhanced image...')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        setStatus(null)
        return
      }

      // Convert data URL to blob
      const [header, base64] = data.processedImageDataUrl.split(',')
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
        setLoading(false)
        setStatus(null)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      // Step 4: Update record with new URL
      setStatus('Updating record...')
      const { error: updateError } = await supabase
        .from('records')
        .update({ cover_image_url: publicUrl })
        .eq('id', recordId)

      if (updateError) {
        setError(`Failed to update record: ${updateError.message}`)
        setLoading(false)
        setStatus(null)
        return
      }

      // Success - refresh page
      setStatus('Done!')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance image')
    } finally {
      setLoading(false)
      setStatus(null)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleReprocess}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-walnut border border-walnut/20 rounded-lg hover:bg-tan/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
            <span>{status || 'Processing...'}</span>
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
