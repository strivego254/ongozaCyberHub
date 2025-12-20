/**
 * Settings Shell Component
 * Mission control dashboard with system status rail
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SystemStatusCard } from './SystemStatusCard';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { usePortfolio } from '@/hooks/usePortfolio';
import { createClient } from '@/lib/supabase/client';
import type { ReactNode } from 'react';

const supabase = createClient();

interface SettingsShellProps {
  children: ReactNode;
}

export function SettingsShell({ children }: SettingsShellProps) {
  const [userId, setUserId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  const { settings, entitlements, isLoading } = useSettingsMaster(userId);
  const { items } = usePortfolio(userId);

  // Always show system statuses - use defaults if data not loaded
  const systemStatuses = settings && entitlements ? [
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
  ] : [
    {
      title: 'Profile',
      value: '0%',
      status: 'warning' as const,
      impact: 'Marketplace eligibility',
    },
    {
      title: 'Plan',
      value: 'Free',
      status: 'upgrade' as const,
      impact: 'Feature access',
    },
    {
      title: 'Visibility',
      value: 'Private',
      status: 'warning' as const,
      impact: 'Portfolio sharing',
    },
    {
      title: 'Alerts',
      value: 'On',
      status: 'healthy' as const,
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 w-full lg:w-auto">
                {systemStatuses.map((status, index) => (
                  <motion.div
                    key={status.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="min-w-0"
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

