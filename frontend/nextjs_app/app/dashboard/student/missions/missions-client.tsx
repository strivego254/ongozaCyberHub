/**
 * Redesigned Missions Client
 * Main entry point for the Student Missions experience
 * Uses the MissionsHub as the primary layout
 */
'use client'

import { MissionsHub } from '@/components/ui/missions/MissionsHub'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function MissionsClient() {
  return (
    <div className="w-full">
      <MissionsHub />
    </div>
  )
}
