'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sendInviteEmail } from '@/app/actions/send-invite-email'

export function InviteMemberForm({
  collectionId,
  collectionName,
}: {
  collectionId: string
  collectionName: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('collection_members')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Check if the email belongs to an existing user who is already a member
      // For now, we'll just create the invitation
    }

    // Create invitation
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        collection_id: collectionId,
        email: email.toLowerCase().trim(),
        invited_by: user.id,
      })

    setLoading(false)

    if (inviteError) {
      if (inviteError.code === '23505') {
        setError('This email has already been invited')
      } else {
        setError(inviteError.message)
      }
      return
    }

    // Send invite email (non-blocking, don't fail if email fails)
    const inviteeEmail = email.toLowerCase().trim()
    sendInviteEmail({
      toEmail: inviteeEmail,
      inviterName: user.email || 'Someone',
      collectionName,
    }).catch(console.error)

    setSuccess(true)
    setEmail('')
    router.refresh()

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-walnut mb-1">
          Email address
        </label>
        <div className="flex gap-3">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="friend@example.com"
            className="flex-1 px-4 py-3 rounded-lg border border-walnut/20 bg-cream focus:outline-none focus:ring-2 focus:ring-burnt-orange/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-burnt-orange text-warm-white rounded-lg font-medium hover:bg-burnt-orange/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Invite'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-sage bg-sage/10 p-3 rounded-lg">
          Invitation sent! They will see your collection when they sign up or log in.
        </p>
      )}
    </form>
  )
}
