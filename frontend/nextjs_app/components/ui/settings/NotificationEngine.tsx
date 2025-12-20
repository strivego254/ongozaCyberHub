/**
 * Notification Engine Component
 * Mission/Coaching alerts with impact explanations
 */

'use client';

import { motion } from 'framer-motion';
import { Bell, Target, MessageSquare, Briefcase, Mail, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';

export function NotificationEngine() {
  const { settings, updateSettings } = useSettingsMaster();

  if (!settings) return null;

  const categories = [
    {
      key: 'missions' as const,
      icon: Target,
      label: 'Missions',
      description: 'Deadlines, completions, and reviews',
      impact: 'Affects mission deadline reminders and unlock notifications',
      recommended: true,
    },
    {
      key: 'coaching' as const,
      icon: MessageSquare,
      label: 'Coaching',
      description: 'AI insights, habit reminders, and goals',
      impact: 'Affects habit streak warnings and reflection prompts',
      recommended: true,
    },
    {
      key: 'mentor' as const,
      icon: MessageSquare,
      label: 'Mentor',
      description: 'Feedback, session requests, and messages',
      impact: 'Affects mentor feedback and session requests',
      recommended: false,
    },
    {
      key: 'marketplace' as const,
      icon: Briefcase,
      label: 'Marketplace',
      description: 'Profile views, opportunities, and messages',
      impact: 'Affects profile views and employer contact notifications',
      recommended: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Notifications</h2>
              <p className="text-xs text-slate-500 mt-1">
                Control alerts for missions, coaching, and marketplace opportunities
              </p>
            </div>
          </div>

          {/* Global Toggles */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive updates via email</div>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEmail: !settings.notificationsEmail })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEmail ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEmail ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Push Notifications</div>
                  <div className="text-xs text-slate-500">Browser and mobile push alerts</div>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ notificationsPush: !settings.notificationsPush })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsPush ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsPush ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Category Preferences */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">Notification Categories</h3>
              <p className="text-xs text-slate-500">Control what notifications you receive</p>
            </div>
            <div className="space-y-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const enabled = settings.notificationsCategories[category.key] !== false;

                return (
                  <div
                    key={category.key}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors bg-slate-800/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm font-medium text-slate-200">{category.label}</div>
                          {category.recommended && (
                            <Badge variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{category.description}</div>
                        <div className="text-xs text-slate-600">{category.impact}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        updateSettings({
                          notificationsCategories: {
                            ...settings.notificationsCategories,
                            [category.key]: !enabled,
                          },
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
                        enabled ? 'bg-indigo-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

