'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 64   // px pulled before release triggers refresh
const MAX_PULL = 100   // px — caps the visual overshoot
const RESISTANCE = 0.45 // pull distance multiplier (feels heavier than 1:1)

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef<number | null>(null)
  const pullingRef = useRef(false)

  const doRefresh = useCallback(async () => {
    setRefreshing(true)
    setPullDistance(0)
    router.refresh()
    // Hold the spinner briefly so it doesn't flash and disappear
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }, [router])

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      // Only initiate if already at the top of the page
      if (window.scrollY !== 0) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = false
    }

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshing) return
      if (window.scrollY !== 0) { startYRef.current = null; return }

      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) return

      pullingRef.current = true
      // Prevent the browser's native scroll/bounce while we handle the pull
      e.preventDefault()
      setPullDistance(Math.min(delta * RESISTANCE, MAX_PULL))
    }

    const onTouchEnd = () => {
      if (!pullingRef.current) return
      startYRef.current = null
      pullingRef.current = false

      if (pullDistance >= THRESHOLD) {
        doRefresh()
      } else {
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullDistance, refreshing, doRefresh])

  const indicatorVisible = pullDistance > 0 || refreshing
  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div className="relative">
      {/* Pull indicator */}
      {indicatorVisible && (
        <div
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-10 transition-all"
          style={{ top: refreshing ? 12 : pullDistance - 40 }}
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-full bg-warm-white border border-walnut/10 shadow-sm transition-transform ${refreshing ? 'scale-100' : ''}`}
            style={{ transform: `scale(${0.5 + progress * 0.5})` }}
          >
            {refreshing ? (
              // Spinning loader
              <svg className="w-4 h-4 text-burnt-orange animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 100 10h-2a8 8 0 01-8-8z" />
              </svg>
            ) : (
              // Downward arrow that rotates to a checkmark as you pull
              <svg
                className="w-4 h-4 text-burnt-orange transition-transform duration-150"
                style={{ transform: `rotate(${progress * 180}deg)` }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content pushed down while pulling */}
      <div style={{ transform: `translateY(${refreshing ? 0 : pullDistance}px)`, transition: pullingRef.current ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </div>
  )
}
