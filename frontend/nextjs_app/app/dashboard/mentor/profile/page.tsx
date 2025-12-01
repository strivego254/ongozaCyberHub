'use client'

import { MentorProfileManagement } from '@/components/mentor/MentorProfileManagement'

export default function ProfilePage() {
  return (
    <div className="w-full max-w-7xl py-6 px-4 sm:px-6 lg:px-6 xl:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-och-mint">Mentor Profile</h1>
        <p className="text-och-steel">
          Manage your profile, expertise tags, and availability.
        </p>
      </div>

      <MentorProfileManagement />
    </div>
  )
}


