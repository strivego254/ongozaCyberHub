'use client'

import { RouteGuard } from '@/components/auth/RouteGuard'
import StudentClient from './student-client'

export default function StudentDashboard() {
  return (
    <RouteGuard>
      <StudentClient />
    </RouteGuard>
  )
}

