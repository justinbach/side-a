'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function BottomNav() {
  const pathname = usePathname()

  // Hide on auth pages
  if (pathname === '/login' || pathname === '/signup') return null

  const isActive = (pattern: string) => {
    if (pattern === '/collection') {
      return pathname === '/collection' || pathname.startsWith('/collection/')
    }
    if (pattern === '/feed') return pathname === '/feed'
    if (pattern === '/wishlist') return pathname === '/wishlist'
    if (pattern === '/profile') return pathname.startsWith('/profile/')
    return false
  }

  const tabClass = (pattern: string) =>
    `flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
      isActive(pattern)
        ? 'text-burnt-orange'
        : 'text-walnut/50 hover:text-walnut'
    }`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-cream border-t border-walnut/10 flex z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Home */}
      <Link href="/collection" className={tabClass('/collection')}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Home</span>
      </Link>

      {/* Feed */}
      <Link href="/feed" className={tabClass('/feed')}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span>Feed</span>
      </Link>

      {/* Wish List */}
      <Link href="/wishlist" className={tabClass('/wishlist')}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>Wish List</span>
      </Link>

      {/* Profile */}
      <Link href="/profile/me" className={tabClass('/profile')}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Profile</span>
      </Link>
    </nav>
  )
}
