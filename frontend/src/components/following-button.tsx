'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

type FollowedUser = {
  id: string
  display_name: string | null
}

export function FollowingButton({ following }: { following: FollowedUser[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const count = following.length

  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Trap focus / prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-walnut/50 hover:text-walnut transition-colors underline-offset-2 hover:underline"
      >
        Following {count} {count === 1 ? 'person' : 'people'}
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="People you follow"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-walnut/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={modalRef}
            className="relative w-full sm:max-w-sm bg-cream rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[70vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-walnut/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-walnut/10 flex-shrink-0">
              <h2 className="font-serif text-lg font-semibold text-walnut">
                Following
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-walnut/40 hover:text-walnut transition-colors p-1 -mr-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 py-2">
              {following.length === 0 ? (
                <p className="text-sm text-walnut/50 text-center py-8 px-5">
                  You aren&apos;t following anyone yet.
                </p>
              ) : (
                <ul>
                  {following.map((person) => (
                    <li key={person.id}>
                      <Link
                        href={`/profile/${person.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-walnut/5 transition-colors"
                      >
                        {/* Avatar placeholder */}
                        <div className="w-9 h-9 rounded-full bg-tan flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-walnut/60">
                            {(person.display_name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-walnut font-medium">
                          {person.display_name || 'Unknown User'}
                        </span>
                        <svg className="w-4 h-4 text-walnut/30 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
