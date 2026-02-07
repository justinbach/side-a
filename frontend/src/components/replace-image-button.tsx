'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ReplaceState =
  | { status: 'idle' }
  | { status: 'preview'; file: File; previewUrl: string }
  | { status: 'uploading' }

export function ReplaceImageButton({
  recordId,
  currentImageUrl,
}: {
  recordId: string
  currentImageUrl: string | null
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ReplaceState>({ status: 'idle' })
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setState({ status: 'preview', file, previewUrl })
    setError(null)

    // Reset file input so same file can be selected again
    e.target.value = ''
  }

  const handleConfirm = async () => {
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

      // Upload to storage
      const fileExt = state.file.name.split('.').pop() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, state.file)

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

      // Clean up preview URL
      URL.revokeObjectURL(state.previewUrl)

      // Success - refresh page
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replace image')
      setState({ status: 'idle' })
    }
  }

  const handleCancel = () => {
    if (state.status === 'preview') {
      URL.revokeObjectURL(state.previewUrl)
    }
    setState({ status: 'idle' })
    setError(null)
  }

  // Preview mode - show side-by-side comparison
  if (state.status === 'preview') {
    return (
      <div className="mt-4 p-4 bg-tan/30 rounded-lg border border-walnut/10">
        <p className="text-sm font-medium text-walnut mb-3">Replace cover image</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-walnut/60 mb-1">Current</p>
            <div className="aspect-square bg-tan rounded-lg overflow-hidden">
              {currentImageUrl ? (
                <Image
                  src={currentImageUrl}
                  alt="Current image"
                  width={150}
                  height={150}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-walnut/30 text-xs">
                  No image
                </div>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-walnut/60 mb-1">New</p>
            <div className="aspect-square bg-tan rounded-lg overflow-hidden">
              <Image
                src={state.previewUrl}
                alt="New image"
                width={150}
                height={150}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-2 px-3 border border-walnut/20 text-walnut rounded-lg text-sm font-medium hover:bg-tan/50 transition-colors"
          >
            Keep Current
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 px-3 bg-sage text-warm-white rounded-lg text-sm font-medium hover:bg-sage/90 transition-colors"
          >
            Use New Image
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
          <span>Uploading new image...</span>
        </div>
      </div>
    )
  }

  // Default button state
  return (
    <div className="mt-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-walnut border border-walnut/20 rounded-lg hover:bg-tan/50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Replace Image</span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
