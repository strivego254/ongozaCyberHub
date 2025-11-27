/**
 * Shared Dashboard Layout Component
 * Provides consistent header, navigation, and structure for all role dashboards
 */

'use client';

import { useRouter } from 'next/navigation';
import type { User } from '@/services/types';

interface DashboardLayoutProps {
  user: User;
  role: string;
  roleLabel: string;
  roleIcon: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  user,
  role,
  roleLabel,
  roleIcon,
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-och-midnight">
      {/* Header */}
      <header className="border-b border-steel-grey bg-och-midnight sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-h2 text-white flex items-center gap-2">
                  <span>{roleIcon}</span>
                  {roleLabel} Dashboard
                </h1>
                <p className="text-body-s text-steel-grey mt-1">
                  Welcome back, {user.first_name || user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`badge-${
                role === 'admin' ? 'mastery' :
                role === 'director' ? 'advanced' :
                role === 'mentor' ? 'intermediate' :
                'beginner'
              }`}>
                {roleIcon} {roleLabel}
              </span>
              {user.preferred_learning_style && (
                <span className="text-body-s text-steel-grey hidden md:block">
                  Learning: {user.preferred_learning_style}
                </span>
              )}
              <a
                href="/settings/profile"
                className="text-body-s text-steel-grey hover:text-cyber-mint transition-colors"
              >
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="text-body-s text-steel-grey hover:text-signal-orange transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

