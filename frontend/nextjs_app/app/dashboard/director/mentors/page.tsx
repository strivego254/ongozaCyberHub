'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import MentorsClient from './mentors-client'

export default function MentorsPage() {
  return (
    <RouteGuard>
      <MentorsClient />
    </RouteGuard>
  )
}










