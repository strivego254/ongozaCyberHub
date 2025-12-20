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
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { usePortfolio } from '@/hooks/usePortfolio';
import { MissingFieldsNudges } from './MissingFieldsNudges';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export function ProfileCompleteness() {
  const { settings, updateSettings } = useSettingsMaster();
  const { items } = usePortfolio();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  if (!settings) return null;

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
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/40 glass-card-hover">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Avatar Upload */}
              <div className="relative group">
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full border-4 border-slate-800/50 group-hover:border-indigo-500/70 shadow-2xl transition-all overflow-hidden bg-slate-800 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-400" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                  <Upload className="w-6 h-6 text-indigo-400" />
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
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-7 h-7 text-purple-400" />
                  <h2 className="text-2xl font-bold text-slate-100">Future-You</h2>
                </div>
                <p className="text-purple-300 text-lg mb-3">{futureYouPersona}</p>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-sm px-4 py-1.5">
                  {recommendedTrack} Track
                </Badge>
              </div>
            </div>

            {/* Completeness Progress */}
            <div className="mt-6 pt-6 border-t border-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">
                  Profile Completeness
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {settings.profileCompleteness}%
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
          </div>
        </Card>
      </motion.div>

      {/* MISSING FIELDS NUDGES */}
      <MissingFieldsNudges settings={settings} hasPortfolioItems={hasPortfolioItems} onUpdate={updateSettings} />
    </div>
  );
}

