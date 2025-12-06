'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-och-gold">Platform Settings</h1>
            <p className="text-och-steel">Configure system settings and integrations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    System Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Integration Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Subscription Rules
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Payment Gateway Settings
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Security & API</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Security Policies
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Webhook Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    MFA Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Rate Limiting
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Content Management</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Curriculum
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Missions
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Tracks
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Programs
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notifications</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Email Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Notification Rules
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Alert Configuration
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}

