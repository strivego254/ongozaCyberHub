/**
 * Next.js Middleware
 * Handles authentication checks and RBAC-based route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup'];

function getLoginRouteForPath(pathname: string) {
  if (pathname.startsWith('/dashboard/director')) return '/login/director'
  if (pathname.startsWith('/dashboard/admin')) return '/login/admin'
  if (pathname.startsWith('/dashboard/mentor')) return '/login/mentor'
  if (pathname.startsWith('/dashboard/sponsor')) return '/login/sponsor'
  if (pathname.startsWith('/dashboard/analyst') || pathname.startsWith('/dashboard/analytics')) return '/login/analyst'
  if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return '/login/employer'
  if (pathname.startsWith('/dashboard/finance')) return '/login/finance'
  return '/login/student'
}

function parseRolesCookie(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // ignore
  }
  // fallback comma-separated
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function dashboardForRole(role: string | null): string {
  switch (role) {
    case 'admin': return '/dashboard/admin'
    case 'program_director': return '/dashboard/director'
    case 'mentor': return '/dashboard/mentor'
    case 'analyst': return '/dashboard/analyst'
    case 'sponsor_admin': return '/dashboard/sponsor'
    case 'employer': return '/dashboard/employer'
    case 'finance': return '/dashboard/finance'
    case 'mentee':
    case 'student':
    default:
      return '/dashboard/student'
  }
}

function canAccess(pathname: string, roles: string[]): boolean {
  if (roles.includes('admin')) return true
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (pathname.startsWith('/dashboard/director')) return roles.includes('program_director')
    if (pathname.startsWith('/dashboard/admin')) return roles.includes('admin')
    if (pathname.startsWith('/dashboard/mentor')) return roles.includes('mentor')
    if (pathname.startsWith('/dashboard/sponsor')) return roles.includes('sponsor_admin')
    if (pathname.startsWith('/dashboard/analyst')) return roles.includes('analyst')
    if (pathname.startsWith('/dashboard/analytics')) return roles.includes('analyst') || roles.includes('program_director')
    if (pathname.startsWith('/dashboard/employer') || pathname.startsWith('/dashboard/marketplace')) return roles.includes('employer')
    if (pathname.startsWith('/dashboard/finance')) return roles.includes('finance')
    // Student routes (catch-all for other dashboard paths)
    return roles.includes('student') || roles.includes('mentee')
  }
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const hasToken = !!accessToken;
  const rolesCookie = request.cookies.get('och_roles')?.value;
  const primaryRoleCookie = request.cookies.get('och_primary_role')?.value || null;
  const dashboardCookie = request.cookies.get('och_dashboard')?.value || null;
  const roles = parseRolesCookie(rolesCookie);
  const home = dashboardCookie || dashboardForRole(primaryRoleCookie);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const loginPath = getLoginRouteForPath(pathname);

  // CRITICAL: Don't redirect if user is on login page and already has a token
  // This prevents redirect loops after successful login
  if (isAuthRoute && hasToken) {
    // Allow login page to handle the redirect client-side
    // This prevents middleware from interfering with post-login flow
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !hasToken) {
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user hits auth pages, redirect them to their dashboard
  if (isAuthRoute && hasToken && home) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Server-side RBAC for dashboard routes (best effort; falls back to client guard if roles cookie missing)
  if (hasToken && pathname.startsWith('/dashboard') && roles.length > 0) {
    // Redirect /dashboard to role home
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(home, request.url));
    }

    if (!canAccess(pathname, roles)) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  // Allow auth routes to be accessed even with token (client handles redirect)
  // This prevents middleware from interfering with post-login redirects

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};

