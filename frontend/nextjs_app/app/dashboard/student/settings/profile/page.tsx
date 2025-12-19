'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { getUserRoleDisplay } from '@/utils/formatRole'

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const userRole = getUserRoleDisplay(user)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Profile Settings</h1>
          <p className="text-och-steel">
            Manage your personal information and profile
          </p>
        </div>

        <Card>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-och-defender flex items-center justify-center text-white text-2xl font-semibold">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <Button variant="outline">Upload New Photo</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.first_name || ''}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  defaultValue={user?.last_name || ''}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Role
              </label>
              <div className="w-full px-4 py-2 bg-och-midnight/50 border border-och-steel/20 rounded-lg text-och-mint">
                {userRole}
              </div>
              <p className="text-xs text-och-steel mt-1">Your role is determined by your account permissions</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-och-steel mb-2">
                Bio
              </label>
              <textarea
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="mint">Save Changes</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

