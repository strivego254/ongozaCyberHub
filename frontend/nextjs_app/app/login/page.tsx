/**
 * Login Page - OCH Brand Styled
 * Handles authentication with persona support
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { LoginRequest } from '@/services/types';
import SSOButtons from '@/components/SSOButtons';

const PERSONAS = {
  student: { name: 'Student', icon: '🎓', color: 'defender-blue' },
  mentor: { name: 'Mentor', icon: '👨‍🏫', color: 'sahara-gold' },
  director: { name: 'Program Director', icon: '👔', color: 'sahara-gold' },
  sponsor: { name: 'Sponsor/Employer', icon: '💼', color: 'sahara-gold' },
  analyst: { name: 'Analyst', icon: '📊', color: 'defender-blue' },
  admin: { name: 'Admin', icon: '⚡', color: 'sahara-gold' },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const persona = searchParams.get('persona') as keyof typeof PERSONAS || null;
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    device_fingerprint: 'web-' + Date.now(),
    device_name: 'Web Browser',
  });
  const [error, setError] = useState<string | null>(null);

  const currentPersona = persona ? PERSONAS[persona] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-h1 text-white mb-2">Ongoza CyberHub</h1>
          {currentPersona && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-card border border-steel-grey bg-och-midnight">
              <span className="text-xl">{currentPersona.icon}</span>
              <span className="text-body-m text-steel-grey">{currentPersona.name} Portal</span>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="text-h2 text-white mb-6 text-center">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-signal-orange bg-opacity-20 border border-signal-orange text-white px-4 py-3 rounded-card text-body-s">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-body-s font-semibold text-steel-grey mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                placeholder="defender@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-body-s font-semibold text-steel-grey mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* SSO Buttons */}
          <div className="mt-6">
            <SSOButtons
              mode="login"
              onSuccess={() => router.push('/dashboard')}
              onError={(error) => setError(error)}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-steel-grey">
            <p className="text-body-s text-steel-grey text-center mb-4">Don't have an account?</p>
            <a
              href={`/signup${persona ? `?persona=${persona}` : ''}`}
              className="btn-secondary w-full text-center block"
            >
              Sign Up
            </a>
          </div>
        </div>

        {/* Persona Quick Links */}
        <div className="mt-6 text-center">
          <p className="text-body-s text-steel-grey mb-3">Quick Access:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
              <a
                key={key}
                href={`/login?persona=${key}`}
                className="px-3 py-1.5 text-body-s border border-steel-grey rounded-card text-steel-grey hover:border-cyber-mint hover:text-cyber-mint transition-all"
              >
                {icon} {name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
