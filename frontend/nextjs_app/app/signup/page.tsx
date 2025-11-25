/**
 * Signup Page - OCH Brand Styled
 * Handles registration with persona selection
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { djangoClient } from '@/services/djangoClient';
import type { SignupRequest } from '@/services/types';

const PERSONAS = {
  student: { name: 'Student', icon: '🎓', description: 'Begin your cyber defense journey' },
  mentor: { name: 'Mentor', icon: '👨‍🏫', description: 'Guide the next generation' },
  director: { name: 'Program Director', icon: '👔', description: 'Manage programs and operations' },
  sponsor: { name: 'Sponsor/Employer', icon: '💼', description: 'Support talent development' },
  analyst: { name: 'Analyst', icon: '📊', description: 'Access analytics and insights' },
  admin: { name: 'Admin', icon: '⚡', description: 'Full platform access' },
};

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const persona = searchParams.get('persona') as keyof typeof PERSONAS || 'student';
  
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

  const currentPersona = PERSONAS[persona] || PERSONAS.student;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await djangoClient.auth.signup(formData);
      // Redirect to login after successful signup
      router.push(`/login?persona=${persona}&registered=true`);
    } catch (err: any) {
      setError(err.message || err.detail || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-h1 text-white mb-2">Join the Mission</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-card border border-sahara-gold bg-och-midnight">
            <span className="text-xl">{currentPersona.icon}</span>
            <span className="text-body-m text-steel-grey">{currentPersona.name}</span>
          </div>
          <p className="text-body-s text-steel-grey mt-2">{currentPersona.description}</p>
        </div>

        {/* Signup Card */}
        <div className="card">
          <h2 className="text-h2 text-white mb-6 text-center">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-signal-orange bg-opacity-20 border border-signal-orange text-white px-4 py-3 rounded-card text-body-s">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-body-s font-semibold text-steel-grey mb-2">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-body-s font-semibold text-steel-grey mb-2">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

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

            <div>
              <label htmlFor="country" className="block text-body-s font-semibold text-steel-grey mb-2">
                Country (Optional)
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                placeholder="BW"
                maxLength={2}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-steel-grey">
            <p className="text-body-s text-steel-grey text-center mb-4">Already have an account?</p>
            <a
              href={`/login${persona ? `?persona=${persona}` : ''}`}
              className="btn-secondary w-full text-center block"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Persona Selection */}
        <div className="mt-6">
          <p className="text-body-s text-steel-grey text-center mb-3">Sign up as:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(PERSONAS).map(([key, { name, icon }]) => (
              <a
                key={key}
                href={`/signup?persona=${key}`}
                className={`px-3 py-1.5 text-body-s border rounded-card transition-all ${
                  persona === key
                    ? 'border-cyber-mint text-cyber-mint bg-cyber-mint bg-opacity-10'
                    : 'border-steel-grey text-steel-grey hover:border-cyber-mint hover:text-cyber-mint'
                }`}
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

