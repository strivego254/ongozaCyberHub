/**
 * Next.js API Route: Login
 * Handles login and sets HttpOnly cookies for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest, LoginResponse } from '@/services/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // Call Django API directly (bypass apiGateway to avoid cookie dependency)
    const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    const response = await fetch(`${DJANGO_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: errorData.detail || 'Invalid credentials',
        },
        { status: response.status }
      );
    }

    const data: LoginResponse = await response.json();

    // Create response first
    const nextResponse = NextResponse.json({
      user: data.user,
      access_token: data.access_token, // Return access token for localStorage
      // Don't return refresh_token - it's HttpOnly only
    });

    // Set cookies directly on the response object
    // This ensures cookies are available on the next request
    nextResponse.cookies.set('access_token', data.access_token, {
      httpOnly: false, // Allow client-side access for Authorization header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    nextResponse.cookies.set('refresh_token', data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return nextResponse;
  } catch (error: any) {
    console.error('Login API route error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An error occurred during login';
    let errorDetail = 'Please try again or contact support if the problem persists.';
    
    if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to server';
      errorDetail = 'The backend server is not running. Please ensure the Django API is running on port 8000.';
    } else if (error.message) {
      errorDetail = error.message;
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        detail: errorDetail,
      },
      { status: 500 }
    );
  }
}

