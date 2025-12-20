/**
 * Settings Master Dashboard Component
 * Complete Student Settings Engine - System nervous system
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Shield, Bell, CreditCard, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const router = useRouter();
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

  // Debug logging
  useEffect(() => {
    console.log('SettingsMasterDashboard Debug:', {
      userId,
      hasSettings: !!settings,
      hasEntitlements: !!entitlements,
      isLoading,
      error: error?.message,
      settingsKeys: settings ? Object.keys(settings) : [],
    });
  }, [userId, settings, entitlements, isLoading, error]);

  // Don't block rendering - show content even while loading
  // Early returns only for critical errors
  if (error && error instanceof Error && error.message === 'User not authenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-12 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-200 mb-4" style={{ color: '#ffffff' }}>Authentication Required</h2>
          <p className="text-slate-400 mb-6" style={{ color: '#ffffff' }}>
            Please log in to access your settings.
          </p>
          <Button
            onClick={() => router.push('/login/student')}
            variant="defender"
            className="px-6 py-3"
            style={{ color: '#ffffff' }}
          >
            Go to Login
          </Button>
        </div>
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

  // Always render - don't block on loading
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '24px', color: '#ffffff' }}>
      <SettingsShell>
        {/* Test: Always visible header */}
        <div style={{ padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', marginBottom: '20px', color: '#ffffff', border: '2px solid rgba(99, 102, 241, 0.5)' }}>
          <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Settings Dashboard</h2>
          <p style={{ color: '#ffffff' }}>Active Tab: {activeTab} | Settings: {settings ? '✓' : '✗'} | Entitlements: {entitlements ? '✓' : '✗'}</p>
        </div>

        {error && (
          <div className="mb-6 animate-fade-in" style={{ color: '#ffffff', zIndex: 10, padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
            <ErrorDisplay error={error} onRetry={refetch} />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8" style={{ position: 'relative', zIndex: 10, marginBottom: '32px' }}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-900/70 backdrop-blur-xl border border-slate-800/70 rounded-lg p-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', borderColor: 'rgba(30, 41, 59, 0.7)' }}>
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
                style={{ 
                  color: isActive ? '#818cf8' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : 'none'
                }}
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
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Always show debug info */}
          <div className="mb-4 p-4 bg-slate-800/50 rounded-lg text-xs" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#ffffff', zIndex: 10, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <strong style={{ color: '#ffffff' }}>Debug Info:</strong> settings={settings ? '✓ Loaded' : '✗ Missing'}, entitlements={entitlements ? '✓ Loaded' : '✗ Missing'}, activeTab={activeTab}, userId={userId ? '✓' : '✗'}
          </div>
          
          {/* Profile Tab - Always render, show message if no settings */}
          {activeTab === 'profile' && (
            <div className="space-y-8" style={{ color: '#ffffff', position: 'relative', zIndex: 10 }}>
              {settings ? (
                <>
                  <div style={{ padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', marginBottom: '20px', color: '#ffffff', border: '1px solid rgba(99, 102, 241, 0.5)' }}>
                    <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Profile Settings</h3>
                    <p style={{ color: '#ffffff' }}>Manage your profile information and completeness</p>
                  </div>
                  <ProfileCompleteness settings={settings} updateSettings={updateSettings} userId={userId} />
                  <ProfileFormSection settings={settings} updateSettings={updateSettings} />
                  <CoachingControlPanel settings={settings} onUpdate={updateSettings} />
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', border: '2px solid rgba(239, 68, 68, 0.5)' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Settings Not Loaded</h3>
                  <p style={{ color: '#ffffff', marginBottom: '20px' }}>Please wait while we load your settings...</p>
                  <Button onClick={() => refetch()} variant="defender" style={{ color: '#ffffff' }}>
                    Retry Loading
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            settings && entitlements ? (
              <SubscriptionControlPanel entitlements={entitlements} settings={settings} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff' }}>Loading subscription information...</p>
              </div>
            )
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            settings && entitlements ? (
              <PrivacyMasterSwitch settings={settings} entitlements={entitlements} updateSettings={updateSettings} userId={userId} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff' }}>Loading privacy settings...</p>
              </div>
            )
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            settings ? (
              <NotificationEngine settings={settings} updateSettings={updateSettings} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff' }}>Loading notification settings...</p>
              </div>
            )
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            settings ? (
              <IntegrationHub settings={settings} updateSettings={updateSettings} userId={userId} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff' }}>Loading integrations...</p>
              </div>
            )
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            settings ? (
              <SecurityControlPanel settings={settings} updateSettings={updateSettings} userId={userId} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#ffffff', backgroundColor: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff' }}>Loading security settings...</p>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

        {/* System Status Rail - Live Impact Indicators */}
        <SystemStatusRail />
      </SettingsShell>
    </div>
  );
}
