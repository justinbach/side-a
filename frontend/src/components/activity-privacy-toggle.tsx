'use client'

import { useState } from 'react'
import { updateActivityPrivacy } from '@/app/actions/update-privacy-settings'

export function ActivityPrivacyToggle({ initialValue }: { initialValue: boolean }) {
  const [shareActivity, setShareActivity] = useState(initialValue)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async () => {
    setIsUpdating(true)

    // Optimistic update
    const newValue = !shareActivity
    setShareActivity(newValue)

    const result = await updateActivityPrivacy(newValue)

    setIsUpdating(false)

    if (!result.success) {
      // Revert on error
      setShareActivity(!newValue)
      console.error('Failed to update privacy setting:', result.error)
    }
  }

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <label htmlFor="share-activity" className="block font-medium text-walnut mb-1">
          Share my listening activity
        </label>
        <p className="text-sm text-walnut/60">
          When enabled, people who follow you or share collections with you can see your recent plays in their feed
        </p>
      </div>
      <button
        id="share-activity"
        type="button"
        role="switch"
        aria-checked={shareActivity}
        disabled={isUpdating}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-burnt-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          shareActivity ? 'bg-burnt-orange' : 'bg-walnut/20'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-warm-white shadow ring-0 transition duration-200 ease-in-out ${
            shareActivity ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
