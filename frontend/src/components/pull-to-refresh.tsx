'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const maxPullDistance = 80 // Maximum pull distance in pixels
  const releaseThreshold = 60 // Distance needed to trigger refresh

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startY = 0
    let currentY = 0
    let isDragging = false

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if we're at the top of the scrollable container
      // Use small tolerance (5px) for edge cases where scroll isn't exactly 0
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      if (scrollTop > 5) return

      startY = e.touches[0].clientY
      touchStartY.current = startY
      isDragging = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || refreshing) return

      currentY = e.touches[0].clientY
      const diff = currentY - startY

      // Only pull down (positive diff) and only if at top of page
      // Use small tolerance (5px) for edge cases where scroll isn't exactly 0
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      if (diff > 0 && scrollTop <= 5) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault()

        // Apply resistance (diminishing returns as you pull further)
        const distance = Math.min(diff * 0.5, maxPullDistance)
        setPullDistance(distance)
        setPulling(distance > 20)
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging) return
      isDragging = false

      if (pullDistance >= releaseThreshold && !refreshing) {
        setRefreshing(true)
        setPulling(false)

        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPullDistance(0)
        }
      } else {
        // Snap back if didn't pull far enough
        setPullDistance(0)
        setPulling(false)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, refreshing, onRefresh])

  const spinnerOpacity = pulling || refreshing ? 1 : 0
  const spinnerScale = pullDistance / releaseThreshold

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-opacity duration-200"
        style={{
          height: maxPullDistance,
          transform: `translateY(${pullDistance - maxPullDistance}px)`,
          opacity: spinnerOpacity,
        }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{
            transform: `scale(${Math.min(spinnerScale, 1)}) ${refreshing ? 'rotate(0deg)' : ''}`,
            transition: refreshing ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {/* Spinner circle */}
          <svg
            className={`w-8 h-8 text-burnt-orange ${refreshing ? 'animate-spin' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pulling || refreshing ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
