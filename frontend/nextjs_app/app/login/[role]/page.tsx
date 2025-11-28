'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SSOButtons from '@/components/SSOButtons';
import { getPrimaryRole, getDashboardRoute, getUserRoles } from '@/utils/rbac';
import { getRedirectRoute } from '@/utils/redirect';
import type { LoginRequest } from '@/services/types';

const PERSONAS = {
  student: { name: 'Student', icon: '🎓', color: 'defender-blue', description: 'Begin your cyber defense journey' },
  mentor: { name: 'Mentor', icon: '👨‍🏫', color: 'sahara-gold', description: 'Guide the next generation' },
  admin: { name: 'Admin', icon: '⚡', color: 'sahara-gold', description: 'Full platform access' },
  director: { name: 'Program Director', icon: '👔', color: 'sahara-gold', description: 'Manage programs and operations' },
  sponsor: { name: 'Sponsor/Employer', icon: '💼', color: 'sahara-gold', description: 'Support talent development' },
  analyst: { name: 'Analyst', icon: '📊', color: 'defender-blue', description: 'Access analytics and insights' },
};

const VALID_ROLES = Object.keys(PERSONAS);

export default function RoleLoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const role = (params?.role as string) || 'student';
  const { login, isLoading, user: authUser } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    device_fingerprint: 'web-' + Date.now(),
    device_name: 'Web Browser',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role && !VALID_ROLES.includes(role)) {
      router.push('/login/student');
    }
  }, [role, router]);

  const currentPersona = PERSONAS[role as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login(formData);
      console.log('=== Login Success ===');
      console.log('Login result:', result);

      // Determine redirect route based on user role
      let route = '/dashboard/student';
      const redirectTo = searchParams.get('redirect');

      // If there's a specific redirect parameter, use it (but only if it's a dashboard route)
      if (redirectTo && redirectTo.startsWith('/dashboard')) {
        route = redirectTo;
        console.log('📍 Using redirect parameter:', route);
      } else if (result?.user) {
        // Wait to ensure roles are fully loaded from /auth/me
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // CRITICAL: Check for admin role first
        const userRoles = result.user.roles || [];
        const isAdmin = userRoles.some((ur: any) => {
          const roleName = typeof ur === 'string' ? ur : (ur?.role || ur?.name || '')
          return roleName?.toLowerCase().trim() === 'admin'
        })
        
        if (isAdmin) {
          console.log('✅ Admin user detected - redirecting to /dashboard/admin')
          route = '/dashboard/admin'
        } else {
          // Use centralized redirect utility for other roles
          route = getRedirectRoute(result.user);
          console.log('✅ Login redirect route determined (non-admin):', route);
        }
      } else {
        console.error('❌ No user in login result, defaulting to student dashboard');
        route = '/dashboard/student';
      }

      console.log('🚀 Final redirect route:', route);
      
      // Ensure token is in localStorage before redirecting
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('Token not found in localStorage, cannot redirect');
        setError('Authentication token not found. Please try logging in again.');
        return;
      }
      
      // Set cookie manually in browser to ensure it's available for middleware
      // The API route already set it, but we'll ensure it's in the browser
      document.cookie = `access_token=${token}; path=/; max-age=${60 * 15}; SameSite=Lax`;
      
      // Small delay to ensure cookie is set, then redirect
      setTimeout(() => {
        console.log('🚀 Redirecting to:', route);
        window.location.href = route;
      }, 200);

    } catch (err: any) {
      let message = 'Login failed. Please check your credentials.';

      if (err?.data?.detail) message = err.data.detail;
      else if (err?.detail) message = err.detail;
      else if (err?.message) message = err.message;

      setError(message);
    }
  };

  const switchRole = (newRole: string) => {
    router.push(`/login/${newRole}`);
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
              className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm mb-5"
              role="alert"
            >
              {error}
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
              disabled={isLoading}
              variant="defender"
              className="w-full py-3 text-base font-semibold rounded-md"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* SSO */}
          <div className="mt-6">
            <SSOButtons
              mode="login"
              onSuccess={() => router.push('/dashboard')}
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
