/**
 * Profile Completeness Component
 * Gamified profile optimizer with Future-You persona
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Upload, Sparkles, AlertTriangle, Linkedin, Globe, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { MissingFieldsNudges } from './MissingFieldsNudges';
import { createClient } from '@/lib/supabase/client';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

const supabase = createClient();

interface ProfileCompletenessProps {
  settings: UserSettings;
  updateSettings: (updates: SettingsUpdate) => void;
  userId?: string;
}

export function ProfileCompleteness({ settings, updateSettings, userId }: ProfileCompletenessProps) {
  const { items } = usePortfolio(userId);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Debug: Log to verify component is receiving data
  console.log('ProfileCompleteness render:', { 
    hasSettings: !!settings, 
    profileCompleteness: settings?.profileCompleteness,
  });

  if (!settings) {
    return (
      <Card className="glass-card">
        <div className="p-8 text-center text-red-400">
          Error: Settings not provided to ProfileCompleteness
        </div>
      </Card>
    );
  }

  const hasPortfolioItems = items.length > 0;
  const futureYouPersona = settings.integrations?.futureYouPersona || 'Cybersecurity Professional';
  const recommendedTrack = settings.integrations?.recommendedTrack || 'Defender';

  const handleAvatarUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      setAvatarUrl(publicUrl);
      updateSettings({ avatarUploaded: true });
      
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* AVATAR + FUTURE-YOU */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/40 glass-card-hover" style={{ position: 'relative', zIndex: 1 }}>
          <div className="p-8" style={{ color: '#f1f5f9', minHeight: '300px' }}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Avatar Upload */}
              <div className="relative group" style={{ zIndex: 2 }}>
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-slate-800/50 group-hover:border-indigo-500/70 shadow-2xl transition-all overflow-hidden bg-slate-800 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-400" style={{ color: '#94a3b8' }} />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Upload className="w-6 h-6 text-indigo-400" style={{ color: '#818cf8' }} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                    }}
                  />
                </label>
              </div>

              {/* Future-You Persona */}
              <div className="flex-1" style={{ zIndex: 2 }}>
                <div className="flex items-center gap-3 mb-4" style={{ color: '#ffffff' }}>
                  <Sparkles className="w-7 h-7 text-purple-400" style={{ color: '#a78bfa', display: 'block' }} />
                  <h2 className="text-2xl font-bold text-slate-100" style={{ color: '#ffffff', display: 'block' }}>Future-You</h2>
                </div>
                <p className="text-purple-300 text-lg mb-3" style={{ color: '#ffffff', display: 'block' }}>{futureYouPersona || 'Cybersecurity Professional'}</p>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-sm px-4 py-1.5" style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', color: '#ffffff', display: 'inline-block' }}>
                  {recommendedTrack || 'Defender'} Track
                </Badge>
              </div>
            </div>

            {/* Completeness Progress */}
            <div className="mt-6 pt-6 border-t border-slate-800/50" style={{ borderTopColor: '#1e293b', zIndex: 10, borderTop: '1px solid #1e293b' }}>
              <div className="flex items-center justify-between mb-2" style={{ color: '#ffffff' }}>
                <span className="text-sm font-semibold text-slate-300" style={{ color: '#ffffff', display: 'block' }}>
                  Profile Completeness
                </span>
                <span className="text-lg font-bold text-emerald-400" style={{ color: '#34d399', display: 'block' }}>
                  {settings.profileCompleteness || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#1e293b', height: '12px' }}>
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, settings.profileCompleteness))}%`,
                    background: 'linear-gradient(to right, #6366f1, #10b981)',
                    height: '100%'
                  }}
                />
              </div>
              {settings.profileCompleteness < 80 && (
                <p className="text-xs text-amber-400 mt-2" style={{ color: '#fbbf24' }}>
                  {80 - settings.profileCompleteness}% more needed for marketplace access
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* MISSING FIELDS NUDGES */}
      <MissingFieldsNudges settings={settings} hasPortfolioItems={hasPortfolioItems} onUpdate={updateSettings} />
    </div>
  );
}

