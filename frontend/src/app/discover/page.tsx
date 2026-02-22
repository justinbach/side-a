import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserSearch } from '@/components/user-search'
import { SuggestedUsers } from '@/components/suggested-users'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/feed"
          className="inline-flex items-center text-walnut/60 hover:text-walnut mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </Link>

        <h1 className="font-serif text-3xl font-bold text-walnut mb-2">
          Discover Users
        </h1>
        <p className="text-walnut/60 mb-8">
          Find and follow other vinyl collectors
        </p>

        {/* Search */}
        <div className="mb-12">
          <UserSearch currentUserId={user.id} />
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="font-serif text-xl text-walnut mb-4">People in Your Collections</h2>
          <SuggestedUsers currentUserId={user.id} />
        </div>
      </div>
    </main>
  )
}
