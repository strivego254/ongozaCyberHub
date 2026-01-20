/**
 * Next.js API Route: Login
 * Handles login and sets HttpOnly cookies for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LoginRequest, LoginResponse } from '@/services/types';

function normalizeRoleName(roleName: string): string {
  const normalized = (roleName || '').toLowerCase().trim()
  if (normalized === 'program_director' || normalized === 'program director' || normalized === 'programdirector' || normalized === 'director') return 'program_director'
  if (normalized === 'mentee') return 'mentee'
  if (normalized === 'student') return 'student'
  if (normalized === 'mentor') return 'mentor'
  if (normalized === 'admin') return 'admin'
  if (normalized === 'sponsor_admin' || normalized === 'sponsor' || normalized === 'sponsor/employer admin' || normalized === 'sponsoremployer admin') return 'sponsor_admin'
  if (normalized === 'analyst') return 'analyst'
  if (normalized === 'employer') return 'employer'
  if (normalized === 'finance' || normalized === 'finance_admin') return 'finance'
  return normalized
}

function extractNormalizedRoles(user: any): string[] {
  const rolesRaw = user?.roles || []
  if (!Array.isArray(rolesRaw)) return []
  const roles = rolesRaw
    .map((ur: any) => {
      const roleValue = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
      return normalizeRoleName(String(roleValue || ''))
    })
    .filter(Boolean)
  // de-dupe
  return Array.from(new Set(roles))
}

function getPrimaryRole(roles: string[]): string | null {
  if (roles.includes('admin')) return 'admin'
  const priority = ['program_director', 'finance', 'mentor', 'analyst', 'sponsor_admin', 'employer', 'mentee', 'student']
  for (const r of priority) if (roles.includes(r)) return r
  return roles[0] || null
}

function getDashboardForRole(role: string | null): string {
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

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Development authentication bypass - hardcoded credentials
    const validCredentials = [
      { email: 'ongoza@gmail.com', password: 'Ongoza@#1', name: 'Ongoza', role: 'student', track_key: 'defender' },
      { email: 'ongozacyberhub@gmail.com', password: 'Ongoza@#1', name: 'Ongoza CyberHub', role: 'student', track_key: 'offensive' },
      { email: 'admin@ongozacyberhub.com', password: 'admin123', name: 'Admin', role: 'admin', track_key: null }
    ];

    const user = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          error: 'Login failed',
          detail: 'Invalid credentials'
        },
        { status: 401 }
      );
    }

    // Create mock JWT tokens (for development only)
    const access_token = `dev_access_${user.email}_${Date.now()}`;
    const refresh_token = `dev_refresh_${user.email}_${Date.now()}`;

    // Create response with tokens and user data
    const loginResponse = {
      user: {
        id: user.email,
        email: user.email,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' '),
        account_status: 'active',
        role: user.role,
        roles: [user.role], // For RBAC compatibility
        track_key: user.track_key // User's enrolled track
      },
      access_token,
      refresh_token,
      message: 'Login successful (development mode)'
    };

    // Create the response
    const nextResponse = NextResponse.json({
      user: loginResponse.user,
      access_token: loginResponse.access_token,
    });

    // Set RBAC cookies for middleware enforcement (HttpOnly so client can't tamper)
    const normalizedRoles = extractNormalizedRoles(loginResponse.user)
    const primaryRole = getPrimaryRole(normalizedRoles)
    nextResponse.cookies.set('och_roles', JSON.stringify(normalizedRoles), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    nextResponse.cookies.set('och_primary_role', primaryRole || '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    nextResponse.cookies.set('och_dashboard', getDashboardForRole(primaryRole), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    nextResponse.cookies.set('user_track', user.track_key || '', {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    // Set cookies directly on the response object
    if (loginResponse.access_token) {
      nextResponse.cookies.set('access_token', loginResponse.access_token, {
        httpOnly: false, // Allow client-side access for Authorization header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15, // 15 minutes
        path: '/',
      });
    }

    if (loginResponse.refresh_token) {
      nextResponse.cookies.set('refresh_token', loginResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Login API route error:', error);

    return NextResponse.json(
      {
        error: 'Login failed',
        detail: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

