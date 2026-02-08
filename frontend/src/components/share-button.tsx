'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  text: string
  url?: string
  className?: string
  iconOnly?: boolean
}

export function ShareButton({ title, text, url, className = '', iconOnly = false }: ShareButtonProps) {
  const [showFallback, setShowFallback] = useState(false)
  const [copied, setCopied] = useState(false)

  const canShare = typeof navigator !== 'undefined' && navigator.share

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
    }

    if (canShare) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        // User cancelled or share failed
        if (err instanceof Error && err.name !== 'AbortError') {
          // Show fallback if share failed for reasons other than user cancellation
          setShowFallback(true)
        }
      }
    } else {
      // No native share support, show fallback
      setShowFallback(true)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url || window.location.href)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setShowFallback(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (showFallback) {
    return (
      <div className="fixed inset-0 bg-walnut/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFallback(false)}>
        <div className="bg-warm-white rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-serif text-xl text-walnut mb-4">Share</h3>
          <p className="text-sm text-walnut/60 mb-4">{text}</p>
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={() => setShowFallback(false)}
            className="w-full mt-2 px-4 py-2 text-walnut/60 hover:text-walnut transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleShare}
        className={`text-walnut/50 hover:text-walnut transition-colors p-1 ${className}`}
        title="Share"
        aria-label="Share"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-walnut/20 bg-warm-white hover:bg-tan/30 text-walnut transition-colors ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  )
}
