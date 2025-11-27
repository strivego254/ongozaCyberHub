/**
 * Profile Settings Page
 * Allows users to update their profile information
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { djangoClient } from '@/services/djangoClient';
import type { User } from '@/services/types';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, reloadUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    phone_number: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    preferred_learning_style: '' as '' | 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed',
    career_goals: '',
    cyber_exposure_level: '' as '' | 'none' | 'beginner' | 'intermediate' | 'advanced',
  });

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      setFormData({
        first_name: authUser.first_name || '',
        last_name: authUser.last_name || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        phone_number: authUser.phone_number || '',
        country: authUser.country || '',
        timezone: authUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: authUser.language || 'en',
        preferred_learning_style: authUser.preferred_learning_style || '',
        career_goals: authUser.career_goals || '',
        cyber_exposure_level: authUser.cyber_exposure_level || '',
      });
    }
  }, [authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Update profile via API
      const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${DJANGO_API_URL}/api/v1/users/me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      await reloadUser();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-white text-h2">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-och-midnight">
      {/* Header */}
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-h2 text-white">Profile Settings</h1>
              <p className="text-body-s text-steel-grey mt-1">
                Manage your account information and preferences
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-signal-orange bg-opacity-20 border border-signal-orange text-white px-4 py-3 rounded-card text-body-s">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-cyber-mint bg-opacity-20 border border-cyber-mint text-white px-4 py-3 rounded-card text-body-s">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h2 className="text-h3 text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-body-s font-semibold text-steel-grey mb-2">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                    disabled
                  />
                  <p className="text-body-xs text-steel-grey mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Country
                  </label>
                  <input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                    placeholder="BW"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Timezone
                  </label>
                  <input
                    id="timezone"
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="bio" className="block text-body-s font-semibold text-steel-grey mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Mentee Profile Fields */}
            <div>
              <h2 className="text-h3 text-white mb-4">Learning Profile</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="preferred_learning_style" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Preferred Learning Style
                  </label>
                  <select
                    id="preferred_learning_style"
                    value={formData.preferred_learning_style}
                    onChange={(e) => setFormData({ ...formData, preferred_learning_style: e.target.value as any })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  >
                    <option value="">Select learning style</option>
                    <option value="visual">Visual</option>
                    <option value="auditory">Auditory</option>
                    <option value="kinesthetic">Kinesthetic</option>
                    <option value="reading">Reading</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="career_goals" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Career Goals
                  </label>
                  <textarea
                    id="career_goals"
                    rows={4}
                    value={formData.career_goals}
                    onChange={(e) => setFormData({ ...formData, career_goals: e.target.value })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white placeholder-steel-grey focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                    placeholder="Describe your career goals in cybersecurity..."
                  />
                </div>

                <div>
                  <label htmlFor="cyber_exposure_level" className="block text-body-s font-semibold text-steel-grey mb-2">
                    Cyber Exposure Level
                  </label>
                  <select
                    id="cyber_exposure_level"
                    value={formData.cyber_exposure_level}
                    onChange={(e) => setFormData({ ...formData, cyber_exposure_level: e.target.value as any })}
                    className="w-full px-4 py-3 bg-och-midnight border border-steel-grey rounded-card text-white focus:outline-none focus:border-cyber-mint focus:shadow-mint-glow transition-all"
                  >
                    <option value="">Select exposure level</option>
                    <option value="none">None</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-steel-grey">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

