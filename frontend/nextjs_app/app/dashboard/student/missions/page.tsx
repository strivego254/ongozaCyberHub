'use client'

import MissionsClient from './missions-client'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function MissionsPage() {
  return (
    <RouteGuard>
      <MissionsClient />
    </RouteGuard>
  )
}

