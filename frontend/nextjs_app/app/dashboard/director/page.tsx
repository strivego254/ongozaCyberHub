'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import DirectorManagementClient from './director-management-client'

export default function DirectorDashboard() {
  return (
    <RouteGuard>
      <DirectorManagementClient />
    </RouteGuard>
  )
}
