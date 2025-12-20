/**
 * Settings Master Dashboard Component
 * Complete Student Settings Engine - System nervous system
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Shield, Bell, CreditCard, Link2 } from 'lucide-react';
import { SettingsShell } from './SettingsShell';
import { ProfileCompleteness } from './ProfileCompleteness';
import { ProfileFormSection } from './ProfileFormSection';
import { PrivacyMasterSwitch } from './PrivacyMasterSwitch';
import { SubscriptionControlPanel } from './SubscriptionControlPanel';
import { NotificationEngine } from './NotificationEngine';
import { IntegrationHub } from './IntegrationHub';
import { SystemStatusRail } from './SystemStatusRail';
import { CoachingControlPanel } from './CoachingControlPanel';
import { SecurityControlPanel } from './SecurityControlPanel';
import { PortfolioDashboardSkeleton } from '../portfolio/PortfolioSkeleton';
import { ErrorDisplay } from '../portfolio/ErrorDisplay';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

type SettingsTab = 'profile' | 'subscription' | 'privacy' | 'notifications' | 'integrations' | 'security';

export function SettingsMasterDashboard() {
  const [userId, setUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const {
    settings,
    entitlements,
    isLoading,
    isUpdating,
    error,
    updateSettings,
    refetch,
  } = useSettingsMaster(userId);

  if (isLoading && !settings) {
    return <PortfolioDashboardSkeleton />;
  }

  if (!settings || !entitlements) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-12">
        <div className="text-center text-slate-400">Loading settings...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'subscription' as const, label: 'Subscription', icon: CreditCard },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'integrations' as const, label: 'Integrations', icon: Link2 },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <SettingsShell>
      {error && (
        <div className="mb-6 animate-fade-in">
          <ErrorDisplay error={error} onRetry={refetch} />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-900/70 backdrop-blur-xl border border-slate-800/70 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <ProfileCompleteness />
              <ProfileFormSection />
              <CoachingControlPanel settings={settings} onUpdate={updateSettings} />
            </div>
          )}

          {activeTab === 'subscription' && (
            <SubscriptionControlPanel entitlements={entitlements} settings={settings} />
          )}

          {activeTab === 'privacy' && (
            <PrivacyMasterSwitch />
          )}

          {activeTab === 'notifications' && (
            <NotificationEngine />
          )}

          {activeTab === 'integrations' && (
            <IntegrationHub />
          )}

          {activeTab === 'security' && (
            <SecurityControlPanel />
          )}
        </motion.div>
      </AnimatePresence>

      {/* System Status Rail - Live Impact Indicators */}
      <SystemStatusRail />
    </SettingsShell>
  );
}
