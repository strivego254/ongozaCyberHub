'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card } from '@/components/ui/Card'

export default function UserSubscriptionsPage() {
  return (
    <RouteGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-defender">User Subscriptions</h1>
            <p className="text-och-steel">Manage individual user subscriptions</p>
          </div>
          <Card className="p-6">
            <p className="text-och-steel">User subscription management interface coming soon...</p>
            <p className="text-och-steel text-sm mt-2">
              This will allow you to view, upgrade, downgrade, and manage user subscriptions.
            </p>
          </Card>
        </div>
      </AdminLayout>
    </RouteGuard>
  )
}









