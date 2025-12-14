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
    // Wait for auth state to be determined
    if (isLoading) return

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isDirectorRoute = currentPath.startsWith('/dashboard/director')

    // Only redirect if we're definitely not authenticated
    // Give a small delay to allow auth state to settle after login
    if (!isAuthenticated || !user) {
      // Check if token exists in storage (might be a timing issue)
      const hasToken = typeof window !== 'undefined' && (
        localStorage.getItem('access_token') || 
        document.cookie.includes('access_token=')
      )
      
      if (!hasToken) {
        console.log('RouteGuard: No auth token found, redirecting to login')
        // Redirect to director login if accessing director routes, otherwise student login
        const loginRoute = isDirectorRoute ? '/login/director' : '/login/student'
        if (typeof window !== 'undefined') {
          const redirectUrl = `${loginRoute}?redirect=${encodeURIComponent(currentPath)}`
          router.push(redirectUrl)
        }
        return
      } else {
        // Token exists but user not loaded yet - wait a bit
        console.log('RouteGuard: Token exists but user not loaded, waiting...')
        return
      }
    }

    // Check if user has access to current route
    // CRITICAL: Check for admin role first
    const userRoles = user?.roles || []
    const isAdmin = userRoles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return roleName?.toLowerCase().trim() === 'admin'
    })
    
    const isProgramDirector = userRoles.some((ur: any) => {
      const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      const normalized = roleName?.toLowerCase().trim()
      return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
    })
    
    // If accessing director routes, check for director or admin role
    if (isDirectorRoute) {
      if (!isAdmin && !isProgramDirector) {
        console.log('⚠️ RouteGuard: User does not have program_director or admin role, redirecting to login')
        const redirectUrl = `/login/director?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
        return
      }
      // Admin or program_director accessing director route - allow
      console.log('✅ RouteGuard: Admin or program_director accessing director route - allowing access')
      return
    }
    
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

  // If not authenticated but token exists, show loading (auth state might be updating)
  if (!isAuthenticated || !user) {
    const hasToken = typeof window !== 'undefined' && (
      localStorage.getItem('access_token') || 
      document.cookie.includes('access_token=')
    )
    
    if (hasToken) {
      // Token exists but user not loaded - show loading
      return (
        <div className="min-h-screen bg-och-midnight flex items-center justify-center">
          <div className="text-och-steel">Loading...</div>
        </div>
      )
    }
    
    return null
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
  const isDirectorRoute = currentPath.startsWith('/dashboard/director')
  
  // CRITICAL: Check for admin role first
  const userRoles = user?.roles || []
  const isAdmin = userRoles.some((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    return roleName?.toLowerCase().trim() === 'admin'
  })
  
  const isProgramDirector = userRoles.some((ur: any) => {
    const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
    const normalized = roleName?.toLowerCase().trim()
    return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
  })
  
  // If accessing director routes, require admin or program_director role
  if (isDirectorRoute) {
    if (!isAdmin && !isProgramDirector) {
      // Redirect to director login if not authorized
      if (typeof window !== 'undefined') {
        const redirectUrl = `/login/director?redirect=${encodeURIComponent(currentPath)}`
        router.push(redirectUrl)
      }
      return null
    }
    // Admin or program_director accessing director route - allow
    return <>{children}</>
  }
  
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

