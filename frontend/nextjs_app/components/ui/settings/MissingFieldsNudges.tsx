/**
 * Missing Fields Nudges Component
 * Proactive completeness prompts with quick actions
 */

'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Upload, Linkedin, FileText, Globe, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCompletenessBreakdown, getNextSteps } from '@/lib/settings/profile-completeness';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

interface MissingFieldsNudgesProps {
  settings: UserSettings;
  hasPortfolioItems: boolean;
  onUpdate: (updates: SettingsUpdate) => void;
}

export function MissingFieldsNudges({ settings, hasPortfolioItems, onUpdate }: MissingFieldsNudgesProps) {
  const breakdown = getCompletenessBreakdown(settings, hasPortfolioItems);
  const missingFields = breakdown.filter(item => !item.completed);

  if (missingFields.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border-emerald-500/40 glass-card-hover">
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Profile Complete!</h3>
            <p className="text-slate-400">
              Your profile is ready for marketplace visibility
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const fieldIcons = {
    avatarUploaded: Upload,
    name: User,
    headline: User,
    location: Globe,
    track: User,
    linkedinLinked: Linkedin,
    bioCompleted: FileText,
    timezoneSet: Globe,
    portfolioVisibility: Globe,
    hasPortfolioItems: FileText,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/5 glass-card-hover">
        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Boost Marketplace Ranking
              </h3>
              <p className="text-slate-400">
                Complete these fields to unlock employer contact (requires 80%+)
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingFields.slice(0, 4).map((field) => {
              const Icon = fieldIcons[field.field as keyof typeof fieldIcons] || FileText;
              return (
                <Button
                  key={field.field}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2 border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all"
                  onClick={() => {
                    if (field.field === 'avatarUploaded') {
                      document.getElementById('avatar-upload')?.click();
                    } else if (field.field === 'linkedinLinked') {
                      window.location.href = '/api/auth/linkedin';
                    } else if (field.field === 'bioCompleted') {
                      onUpdate({ bioCompleted: true });
                    } else if (field.field === 'timezoneSet') {
                      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      onUpdate({ timezoneSet: timezone });
                    } else if (field.field === 'portfolioVisibility') {
                      onUpdate({ portfolioVisibility: 'marketplace_preview' });
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-200 flex-1 text-left">
                      {field.label}
                    </span>
                    <span className="text-xs text-amber-400">+{field.weight}%</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

