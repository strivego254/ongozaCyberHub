'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SSOButtons from '@/components/SSOButtons';
import { getRedirectRoute } from '@/utils/redirect';
import type { LoginRequest } from '@/services/types';

const PERSONAS = {
  student: { name: 'Student', icon: '🎓', color: 'defender-blue', description: 'Begin your cyber defense journey' },
  mentor: { name: 'Mentor', icon: '👨‍🏫', color: 'sahara-gold', description: 'Guide the next generation' },
  admin: { name: 'Admin', icon: '⚡', color: 'sahara-gold', description: 'Full platform access' },
  director: { name: 'Program Director', icon: '👔', color: 'sahara-gold', description: 'Manage programs and operations' },
  sponsor: { name: 'Sponsor/Employer', icon: '💼', color: 'sahara-gold', description: 'Support talent development' },
  analyst: { name: 'Analyst', icon: '📊', color: 'defender-blue', description: 'Access analytics and insights' },
  finance: { name: 'Finance', icon: '💰', color: 'defender-blue', description: 'Manage billing and revenue operations' },
};

const VALID_ROLES = Object.keys(PERSONAS);

function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  // Get role from URL params - this will update when URL changes
  const roleParam = params?.role as string;
  const urlRole = roleParam && VALID_ROLES.includes(roleParam) ? roleParam : 'student';
  
  // Use state to track current role for immediate UI updates
  const [currentRole, setCurrentRole] = useState(urlRole);
  const role = currentRole;
  
  // Update state when URL param changes
  useEffect(() => {
    if (urlRole !== currentRole) {
      setCurrentRole(urlRole);
    }
  }, [urlRole, currentRole]);
  
  const { login, isLoading, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    device_fingerprint: 'web-' + Date.now(),
    device_name: 'Web Browser',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (role && !VALID_ROLES.includes(role)) {
      router.push('/login/student');
    }
  }, [role, router]);

  // Redirect if already authenticated (but only if not currently logging in)
  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirectedRef.current) return;
    
    // Don't redirect if we're in the middle of logging in or redirecting
    if (isLoggingIn || isRedirecting) return;
    
    // Wait for auth state to be determined
    if (isLoading) return;
    
    // Only redirect if we're already authenticated and have a user
    // This prevents redirect loops when user is not authenticated
    if (isAuthenticated && user) {
      hasRedirectedRef.current = true;
      
      const redirectTo = searchParams.get('redirect');
      let targetRoute: string;
      
      if (redirectTo && redirectTo.startsWith('/dashboard')) {
        targetRoute = redirectTo;
      } else {
        targetRoute = getRedirectRoute(user);
      }
      
      // Use router.push for client-side navigation (preserves cookies)
      if (targetRoute && targetRoute.startsWith('/dashboard')) {
        console.log('🔄 Redirecting authenticated user to:', targetRoute);
        router.push(targetRoute);
      }
    }
  }, [isAuthenticated, user, isLoading, isLoggingIn, isRedirecting, router]);

  const currentPersona = PERSONAS[role as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    setIsRedirecting(false);

    try {
      // Perform login - this will update auth state and return user with roles
      const result = await login(formData);
      
      if (!result || !result.user) {
        throw new Error('Login failed: No user data received');
      }

      const currentUser = result.user;
      const token = result.access_token || localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Ensure token is in localStorage
      localStorage.setItem('access_token', token);
      
      // Cookie is already set by the API route (/api/auth/login)
      // No need to set it manually - the browser handles it automatically

      // Determine redirect route
      const redirectTo = searchParams.get('redirect');

      // Wait for auth state to fully update and roles to be loaded
      // The login function already fetches full user profile from /auth/me
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload user to ensure we have the latest data with roles
      // The login function should have already updated the auth state, but we'll verify
      let userWithRoles = currentUser || result?.user;
      
      // Try to get the latest user from auth state (which should have roles from /auth/me)
      // Wait a bit more if user is not yet available
      let retries = 0;
      while ((!userWithRoles || !userWithRoles.roles || userWithRoles.roles.length === 0) && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 200));
        userWithRoles = user || result?.user;
        retries++;
      }
      
      console.log('Current user for redirect:', userWithRoles);
      console.log('User roles:', userWithRoles?.roles);
      
      // Fallback: Try to get dashboard route from cookie if user roles aren't available
      let dashboardFromCookie: string | null = null;
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const dashboardCookie = cookies.find(c => c.trim().startsWith('och_dashboard='));
        if (dashboardCookie) {
          dashboardFromCookie = dashboardCookie.split('=')[1]?.trim() || null;
          console.log('📦 Dashboard route from cookie:', dashboardFromCookie);
        }
      }
      
      let route: string;
      
      if (!userWithRoles || !userWithRoles.roles || userWithRoles.roles.length === 0) {
        console.warn('⚠️ No user roles available, using cookie fallback');
        if (dashboardFromCookie) {
          route = dashboardFromCookie;
          console.log('✅ Using dashboard route from cookie:', route);
        } else {
          console.error('❌ No user available and no cookie fallback, defaulting to student dashboard');
          route = '/dashboard/student';
        }
      } else {
        const userRoles = userWithRoles.roles || [];
        
        // If logging in through director login, verify role
        if (role === 'director') {
          const isAdmin = userRoles.some((ur: any) => {
            const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
            return roleName?.toLowerCase().trim() === 'admin'
          })
          const isProgramDirector = userRoles.some((ur: any) => {
            const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
            const normalized = roleName?.toLowerCase().trim()
            return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
          })
          
          if (!isAdmin && !isProgramDirector) {
            setError('You do not have permission to access the Program Director dashboard. Your account must have program_director or admin role.');
            setIsLoggingIn(false);
            return;
          }
        }

        // If there's a specific redirect parameter, use it (but only if it's a dashboard route)
        if (redirectTo && redirectTo.startsWith('/dashboard')) {
          route = redirectTo;
          console.log('📍 Using redirect parameter:', route);
        } else {
          // CRITICAL: Check for admin role first
          const isAdmin = userRoles.some((ur: any) => {
            const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
            return roleName?.toLowerCase().trim() === 'admin'
          })
          
          if (isAdmin) {
            console.log('✅ Admin user detected - redirecting to /dashboard/admin')
            route = '/dashboard/admin'
          } else {
            // Use centralized redirect utility for other roles
            route = getRedirectRoute(userWithRoles);
            console.log('✅ Login redirect route determined (non-admin):', route);
            console.log('User roles used for redirect:', userRoles);
            
            // Special handling for program_director - ensure it goes to director dashboard
            const isProgramDirector = userRoles.some((ur: any) => {
              const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || ur?.role_display_name || '')
              const normalized = roleName?.toLowerCase().trim()
              return normalized === 'program_director' || normalized === 'program director' || normalized === 'director'
            })
            
            if (isProgramDirector) {
              if (route !== '/dashboard/director') {
                console.log('✅ Program Director detected - forcing redirect to /dashboard/director (was:', route, ')')
                route = '/dashboard/director'
              } else {
                console.log('✅ Program Director detected - already redirecting to /dashboard/director')
              }
            }
          }
        }
      }

      // Validate route
      if (!route || !route.startsWith('/dashboard')) {
        route = '/dashboard/student'; // Safe fallback
      }

      console.log('✅ Login successful, redirecting to:', route);
      
      // Mark as redirecting and prevent useEffect from interfering
      setIsRedirecting(true);
      hasRedirectedRef.current = true;
      
      // Additional delay to ensure auth state is fully updated and cookies are set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use router.push instead of window.location.href to preserve React state
      // This ensures the auth state is maintained across navigation
      console.log('🚀 Redirecting to:', route);
      
      // Reset logging in flag after a short delay to allow redirect to happen
      setTimeout(() => setIsLoggingIn(false), 1000);
      
      // Use replace to avoid keeping the login page in history, then refresh to
      // ensure middleware/server components see the newly-set cookies immediately.
      router.replace(route);
      
      // Small delay before refresh to ensure navigation has started
      await new Promise(resolve => setTimeout(resolve, 100));
      router.refresh();

    } catch (err: any) {
      setIsLoggingIn(false);
      setIsRedirecting(false);
      
      let message = 'Login failed. Please check your credentials.';

      if (err?.mfa_required) {
        message = 'Multi-factor authentication is required. Please contact support to set up MFA.';
      } else if (err?.data?.detail) {
        message = err.data.detail;
      } else if (err?.data?.error) {
        message = err.data.error;
      } else if (err?.detail) {
        message = err.detail;
      } else if (err?.message) {
        message = err.message;
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('ECONNREFUSED')) {
          message = 'Cannot connect to backend server. Please ensure the Django API is running on port 8000.';
        }
      }

      setError(message);
    }
  };

  const switchRole = (newRole: string) => {
    // Don't switch if already on that role
    if (newRole === currentRole) {
      return;
    }
    
    // Update state immediately for instant UI feedback
    setCurrentRole(newRole);
    
    // Preserve redirect parameter if it exists
    const redirectTo = searchParams.get('redirect');
    let newUrl = `/login/${newRole}`;
    if (redirectTo) {
      newUrl += `?redirect=${encodeURIComponent(redirectTo)}`;
    }
    
    // Update URL - use replace to avoid adding to history
    router.replace(newUrl);
  };

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fadeIn">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 drop-shadow-glow">🛡️</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Ongoza CyberHub
          </h1>

          <div className="bg-gradient-to-r from-defender-blue/20 to-cyber-mint/20 border border-steel-grey px-4 py-2 rounded-lg inline-flex items-center gap-2">
            <span className="text-xl">{currentPersona.icon}</span>
            <span className="text-body-m text-steel-grey">
              {currentPersona.name} Portal
            </span>
          </div>

          <p className="text-body-s text-steel-grey mt-2 opacity-80">
            {currentPersona.description}
          </p>
        </div>

        {/* Auth Card */}
        <Card gradient="defender" glow className="p-8 shadow-xl border border-defender-blue/40 rounded-2xl">

          <h2 className="text-h2 text-white mb-6 text-center">Sign In</h2>

          {/* Error */}
          {error && (
            <div
              className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm mb-5 animate-fadeIn"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success/Redirecting Message */}
          {isRedirecting && !error && (
            <div
              className="bg-cyber-mint/25 border border-cyber-mint text-white px-4 py-3 rounded-md text-sm mb-5 animate-fadeIn"
              role="status"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-cyber-mint border-t-transparent rounded-full"></div>
                <span>Login successful! Redirecting to your dashboard...</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-steel-grey"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-field px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all"
                placeholder="defender@example.com"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-steel-grey"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-field px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* CTA */}
            <Button
              type="submit"
              disabled={isLoading || isLoggingIn || isRedirecting}
              variant="defender"
              className="w-full py-3 text-base font-semibold rounded-md"
            >
              {isRedirecting ? 'Redirecting...' : isLoggingIn ? 'Signing in...' : isLoading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>

          {/* SSO */}
          <div className="mt-6">
            <SSOButtons
              mode="login"
              onSuccess={() => {
                router.replace('/dashboard')
                router.refresh()
              }}
              onError={(error) => setError(error)}
            />
          </div>

          {/* Sign Up */}
          <div className="mt-8 pt-6 border-t border-steel-grey/50">
            <p className="text-center text-sm text-steel-grey mb-3">
              Don’t have an account?
            </p>

            <Button
              variant="outline"
              className="w-full py-3 text-base rounded-md"
              onClick={() => router.push(`/signup/${role}`)}
            >
              Sign Up
            </Button>
          </div>
        </Card>

        {/* Role Switching */}
        <div className="mt-6 text-center">
          <p className="text-body-s text-steel-grey mb-3">Switch Role:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
              <button
                key={key}
                onClick={() => switchRole(key)}
                className={`px-3 py-1.5 text-body-s border rounded-md transition-all ${
                  role === key
                    ? 'border-cyber-mint text-cyber-mint bg-cyber-mint/10'
                    : 'border-steel-grey text-steel-grey hover:border-cyber-mint hover:text-cyber-mint'
                }`}
              >
                {icon} {name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RoleLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-och-steel">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
