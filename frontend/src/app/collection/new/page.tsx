'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type RecognitionResult = {
  success: boolean
  extraction: {
    title: string | null
    artist: string | null
    confidence: 'high' | 'medium' | 'low'
  }
  metadata: {
    title: string
    artist: string
    coverArtUrl: string | null
    releaseDate: string | null
    label: string | null
    trackCount: number
  } | null
}

type RecognitionState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'analyzing' }
  | { status: 'searching' }
  | { status: 'success'; result: RecognitionResult }
  | { status: 'error'; message: string }

export default function NewRecordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center"><p className="text-walnut/60">Loading...</p></div>}>
      <NewRecordContent />
    </Suspense>
  )
}

function NewRecordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const collectionId = searchParams.get('collectionId')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognizeInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<RecognitionState>({ status: 'idle' })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRecognize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRecognition({ status: 'uploading' })

    // Show preview of the photo being analyzed
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setCoverFile(file)

    // Small delay to show uploading state
    await new Promise(r => setTimeout(r, 500))
    setRecognition({ status: 'analyzing' })

    try {
      const formData = new FormData()
      formData.append('image', file)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/recognize`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Recognition failed: ${response.statusText}`)
      }

      setRecognition({ status: 'searching' })
      await new Promise(r => setTimeout(r, 300))

      const result: RecognitionResult = await response.json()
      setRecognition({ status: 'success', result })

      // Populate form with results
      if (result.metadata) {
        setTitle(result.metadata.title)
        setArtist(result.metadata.artist)
        if (result.metadata.coverArtUrl) {
          setCoverPreview(result.metadata.coverArtUrl)
          setCoverFile(null) // Use the remote URL instead
        }
      } else if (result.extraction.title || result.extraction.artist) {
        setTitle(result.extraction.title || '')
        setArtist(result.extraction.artist || '')
      }
    } catch (err) {
      setRecognition({
        status: 'error',
        message: err instanceof Error ? err.message : 'Recognition failed'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionId) {
      setError('No collection ID provided')
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createClient()

    let coverImageUrl: string | null = coverPreview?.startsWith('http') ? coverPreview : null

    // Upload cover image if it's a local file
    if (coverFile) {
      const fileExt = coverFile.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const { data: { user } } = await supabase.auth.getUser()
      const filePath = `${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, coverFile)

      if (uploadError) {
        setError(`Failed to upload image: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      coverImageUrl = publicUrl
    }

    // Create the record
    const { error: insertError } = await supabase
      .from('records')
      .insert({
        collection_id: collectionId,
        title,
        artist,
        cover_image_url: coverImageUrl,
      })

    if (insertError) {
      setError(`Failed to add record: ${insertError.message}`)
      setLoading(false)
      return
    }

    router.push('/collection')
    router.refresh()
  }

  const isRecognizing = ['uploading', 'analyzing', 'searching'].includes(recognition.status)

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/collection"
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Collection
        </Link>

        <h1 className="font-serif text-3xl font-bold text-walnut mb-8">Add Record</h1>

        {/* Recognition Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-burnt-orange/5 to-sage/5 rounded-xl border border-walnut/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-burnt-orange/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-burnt-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-medium text-walnut">Scan Album Cover</h2>
              <p className="text-sm text-walnut/60">Take a photo and we will fill in the details</p>
            </div>
          </div>

          {isRecognizing ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-burnt-orange/10 mb-4">
                <div className="w-8 h-8 border-2 border-burnt-orange border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-walnut font-medium">
                {recognition.status === 'uploading' && 'Uploading image...'}
                {recognition.status === 'analyzing' && 'Analyzing album cover...'}
                {recognition.status === 'searching' && 'Looking up album details...'}
              </p>
              <p className="text-sm text-walnut/60 mt-1">This may take a few seconds</p>
            </div>
          ) : recognition.status === 'success' ? (
            <div className="py-4">
              <div className="flex items-center gap-2 text-sage mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Album recognized!</span>
              </div>
              {recognition.result.metadata ? (
                <p className="text-sm text-walnut/60">
                  Found: {recognition.result.metadata.title} by {recognition.result.metadata.artist}
                  {recognition.result.metadata.releaseDate && ` (${recognition.result.metadata.releaseDate.split('-')[0]})`}
                </p>
              ) : (
                <p className="text-sm text-walnut/60">
                  Detected: {recognition.result.extraction.title || 'Unknown'} by {recognition.result.extraction.artist || 'Unknown'}
                  <span className="text-walnut/40"> (confidence: {recognition.result.extraction.confidence})</span>
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setRecognition({ status: 'idle' })
                  recognizeInputRef.current?.click()
                }}
                className="mt-3 text-sm text-burnt-orange hover:underline"
              >
                Try another photo
              </button>
            </div>
          ) : recognition.status === 'error' ? (
            <div className="py-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Recognition failed</span>
              </div>
              <p className="text-sm text-walnut/60">{recognition.message}</p>
              <button
                type="button"
                onClick={() => {
                  setRecognition({ status: 'idle' })
                  recognizeInputRef.current?.click()
                }}
                className="mt-3 text-sm text-burnt-orange hover:underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => recognizeInputRef.current?.click()}
              className="w-full py-3 px-4 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan Album Cover
            </button>
          )}
          <input
            ref={recognizeInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleRecognize}
            className="hidden"
          />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-walnut/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-cream text-sm text-walnut/50">or enter details manually</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium text-walnut mb-2">
              Cover Image
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square max-w-xs bg-tan rounded-lg overflow-hidden cursor-pointer hover:bg-tan/80 transition-colors flex items-center justify-center border-2 border-dashed border-walnut/20 hover:border-walnut/40"
            >
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                  unoptimized={coverPreview.startsWith('data:')}
                />
              ) : (
                <div className="text-center p-6">
                  <svg
                    className="w-12 h-12 text-walnut/30 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-walnut/50">Click to upload cover image</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {coverPreview && (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null)
                  setCoverPreview(null)
                }}
                className="mt-2 text-sm text-walnut/60 hover:text-walnut"
              >
                Remove image
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-walnut mb-1">
              Album Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50"
              placeholder="e.g., Abbey Road"
            />
          </div>

          {/* Artist */}
          <div>
            <label htmlFor="artist" className="block text-sm font-medium text-walnut mb-1">
              Artist
            </label>
            <input
              id="artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-walnut/20 bg-warm-white focus:outline-none focus:ring-2 focus:ring-burnt-orange/50"
              placeholder="e.g., The Beatles"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || isRecognizing}
              className="flex-1 px-6 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Record'}
            </button>
            <Link
              href="/collection"
              className="px-6 py-3 border border-walnut/20 text-walnut rounded-lg font-medium hover:bg-tan/50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
