/**
 * Privacy Control Panel Component
 * Data flow master switch
 */

'use client';

import { Shield, Lock, Eye, Mail, Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

interface PrivacyControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function PrivacyControlPanel({ settings, onUpdate, userId }: PrivacyControlPanelProps) {
  if (!settings) return null;

  const visibilityOptions = [
    {
      value: 'private' as const,
      icon: Lock,
      label: 'Private',
      description: 'Only you • No employer access',
      color: 'slate',
    },
    {
      value: 'unlisted' as const,
      icon: Eye,
      label: 'Unlisted',
      description: 'Shareable link • Not in marketplace',
      color: 'blue',
    },
    {
      value: 'marketplace_preview' as const,
      icon: Globe,
      label: 'Marketplace',
      description: 'Employers • Profile 80%+ complete',
      color: 'indigo',
    },
    {
      value: 'public' as const,
      icon: Globe,
      label: 'Public',
      description: 'Everyone • Fully discoverable',
      color: 'emerald',
    },
  ];

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Privacy & Visibility</h2>
            <p className="text-xs text-slate-500 mt-1">
              Control who can see your portfolio and how your data is shared
            </p>
          </div>
        </div>

        {/* Portfolio Visibility */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block">
            Portfolio Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = settings.portfolioVisibility === option.value;
              const isDisabled = option.value === 'marketplace_preview' && settings.profileCompleteness < 80;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (!isDisabled) {
                      onUpdate({ portfolioVisibility: option.value });
                      
                      // Sync portfolio items visibility in realtime
                      if (userId) {
                        import('@/lib/portfolio/coordination').then(({ syncPortfolioVisibility }) => {
                          syncPortfolioVisibility(userId, option.value).catch(console.error);
                        });
                      }
                    }
                  }}
                  disabled={isDisabled}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-500/10`
                      : 'border-slate-700 hover:border-slate-600'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 text-${isSelected ? option.color : 'slate'}-400`} />
                    <span className={`font-semibold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <Badge variant="outline" className="ml-auto">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{option.description}</p>
                  {isDisabled && (
                    <p className="text-xs text-amber-400 mt-1">
                      Requires 80% profile completeness
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Marketplace Contact */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <div className="flex-1">
            <h4 className="font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Mail className="w-5 h-5 text-indigo-400" />
              Marketplace Contact
            </h4>
            <p className="text-sm text-slate-400">
              Allow employers to message you directly
            </p>
            <p className="text-xs text-slate-500 mt-1">
              When enabled, employers viewing your marketplace profile can send you messages about opportunities.
            </p>
            {settings.profileCompleteness < 80 && (
              <p className="text-xs text-amber-400 mt-1">
                Requires 80% profile completeness
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (settings.profileCompleteness >= 80) {
                onUpdate({ marketplaceContactEnabled: !settings.marketplaceContactEnabled });
              }
            }}
            disabled={settings.profileCompleteness < 80}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.marketplaceContactEnabled
                ? 'bg-indigo-500'
                : 'bg-slate-700'
            } ${settings.profileCompleteness < 80 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.marketplaceContactEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Data Sharing Consent */}
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-slate-100">Data Sharing</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dataSharingConsent.talentscope || false}
                onChange={(e) => {
                  onUpdate({
                    dataSharingConsent: {
                      ...settings.dataSharingConsent,
                      talentscope: e.target.checked,
                    },
                  });
                }}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-200">TalentScope Integration</div>
                <div className="text-xs text-slate-500">Share readiness scores and portfolio data</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dataSharingConsent.marketplace || false}
                onChange={(e) => {
                  onUpdate({
                    dataSharingConsent: {
                      ...settings.dataSharingConsent,
                      marketplace: e.target.checked,
                    },
                  });
                }}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500"
              />
              <div>
                <div className="text-sm font-medium text-slate-200">Marketplace Analytics</div>
                <div className="text-xs text-slate-500">Share view and engagement data</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
}

