'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { AlbumSearch } from '@/components/album-search'

type Track = {
  position: number
  title: string
  length: number | null
}

type PreprocessingResult = {
  applied: boolean
  processedImageDataUrl: string | null
  analysis: {
    albumDetected: boolean
    rotationDegrees: number
    confidence: 'high' | 'medium' | 'low'
  }
}

type RecognitionResult = {
  success: boolean
  extraction: {
    title: string | null
    artist: string | null
    confidence: 'high' | 'medium' | 'low'
  }
  metadata: {
    id?: string
    title: string
    artist: string
    coverArtUrl: string | null
    releaseDate: string | null
    label: string | null
    trackCount: number
    tracks: Track[]
  } | null
  preprocessing?: PreprocessingResult
}

type RecognitionState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'analyzing' }
  | { status: 'searching' }
  | { status: 'success'; result: RecognitionResult }
  | { status: 'error'; message: string }

type MusicBrainzMetadata = {
  id?: string
  title: string
  artist: string
  coverArtUrl: string | null
  releaseDate: string | null
  label: string | null
  trackCount: number
  tracks: Track[]
}

type MusicBrainzApproval =
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'accepted'; useMusicBrainzCover: boolean }
  | { status: 'rejected' }

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
  const [originalImageDataUrl, setOriginalImageDataUrl] = useState<string | null>(null)
  const [processedImageDataUrl, setProcessedImageDataUrl] = useState<string | null>(null)
  const [useProcessedImage, setUseProcessedImage] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recognition, setRecognition] = useState<RecognitionState>({ status: 'idle' })
  const [musicBrainzMatch, setMusicBrainzMatch] = useState<MusicBrainzMetadata | null>(null)
  const [musicBrainzApproval, setMusicBrainzApproval] = useState<MusicBrainzApproval>({ status: 'none' })
  const [showCatalogSearch, setShowCatalogSearch] = useState(false)

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
    setProcessedImageDataUrl(null)
    setOriginalImageDataUrl(null)
    setUseProcessedImage(true)
    setMusicBrainzMatch(null)
    setMusicBrainzApproval({ status: 'none' })

    // Show preview of the photo being analyzed
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setCoverPreview(dataUrl)
      setOriginalImageDataUrl(dataUrl)
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

      // Handle preprocessed image - always use user's photo as default
      if (result.preprocessing?.applied && result.preprocessing.processedImageDataUrl) {
        setProcessedImageDataUrl(result.preprocessing.processedImageDataUrl)
        setCoverPreview(result.preprocessing.processedImageDataUrl)
        setCoverFile(null)
      }

      // Populate form with Claude's extraction (NOT MusicBrainz - that requires approval)
      if (result.extraction.title || result.extraction.artist) {
        setTitle(result.extraction.title || '')
        setArtist(result.extraction.artist || '')
      }

      // If MusicBrainz found a match, store it for user review (don't auto-apply)
      if (result.metadata) {
        setMusicBrainzMatch(result.metadata)
        setMusicBrainzApproval({ status: 'pending' })
      }
    } catch (err) {
      setRecognition({
        status: 'error',
        message: err instanceof Error ? err.message : 'Recognition failed'
      })
    }
  }

  // Handle accepting MusicBrainz match
  const handleAcceptMusicBrainz = (useCover: boolean) => {
    if (!musicBrainzMatch) return

    setMusicBrainzApproval({ status: 'accepted', useMusicBrainzCover: useCover })
    setTitle(musicBrainzMatch.title)
    setArtist(musicBrainzMatch.artist)

    if (useCover && musicBrainzMatch.coverArtUrl) {
      setCoverPreview(musicBrainzMatch.coverArtUrl)
      setProcessedImageDataUrl(null)
    }
  }

  // Handle rejecting MusicBrainz match
  const handleRejectMusicBrainz = () => {
    setMusicBrainzApproval({ status: 'rejected' })
    // Keep current form values and user's photo
  }

  // Manual lookup — triggered when user types title+artist and clicks "Look up on MusicBrainz"
  const handleManualLookup = async () => {
    setMusicBrainzMatch(null)
    setMusicBrainzApproval({ status: 'pending' })
    setRecognition({ status: 'searching' })

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist }),
      })

      const data = await response.json()

      if (data.success && data.metadata) {
        setMusicBrainzMatch(data.metadata)
        setRecognition({ status: 'success', result: { success: true, extraction: { title, artist, confidence: 'high' }, metadata: data.metadata } })
      } else {
        setMusicBrainzApproval({ status: 'none' })
        setRecognition({ status: 'idle' })
      }
    } catch {
      setMusicBrainzApproval({ status: 'none' })
      setRecognition({ status: 'idle' })
    }
  }

  // Catalog search select — populates form and shows approval card
  const handleCatalogSelect = (release: {
    id: string
    title: string
    artist: string
    releaseDate: string | null
    label: string | null
    country: string | null
    trackCount: number
    tracks: { position: number; title: string; length: number | null }[]
    coverArtUrl: string | null
  }) => {
    setShowCatalogSearch(false)
    setTitle(release.title)
    setArtist(release.artist)
    setMusicBrainzMatch({
      id: release.id,
      title: release.title,
      artist: release.artist,
      coverArtUrl: release.coverArtUrl,
      releaseDate: release.releaseDate,
      label: release.label,
      trackCount: release.trackCount,
      tracks: release.tracks,
    })
    setMusicBrainzApproval({ status: 'pending' })
    setRecognition({
      status: 'success',
      result: {
        success: true,
        extraction: { title: release.title, artist: release.artist, confidence: 'high' },
        metadata: {
          id: release.id,
          title: release.title,
          artist: release.artist,
          coverArtUrl: release.coverArtUrl,
          releaseDate: release.releaseDate,
          label: release.label,
          trackCount: release.trackCount,
          tracks: release.tracks,
        },
      },
    })
  }

  // Helper to convert data URL to Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header.match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const binary = atob(base64)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }
    return new Blob([array], { type: mime })
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

    // If the user accepted the MusicBrainz cover art, use it directly — skip all local uploads
    const usingMusicBrainzCover =
      musicBrainzApproval.status === 'accepted' && musicBrainzApproval.useMusicBrainzCover

    // Determine which image to upload - prioritize processed image if available
    const imageToUpload = useProcessedImage && processedImageDataUrl
      ? processedImageDataUrl
      : originalImageDataUrl

    // Upload cover image - check for data URL first (processed/original from recognition)
    // then fall back to file upload (manual selection).
    // Skip entirely when the MusicBrainz cover URL is already in coverImageUrl.
    if (!usingMusicBrainzCover && imageToUpload && imageToUpload.startsWith('data:')) {
      // Upload processed or original image from data URL
      const blob = dataUrlToBlob(imageToUpload)
      const fileName = `${crypto.randomUUID()}.jpg`
      const { data: { user } } = await supabase.auth.getUser()
      const filePath = `${user?.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, blob)

      if (uploadError) {
        setError(`Failed to upload image: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath)

      coverImageUrl = publicUrl
    } else if (!usingMusicBrainzCover && coverFile) {
      // Fallback to original file (manual upload without recognition)
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

    // Build metadata - only use MusicBrainz data if user accepted the match
    const metadata: Record<string, unknown> = {}
    if (musicBrainzApproval.status === 'accepted' && musicBrainzMatch) {
      const { releaseDate, label, tracks } = musicBrainzMatch
      if (releaseDate) metadata.releaseDate = releaseDate
      if (label) metadata.label = label
      if (tracks && tracks.length > 0) metadata.tracks = tracks
    }

    // Capture mbid if MusicBrainz was accepted
    const mbid = musicBrainzApproval.status === 'accepted' && musicBrainzMatch?.id
      ? musicBrainzMatch.id
      : null

    // Create the record
    const { error: insertError } = await supabase
      .from('records')
      .insert({
        collection_id: collectionId,
        title,
        artist,
        cover_image_url: coverImageUrl,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
        mbid,
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
              {/* MusicBrainz Match Review */}
              {musicBrainzMatch && musicBrainzApproval.status === 'pending' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sage mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="font-medium">Found a match - please review</span>
                  </div>

                  {/* Side by side comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* User's photo */}
                    <div className="text-center">
                      <p className="text-xs text-walnut/60 mb-2">Your Photo</p>
                      <div className="aspect-square bg-tan rounded-lg overflow-hidden">
                        {(processedImageDataUrl || originalImageDataUrl) && (
                          <Image
                            src={processedImageDataUrl || originalImageDataUrl || ''}
                            alt="Your photo"
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>
                    {/* MusicBrainz cover */}
                    <div className="text-center">
                      <p className="text-xs text-walnut/60 mb-2">MusicBrainz</p>
                      <div className="aspect-square bg-tan rounded-lg overflow-hidden">
                        {musicBrainzMatch.coverArtUrl ? (
                          <Image
                            src={musicBrainzMatch.coverArtUrl}
                            alt="MusicBrainz cover"
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-walnut/30 text-xs">
                            No cover
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match details */}
                  <div className="bg-warm-white rounded-lg p-3 text-sm">
                    <p className="text-walnut">
                      <span className="font-medium">{musicBrainzMatch.title}</span>
                      {' '}by {musicBrainzMatch.artist}
                    </p>
                    {musicBrainzMatch.releaseDate && (
                      <p className="text-walnut/60">
                        Released: {musicBrainzMatch.releaseDate.split('-')[0]}
                        {musicBrainzMatch.label && ` • ${musicBrainzMatch.label}`}
                      </p>
                    )}
                    <p className="text-walnut/60">
                      {musicBrainzMatch.trackCount} tracks
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAcceptMusicBrainz(false)}
                        className="flex-1 py-2 px-3 bg-sage text-warm-white rounded-lg text-sm font-medium hover:bg-sage/90 transition-colors"
                      >
                        Use Info, Keep My Photo
                      </button>
                      {musicBrainzMatch.coverArtUrl && (
                        <button
                          type="button"
                          onClick={() => handleAcceptMusicBrainz(true)}
                          className="flex-1 py-2 px-3 bg-burnt-orange text-warm-white rounded-lg text-sm font-medium hover:bg-burnt-orange/90 transition-colors"
                        >
                          Use Info + Cover
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRejectMusicBrainz}
                      className="py-2 px-3 border border-walnut/20 text-walnut rounded-lg text-sm hover:bg-tan/50 transition-colors"
                    >
                      Not a Match - Use My Photo Only
                    </button>
                  </div>
                </div>
              ) : musicBrainzApproval.status === 'accepted' ? (
                // User accepted the match
                <>
                  <div className="flex items-center gap-2 text-sage mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Album info confirmed!</span>
                  </div>
                  <p className="text-sm text-walnut/60">
                    Using: {title} by {artist}
                    {musicBrainzMatch?.trackCount && ` • ${musicBrainzMatch.trackCount} tracks`}
                  </p>
                </>
              ) : musicBrainzApproval.status === 'rejected' ? (
                // User rejected the match
                <>
                  <div className="flex items-center gap-2 text-mustard mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Using your photo only</span>
                  </div>
                  <p className="text-sm text-walnut/60">
                    Please verify the album details below.
                  </p>
                </>
              ) : recognition.result.extraction.title || recognition.result.extraction.artist ? (
                // Partial success - Claude detected something but not found in MusicBrainz
                <>
                  <div className="flex items-center gap-2 text-mustard mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Partial match</span>
                  </div>
                  <p className="text-sm text-walnut/60">
                    Detected: {recognition.result.extraction.title || 'Unknown title'} by {recognition.result.extraction.artist || 'Unknown artist'}
                  </p>
                  <p className="text-sm text-walnut/40 mt-1">
                    Could not find full album details. Please verify and complete the info below.
                  </p>
                </>
              ) : (
                // No recognition - couldn't identify anything
                <>
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Could not recognize album</span>
                  </div>
                  <p className="text-sm text-walnut/60">
                    Unable to identify the album from this photo. Try a clearer image or enter the details manually below.
                  </p>
                </>
              )}
              {/* Preprocessing info */}
              {recognition.result.preprocessing?.applied && processedImageDataUrl && !recognition.result.metadata?.coverArtUrl && (
                <div className="mt-3 p-3 bg-sage/10 rounded-lg border border-sage/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-sage">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        Image enhanced
                        {recognition.result.preprocessing.analysis.rotationDegrees !== 0 && (
                          <span className="text-walnut/50">
                            {' '}(rotated {Math.abs(recognition.result.preprocessing.analysis.rotationDegrees).toFixed(0)}°)
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUseProcessedImage(!useProcessedImage)
                        setCoverPreview(useProcessedImage ? originalImageDataUrl : processedImageDataUrl)
                      }}
                      className="text-sm text-burnt-orange hover:underline"
                    >
                      {useProcessedImage ? 'Use original' : 'Use enhanced'}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setRecognition({ status: 'idle' })
                  setProcessedImageDataUrl(null)
                  setOriginalImageDataUrl(null)
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

          {/* MusicBrainz lookup options — shown when no scan active and no approval pending */}
          {!isRecognizing && musicBrainzApproval.status === 'none' && recognition.status !== 'searching' && (
            <div className="space-y-2">
              {title.trim() && artist.trim() && (
                <button
                  type="button"
                  onClick={handleManualLookup}
                  className="flex items-center gap-2 text-sm text-burnt-orange hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Look up on MusicBrainz
                </button>
              )}
              {showCatalogSearch ? (
                <div className="pt-2">
                  <AlbumSearch
                    onSelect={handleCatalogSelect}
                    actionLabel="Use This Album"
                    onCancel={() => setShowCatalogSearch(false)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCatalogSearch(true)}
                  className="flex items-center gap-2 text-sm text-walnut/60 hover:text-walnut hover:underline transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search catalog
                </button>
              )}
            </div>
          )}

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
