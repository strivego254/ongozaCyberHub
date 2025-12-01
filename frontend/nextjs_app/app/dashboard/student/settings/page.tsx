'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-och-mint">Settings</h1>
          <p className="text-och-steel">
            Profile management, subscriptions, notifications, preferences
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Profile</h2>
            <div className="space-y-4">
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
              <Button variant="mint">Save Changes</Button>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Email Notifications</div>
                  <div className="text-sm text-och-steel">Receive email updates about your progress</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Mentor Messages</div>
                  <div className="text-sm text-och-steel">Get notified when your mentor sends feedback</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Mission Deadlines</div>
                  <div className="text-sm text-och-steel">Reminders for upcoming deadlines</div>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Community Updates</div>
                  <div className="text-sm text-och-steel">New posts and discussions in your groups</div>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white">Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Timezone
                </label>
                <select className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender">
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                  <option>Asia/Tokyo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-och-steel mb-2">
                  Language
                </label>
                <select className="w-full px-4 py-2 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-defender">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-4 text-white text-och-orange">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-white mb-2">Delete Account</div>
                <div className="text-sm text-och-steel mb-3">
                  Permanently delete your account and all associated data
                </div>
                <Button variant="orange">Delete Account</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

