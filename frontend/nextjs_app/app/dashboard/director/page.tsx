'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import DirectorDashboardClient from './director-dashboard-client'

export default function DirectorDashboard() {
  return (
    <RouteGuard>
      <DirectorDashboardClient />
    </RouteGuard>
  )
}
