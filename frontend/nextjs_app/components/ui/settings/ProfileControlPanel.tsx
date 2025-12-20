/**
 * Profile Control Panel Component
 * Completeness engine with gamified progress
 */

'use client';

import { useState } from 'react';
import { User, Upload, Linkedin, FileText, Globe, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getCompletenessBreakdown, getNextSteps } from '@/lib/settings/profile-completeness';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

interface ProfileControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
  hasPortfolioItems?: boolean;
}

export function ProfileControlPanel({ 
  settings, 
  onUpdate, 
  hasPortfolioItems = false 
}: ProfileControlPanelProps) {
  if (!settings) return null;

  const breakdown = getCompletenessBreakdown(settings, hasPortfolioItems);
  const nextSteps = getNextSteps(settings, hasPortfolioItems);
  const completedCount = breakdown.filter((item) => item.completed).length;

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Profile Completeness</h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete your profile to unlock marketplace access and showcase your skills to employers
            </p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">
              {settings.profileCompleteness}% Complete
            </span>
            <span className="text-xs text-slate-500">
              {completedCount} of {breakdown.length} completed
            </span>
          </div>
          <ProgressBar 
            value={settings.profileCompleteness} 
            variant="defender"
            className="h-3"
          />
          {settings.profileCompleteness < 80 && (
            <p className="text-xs text-amber-400 mt-2">
              {80 - settings.profileCompleteness}% more needed for marketplace access
            </p>
          )}
        </div>

        {/* Completeness Checklist */}
        <div className="space-y-3 mb-6">
          {breakdown.map((item) => (
            <div
              key={item.field}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                item.completed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                )}
                <div>
                  <div className="text-sm font-medium text-slate-200">{item.label}</div>
                  <div className="text-xs text-slate-500">+{item.weight}%</div>
                </div>
              </div>
              {!item.completed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (item.field === 'avatarUploaded') {
                      // Trigger file upload
                      document.getElementById('avatar-upload')?.click();
                    } else if (item.field === 'linkedinLinked') {
                      // Trigger LinkedIn OAuth
                      window.location.href = '/api/auth/linkedin';
                    } else if (item.field === 'bioCompleted') {
                      // Open bio editor
                      onUpdate({ bioCompleted: true });
                    } else if (item.field === 'timezoneSet') {
                      // Open timezone selector
                      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      onUpdate({ timezoneSet: timezone });
                    } else if (item.field === 'portfolioVisibility') {
                      onUpdate({ portfolioVisibility: 'marketplace_preview' });
                    }
                  }}
                >
                  Complete
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Impact Explanation */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            How this affects your platform experience
          </h3>
          <ul className="text-xs text-slate-400 space-y-1.5">
            <li>• <strong className="text-slate-300">Marketplace:</strong> {settings.profileCompleteness >= 80 ? 'Your profile is visible to employers' : 'Complete 80% to unlock marketplace visibility'}</li>
            <li>• <strong className="text-slate-300">AI Coach:</strong> More complete profiles receive better personalized recommendations</li>
            <li>• <strong className="text-slate-300">TalentScope:</strong> Profile data syncs to improve readiness scoring</li>
          </ul>
        </div>

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Next Steps</h3>
            <ul className="space-y-1">
              {nextSteps.map((step, index) => (
                <li key={index} className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                  const fileExt = file.name.split('.').pop();
                  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                  const filePath = `avatars/${fileName}`;

                  const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file, { upsert: true });

                  if (uploadError) throw uploadError;

                  const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                  // Update settings
                  onUpdate({ avatarUploaded: true });
                  
                  // Update user metadata
                  await supabase.auth.updateUser({
                    data: { avatar_url: publicUrl }
                  });
                }
              } catch (error) {
                console.error('Avatar upload failed:', error);
                alert('Failed to upload avatar. Please try again.');
              }
            }
          }}
        />
      </div>
    </Card>
  );
}

