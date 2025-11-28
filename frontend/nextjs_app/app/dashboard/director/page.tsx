'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import DirectorClient from './director-client'

export default function DirectorDashboard() {
  return (
    <RouteGuard>
      <DirectorClient />
    </RouteGuard>
  )
}

