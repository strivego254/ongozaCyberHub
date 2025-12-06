'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import SponsorDashboardClient from './sponsor-dashboard-client'

export default function SponsorDashboardPage() {
  return (
    <RouteGuard>
      <SponsorDashboardClient />
    </RouteGuard>
  )
}
