/**
 * Privacy Master Switch Component
 * Portfolio/Marketplace coordination with instant sync
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Globe, Mail, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { UserSettings, UserEntitlements, SettingsUpdate } from '@/lib/settings/types';

interface PrivacyMasterSwitchProps {
  settings: UserSettings;
  entitlements: UserEntitlements;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function PrivacyMasterSwitch({ settings, entitlements, updateSettings, userId }: PrivacyMasterSwitchProps) {
  const { items } = usePortfolio(userId);

  const visibleItemsCount = items.filter(
    item => item.status === 'approved' && 
    (settings.portfolioVisibility === 'marketplace_preview' || settings.portfolioVisibility === 'public')
  ).length;

  const visibilityOptions = [
    {
      value: 'private' as const,
      icon: Lock,
      label: 'Private',
      description: 'Only you can see',
      color: 'slate',
    },
    {
      value: 'marketplace_preview' as const,
      icon: Eye,
      label: 'Marketplace',
      description: 'Employers • Profile 80%+',
      color: 'indigo',
      disabled: settings.profileCompleteness < 80,
    },
    {
      value: 'public' as const,
      icon: Globe,
      label: 'Public',
      description: 'Anyone worldwide',
      color: 'emerald',
    },
  ];

  const canEnableContact = entitlements.marketplaceFullAccess && settings.profileCompleteness >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-9 h-9 text-indigo-400" />
            <div>
              <h2 className="text-3xl font-bold text-slate-100">Privacy & Visibility</h2>
              <p className="text-slate-400 text-lg mt-1">
                Control what employers see in Marketplace and which portfolio items are shared
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* PORTFOLIO VISIBILITY → INSTANT CASCADE */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xl font-bold text-slate-100 flex items-center gap-3">
                  Portfolio Visibility
                </label>
                <Badge variant="secondary" className="ml-auto">
                  Impacts {visibleItemsCount} items
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {visibilityOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = settings.portfolioVisibility === option.value;
                  const isDisabled = option.disabled || false;

                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                      onClick={() => {
                        if (!isDisabled) {
                          updateSettings({ portfolioVisibility: option.value });
                        }
                      }}
                      disabled={isDisabled}
                      className={`h-20 p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? `border-${option.color}-500 bg-${option.color}-500/10`
                          : 'border-slate-700 hover:border-slate-600'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? `text-${option.color}-400` : 'text-slate-400'}`} />
                      <div className="font-medium text-slate-100">{option.label}</div>
                      <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                      {isDisabled && (
                        <p className="text-xs text-amber-400 mt-1">Requires 80% profile</p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Changing visibility instantly syncs {visibleItemsCount} approved portfolio items to match this setting
              </p>
            </div>

            {/* MARKETPLACE CONTACT → EMPLOYER REACH */}
            <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-7 h-7 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-xl text-slate-100">Marketplace Contact</h4>
                    <p className="text-emerald-300 text-sm">Allow employers to message you directly</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (canEnableContact) {
                      updateSettings({ marketplaceContactEnabled: !settings.marketplaceContactEnabled });
                    }
                  }}
                  disabled={!canEnableContact}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.marketplaceContactEnabled && canEnableContact
                      ? 'bg-emerald-500'
                      : 'bg-slate-700'
                  } ${!canEnableContact ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.marketplaceContactEnabled && canEnableContact ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {!canEnableContact && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-300">
                      Requires Professional tier + 80% profile completeness
                    </p>
                  </div>
                </div>
              )}
              {canEnableContact && (
                <p className="text-xs text-slate-400 mt-3">
                  When enabled, employers viewing your marketplace profile can send you messages about opportunities
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

