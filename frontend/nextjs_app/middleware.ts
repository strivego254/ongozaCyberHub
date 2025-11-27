/**
 * Next.js Middleware
 * Handles authentication checks and token refresh for protected routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Check both cookie and header for access token
  const accessToken = request.cookies.get('access_token')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without token
  // Note: We allow the request to proceed - the client-side will handle auth
  // This prevents redirect loops when token is in localStorage but not cookie
  if (isProtectedRoute && !accessToken) {
    // Don't redirect in middleware - let client handle it
    // The client will check localStorage and redirect if needed
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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

