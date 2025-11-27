/**
 * Next.js API Route: Logout
 * Handles logout and clears HttpOnly cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearServerAuthTokens } from '@/utils/auth-server';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      try {
        // Call Django logout endpoint
        const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
        await fetch(`${DJANGO_API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${request.cookies.get('access_token')?.value || ''}`,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
      }
    }

    // Clear cookies
    const response = NextResponse.json({ detail: 'Logged out successfully' });
    await clearServerAuthTokens();

    // Manually clear cookies in response
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error: any) {
    // Still clear cookies even on error
    const response = NextResponse.json(
      {
        error: error.message || 'Logout failed',
        detail: 'An error occurred during logout',
      },
      { status: 500 }
    );
    await clearServerAuthTokens();
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }
}
