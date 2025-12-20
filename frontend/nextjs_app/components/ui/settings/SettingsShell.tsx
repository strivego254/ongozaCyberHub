/**
 * Settings Shell Component
 * Mission control dashboard with system status rail
 */

'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SystemStatusCard } from './SystemStatusCard';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { ReactNode } from 'react';

interface SettingsShellProps {
  children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const { settings, entitlements, isLoading } = useSettingsMaster();
  const { items } = usePortfolio();

  if (isLoading || !settings || !entitlements) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 lg:px-12 lg:py-12">
        <div className="text-center text-slate-400">Loading settings...</div>
      </div>
    );
  }

  const systemStatuses = [
    {
      title: 'Profile',
      value: `${settings.profileCompleteness}%`,
      status: settings.profileCompleteness >= 80 ? ('healthy' as const) : ('warning' as const),
      impact: 'Marketplace eligibility',
    },
    {
      title: 'Plan',
      value: entitlements.tier,
      status: entitlements.tier === 'professional' ? ('healthy' as const) : ('upgrade' as const),
      impact: 'Feature access',
    },
    {
      title: 'Visibility',
      value: settings.portfolioVisibility.replace('_', ' '),
      status: 'healthy' as const,
      impact: 'Portfolio sharing',
    },
    {
      title: 'Alerts',
      value: settings.notificationsEmail ? 'On' : 'Off',
      status: settings.notificationsEmail ? ('healthy' as const) : ('warning' as const),
      impact: 'Mission deadlines',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 lg:px-12 lg:py-12">
      {/* MISSION CONTROL HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass-card glass-card-hover mb-10 shadow-2xl">
          <div className="p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent mb-4">
                  Settings
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                  Control your profile visibility, subscription entitlements, notifications, and platform coordination
                </p>
              </div>

              {/* SYSTEM STATUS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full lg:w-auto">
                {systemStatuses.map((status, index) => (
                  <motion.div
                    key={status.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <SystemStatusCard status={status} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* TABBED CONTROL PANEL */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

