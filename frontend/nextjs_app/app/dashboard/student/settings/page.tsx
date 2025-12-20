/**
 * Settings Page - Student Dashboard
 * Uses the modern Settings Master Dashboard
 */

'use client';

import { SettingsMasterDashboard } from '@/components/ui/settings/SettingsMasterDashboard';

export default function SettingsPage() {
  try {
    return <SettingsMasterDashboard />;
  } catch (error) {
    console.error('Settings page error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-12 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Settings Error</h2>
          <p className="text-slate-400 mb-4">
            {error instanceof Error ? error.message : 'Failed to load settings'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

