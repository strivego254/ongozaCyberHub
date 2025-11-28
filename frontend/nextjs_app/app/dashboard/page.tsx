'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login/student')
        return
      }

      // Redirect based on user's primary role
      if (user?.roles && user.roles.length > 0) {
        const primaryRole = user.roles[0].role
        
        // Map backend role names to frontend routes
        const roleRouteMap: Record<string, string> = {
          'mentee': '/dashboard/student',
          'student': '/dashboard/student',
          'mentor': '/dashboard/mentor',
          'admin': '/dashboard/admin',
          'program_director': '/dashboard/director',
          'sponsor_admin': '/dashboard/sponsor',
          'analyst': '/dashboard/analyst',
        }

        const route = roleRouteMap[primaryRole] || '/dashboard/student'
        router.push(route)
      } else {
        // Default to student dashboard if no roles assigned
        router.push('/dashboard/student')
      }
    }
  }, [user, isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Loading...</div>
      </div>
    )
  }

  return null
}

