'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { hasRouteAccess } from '@/utils/rbac'
import { getRedirectRoute } from '@/utils/redirect'
import { getUserRoles } from '@/utils/rbac'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function RouteGuard({ children, requiredRoles: _requiredRoles }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  const getLoginRouteForPath = (path: string) => {
    if (path.startsWith('/dashboard/director')) return '/login/director'
    if (path.startsWith('/dashboard/admin')) return '/login/admin'
    if (path.startsWith('/dashboard/mentor')) return '/login/mentor'
    if (path.startsWith('/dashboard/sponsor')) return '/login/sponsor'
    if (path.startsWith('/dashboard/analyst') || path.startsWith('/dashboard/analytics')) return '/login/analyst'
    if (path.startsWith('/dashboard/employer') || path.startsWith('/dashboard/marketplace')) return '/login/employer'
    return '/login/student'
  }

  useEffect(() => {
    // Wait for auth state to be determined
    if (isLoading) return

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''

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
        const loginRoute = getLoginRouteForPath(currentPath)
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

    // If requiredRoles is provided, enforce it (in addition to route permissions)
    if (_requiredRoles && _requiredRoles.length > 0) {
      const roles = getUserRoles(user)
      const ok = _requiredRoles.some(r => roles.includes(r as any))
      if (!ok) {
        router.push(getRedirectRoute(user))
        return
      }
    }

    if (!hasRouteAccess(user, currentPath)) {
      router.push(getRedirectRoute(user))
      return
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

  if (_requiredRoles && _requiredRoles.length > 0) {
    const roles = getUserRoles(user)
    const ok = _requiredRoles.some(r => roles.includes(r as any))
    if (!ok) return null
  }

  if (!hasRouteAccess(user, currentPath)) return null

  return <>{children}</>
}

