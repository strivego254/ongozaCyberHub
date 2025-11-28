'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { djangoClient } from '@/services/djangoClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SSOButtons from '@/components/SSOButtons';
import type { SignupRequest } from '@/services/types';

const PERSONAS = {
  student: { name: 'Student', icon: '🎓', description: 'Begin your cyber defense journey', badge: 'beginner' as const },
  mentor: { name: 'Mentor', icon: '👨‍🏫', description: 'Guide the next generation', badge: 'advanced' as const },
  director: { name: 'Program Director', icon: '👔', description: 'Manage programs and operations', badge: 'vip' as const },
  sponsor: { name: 'Sponsor/Employer', icon: '💼', description: 'Support talent development', badge: 'vip' as const },
  analyst: { name: 'Analyst', icon: '📊', description: 'Access analytics and insights', badge: 'intermediate' as const },
  admin: { name: 'Admin', icon: '⚡', description: 'Full platform access', badge: 'mastery' as const },
};

const VALID_ROLES = Object.keys(PERSONAS);

export default function RoleSignupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const role = (params?.role as string) || 'student';
  
  const [formData, setFormData] = useState<SignupRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (role && !VALID_ROLES.includes(role)) {
      router.push('/signup/student');
    }
  }, [role, router]);

  const currentPersona = PERSONAS[role as keyof typeof PERSONAS] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.email?.trim()) {
        setError('Email is required');
        setIsLoading(false);
        return;
      }
      if (!formData.first_name?.trim()) {
        setError('First name is required');
        setIsLoading(false);
        return;
      }
      if (!formData.last_name?.trim()) {
        setError('Last name is required');
        setIsLoading(false);
        return;
      }

      // Ensure password is provided if not passwordless
      if (!formData.password?.trim() && !formData.passwordless) {
        setError('Password is required');
        setIsLoading(false);
        return;
      }

      // Validate password strength if provided (Django requires: min 8 chars, not too common, etc.)
      if (formData.password?.trim() && formData.password.trim().length < 8) {
        setError('Password must be at least 8 characters long');
        setIsLoading(false);
        return;
      }

      // Prepare signup data - trim all string fields
      const signupData: any = {
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: formData.language || 'en',
      };

      // Add password if provided
      if (formData.password?.trim()) {
        signupData.password = formData.password.trim();
      }
      
      // Add optional fields only if they have values
      if (formData.country?.trim()) {
        // Ensure country is 2 characters (ISO code)
        const countryCode = formData.country.trim().toUpperCase().substring(0, 2);
        if (countryCode.length === 2) {
          signupData.country = countryCode;
        }
      }
      
      if (formData.passwordless) {
        signupData.passwordless = formData.passwordless;
      }

      const response = await djangoClient.auth.signup(signupData);
      if (response?.detail || response?.user_id) {
        router.push(`/login/${role}?registered=true`);
      }
    } catch (err: any) {
      let errorMessage = 'Signup failed. Please try again.';
      if (err?.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err?.data) {
        // Handle field-specific errors
        const fieldErrors = Object.entries(err.data)
          .map(([field, messages]: [string, any]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            return `${field}: ${msg}`;
          })
          .join(', ');
        errorMessage = fieldErrors || errorMessage;
      } else if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: string) => {
    router.push(`/signup/${newRole}`);
  };

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fadeIn">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 drop-shadow-glow">🛡️</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            Join the Mission
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
        <Card variant="blue" glow className="p-8 shadow-xl border border-defender-blue/40 rounded-2xl">

          <h2 className="text-h2 text-white mb-6 text-center">Create Account</h2>

          {/* Error */}
          {error && (
            <div
              className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm mb-5"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {searchParams.get('registered') === 'true' && (
            <div className="bg-cyber-mint/25 border border-cyber-mint text-white px-4 py-3 rounded-md text-sm mb-5">
              Account created successfully! Please sign in.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="first_name"
                  className="text-sm font-medium text-steel-grey"
                >
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all text-white"
                  placeholder="John"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="last_name"
                  className="text-sm font-medium text-steel-grey"
                >
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all text-white"
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all text-white"
                placeholder="••••••••"
              />
              <p className="text-xs text-steel-grey mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="country"
                className="text-sm font-medium text-steel-grey"
              >
                Country (Optional)
              </label>
              <input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="px-4 py-3 text-base rounded-md bg-och-midnight border border-steel-grey focus:border-cyber-mint focus:ring-cyber-mint/30 transition-all text-white uppercase"
                placeholder="BW"
                maxLength={2}
              />
              <p className="text-xs text-steel-grey mt-1">
                2-letter ISO code (e.g., BW, US, KE)
              </p>
            </div>

            {/* CTA */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              className="w-full py-3 text-base font-semibold rounded-md"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* SSO */}
          <div className="mt-6">
            <SSOButtons
              mode="signup"
              onSuccess={() => router.push('/dashboard')}
              onError={(error) => setError(error)}
            />
          </div>

          {/* Sign In */}
          <div className="mt-8 pt-6 border-t border-steel-grey/50">
            <p className="text-center text-sm text-steel-grey mb-3">
              Already have an account?
            </p>

            <Button
              variant="secondary"
              className="w-full py-3 text-base rounded-md"
              onClick={() => router.push(`/login/${role}`)}
            >
              Sign In
            </Button>
          </div>
        </Card>

        {/* Role Switching */}
        <div className="mt-6 text-center">
          <p className="text-body-s text-steel-grey mb-3">Sign up as:</p>
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

