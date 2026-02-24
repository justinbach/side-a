import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ActivityPrivacyToggle } from '@/components/activity-privacy-toggle'
import { SignOutButton } from '@/components/sign-out-button'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch current profile settings
  const { data: profile } = await supabase
    .from('profiles')
    .select('share_activity')
    .eq('id', user.id)
    .single()

  const shareActivity = profile?.share_activity ?? true

  return (
    <main className="min-h-screen p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl font-bold text-walnut mb-2">
          Profile Settings
        </h1>
        <p className="text-walnut/60 mb-8">
          Manage your account and privacy preferences
        </p>

        {/* Privacy Section */}
        <section className="mb-10">
          <h2 className="font-serif text-xl text-walnut mb-4">Privacy</h2>
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-6">
            <ActivityPrivacyToggle initialValue={shareActivity} />
          </div>
        </section>

        {/* Account Info */}
        <section className="mb-10">
          <h2 className="font-serif text-xl text-walnut mb-4">Account</h2>
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-walnut/60 mb-1">Email</label>
                <p className="text-walnut">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-walnut/60 mb-1">User ID</label>
                <p className="text-xs text-walnut/40 font-mono">{user.id}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <div className="bg-warm-white rounded-xl border border-walnut/10 p-6 flex items-center justify-between">
            <div>
              <p className="text-walnut font-medium">Sign out</p>
              <p className="text-sm text-walnut/60">Sign out of your account on this device</p>
            </div>
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  )
}
