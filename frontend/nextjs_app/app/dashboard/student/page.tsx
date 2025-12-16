'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import { DashboardProviders } from './providers'
import StudentClient from './student-client'

export default function StudentDashboard() {
  return (
    <RouteGuard>
      <DashboardProviders>
        <StudentClient />
      </DashboardProviders>
    </RouteGuard>
  )
}

