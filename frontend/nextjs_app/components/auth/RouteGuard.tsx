'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { hasRouteAccess } from '@/utils/rbac'
import { getRedirectRoute } from '@/utils/redirect'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function RouteGuard({ children, requiredRoles: _requiredRoles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.push('/login/student')
      return
    }

    // Check if user has access to current route
    const currentPath = window.location.pathname
    
    // CRITICAL: Check for admin role first
    const userRoles = user?.roles || []
    const isAdmin = userRoles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })
    
    // If user is admin and trying to access admin routes, allow it
    if (isAdmin && currentPath.startsWith('/dashboard/admin')) {
      console.log('✅ RouteGuard: Admin user accessing admin route - allowing access')
      return
    }
    
    // Check route access for non-admin or non-admin routes
    if (!hasRouteAccess(user, currentPath)) {
      console.log('⚠️ RouteGuard: User does not have access to route:', currentPath)
      // Use centralized redirect utility which handles admin priority
      const dashboardRoute = getRedirectRoute(user)
      console.log('📍 RouteGuard: Redirecting to:', dashboardRoute)
      router.push(dashboardRoute)
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const currentPath = window.location.pathname
  
  // CRITICAL: Check for admin role first
  const userRoles = user?.roles || []
  const isAdmin = userRoles.some((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    return roleName?.toLowerCase().trim() === 'admin'
  })
  
  // If user is admin and trying to access admin routes, allow it
  if (isAdmin && currentPath.startsWith('/dashboard/admin')) {
    return <>{children}</>
  }
  
  // Check route access for other routes
  if (!hasRouteAccess(user, currentPath)) {
    return null
  }

  return <>{children}</>
}

