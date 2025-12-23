'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { CommunityDashboard } from '@/components/community/CommunityDashboard'

export default function CommunityPage() {
  return (
    <RouteGuard>
      <div className="p-6">
        <CommunityDashboard />
      </div>
    </RouteGuard>
  )
}

