/**
 * Next.js Middleware
 * Handles authentication checks and RBAC-based route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const hasToken = !!accessToken;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isDirectorRoute = pathname.startsWith('/dashboard/director');

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !hasToken) {
    // Redirect to director login for director routes, otherwise student login
    const loginPath = isDirectorRoute ? '/login/director' : '/login/student';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC check is handled client-side after user data is fetched
  // Middleware only checks for authentication token presence
  // Full role-based access control happens in page components

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

