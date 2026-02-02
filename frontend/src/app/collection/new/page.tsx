'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function NewRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const collectionId = searchParams.get('collectionId')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!collectionId) {
      setError('No collection ID provided')
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createClient()

    let coverImageUrl: string | null = null

    // Upload cover image if provided
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
              disabled={loading}
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
