'use client'

import MissionsClient from './missions-client'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { DashboardProviders } from '../providers'

export default function MissionsPage() {
  return (
    <RouteGuard>
      <DashboardProviders>
        <MissionsClient />
      </DashboardProviders>
    </RouteGuard>
  )
}

