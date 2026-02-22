'use client'

import { useEffect, useState } from 'react'

export function PwaUpdateBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          // New SW is active and skipWaiting has fired — show banner
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            setShowBanner(true)
          }
        })
      })
    })
  }, [])

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-walnut text-warm-white px-5 py-3 rounded-xl shadow-lg">
      <span className="text-sm">Update available</span>
      <button
        onClick={() => window.location.reload()}
        className="text-sm font-medium text-burnt-orange hover:text-burnt-orange/80 transition-colors whitespace-nowrap"
      >
        Reload
      </button>
      <button
        onClick={() => setShowBanner(false)}
        className="text-warm-white/50 hover:text-warm-white transition-colors ml-1"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
