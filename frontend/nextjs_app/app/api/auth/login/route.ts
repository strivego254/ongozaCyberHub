/**
 * Next.js API Route: Login
 * Handles login and sets HttpOnly cookies for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiGateway } from '@/services/apiGateway';
import { setServerAuthTokens } from '@/utils/auth-server';
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

    // Set tokens in HttpOnly cookies (server-side)
    await setServerAuthTokens(data.access_token, data.refresh_token);

    // Return response without tokens (security best practice)
    return NextResponse.json({
      user: data.user,
      // Don't expose tokens in response body
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Login failed',
        detail: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}

