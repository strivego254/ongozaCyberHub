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
    const loginUrl = `${DJANGO_API_URL}/api/v1/auth/login`;
    
    console.log('Login API route: Calling Django login endpoint:', loginUrl);
    
    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (fetchError: any) {
      console.error('Login API route: Fetch error', fetchError);
      return NextResponse.json(
        {
          error: 'Cannot connect to server',
          detail: fetchError.message || 'The backend server is not running. Please ensure the Django API is running on port 8000.',
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login API route: Django returned error', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: errorData.detail || errorData.error || 'Invalid credentials',
        },
        { status: response.status }
      );
    }

    let data: LoginResponse;
    try {
      const responseText = await response.text();
      console.log('Login API route: Django response text (first 200 chars):', responseText.substring(0, 200));
      
      data = JSON.parse(responseText);
      console.log('Login API route: Parsed Django response', {
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        hasUser: !!data.user,
        userEmail: data.user?.email,
        keys: Object.keys(data),
      });
    } catch (parseError: any) {
      console.error('Login API route: Failed to parse Django response', parseError);
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'Invalid response from server',
        },
        { status: 500 }
      );
    }
    
    // Check if MFA is required (Django returns different structure)
    if (data.mfa_required) {
      console.log('Login API route: MFA required', data);
      return NextResponse.json({
        mfa_required: true,
        session_id: data.session_id,
        detail: data.detail || 'MFA verification required',
      }, { status: 200 });
    }
    
    // Validate that we have the required fields
    if (!data.access_token) {
      console.error('Login API route: No access_token in Django response', {
        dataKeys: Object.keys(data),
        dataSample: JSON.stringify(data).substring(0, 500),
        fullData: data,
      });
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'No access token received from server. Response: ' + JSON.stringify(data).substring(0, 200),
        },
        { status: 500 }
      );
    }
    
    if (!data.user) {
      console.error('Login API route: No user in Django response', {
        dataKeys: Object.keys(data),
        dataSample: JSON.stringify(data).substring(0, 500),
      });
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'No user data received from server',
        },
        { status: 500 }
      );
    }

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

