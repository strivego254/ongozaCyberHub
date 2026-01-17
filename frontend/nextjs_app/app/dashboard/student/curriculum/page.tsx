/**
 * Student Curriculum Page - Compact Redesign
 * Track-themed, compact, and visually appealing
 */

'use client';

import { useState, useEffect } from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { motion } from 'framer-motion';
import { Map as MapIcon, BookOpen, Sparkles, Loader2, Lock, ChevronRight, Star, Award, Target, Rocket, Shield, Zap, FileText, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCurriculumTracks, useMyProgress } from '@/hooks/useCurriculumProgress';
import { useAuth } from '@/hooks/useAuth';
import { fastapiClient } from '@/services/fastapiClient';
import Link from 'next/link';
import type { CurriculumTrack, UserTrackProgress } from '@/services/types/curriculum';

// Track icons
const trackIcons: Record<string, React.ReactNode> = {
  CYBERDEF: <Shield className="w-5 h-5" />,
  CLOUDSEC: <Shield className="w-5 h-5" />,
  SOCANALYST: <Shield className="w-5 h-5" />,
  DEFENDER: <Shield className="w-5 h-5" />,
  OFFENSIVE: <Zap className="w-5 h-5" />,
  GRC: <FileText className="w-5 h-5" />,
  INNOVATION: <Rocket className="w-5 h-5" />,
  LEADERSHIP: <Award className="w-5 h-5" />,
};

// Track colors - matching dashboard themes
const trackColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  CYBERDEF: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', gradient: 'from-indigo-500/20 via-blue-500/10 to-indigo-500/20' },
  CLOUDSEC: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 to-blue-500/20' },
  SOCANALYST: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/20' },
  DEFENDER: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', gradient: 'from-indigo-500/20 via-blue-500/10 to-indigo-500/20' },
  OFFENSIVE: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', gradient: 'from-red-500/20 via-orange-500/10 to-red-500/20' },
  GRC: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', gradient: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20' },
  INNOVATION: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', gradient: 'from-cyan-500/20 via-sky-500/10 to-cyan-500/20' },
  LEADERSHIP: { bg: 'bg-och-gold/20', border: 'border-och-gold/30', text: 'text-och-gold', gradient: 'from-och-gold/20 via-amber-500/10 to-och-gold/20' },
  CROSS_LEADERSHIP: { bg: 'bg-och-gold/20', border: 'border-och-gold/30', text: 'text-och-gold', gradient: 'from-och-gold/20 via-amber-500/10 to-och-gold/20' },
};

interface TrackCardProps {
  track: CurriculumTrack;
  progress?: UserTrackProgress | null;
  isLocked: boolean;
  isRecommended: boolean;
  recommendedTrackKey?: string;
}

function TrackCard({ track, progress, isLocked, isRecommended, recommendedTrackKey }: TrackCardProps) {
  // Extract base code (e.g., "LEADERSHIP" from "LEADERSHIP_2")
  const baseCode = track.code.split('_')[0].toUpperCase();
  const colors = trackColors[baseCode] || trackColors[track.code.toUpperCase()] || trackColors.DEFENDER;
  const icon = trackIcons[baseCode] || trackIcons[track.code.toUpperCase()] || <BookOpen className="w-5 h-5" />;
  const isEnrolled = !!progress;
  const completionPct = progress?.completion_percentage || 0;
  
  const tierNames: Record<number, string> = {
    2: 'Beginner',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Mastery',
  };
  
  const tierColors: Record<number, { bg: string; text: string; border: string }> = {
    2: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    3: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    4: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    5: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };
  
  const tierInfo = tierColors[track.tier || 2] || tierColors[2];
  const tierName = tierNames[track.tier || 2] || 'Beginner';
  
  const cardContent = (
    <div className={`
      p-4 rounded-xl bg-gradient-to-br ${isLocked ? 'bg-slate-900/30' : colors.gradient} 
      border ${isLocked ? 'border-slate-700/50' : colors.border} 
      ${isLocked ? 'opacity-60' : ''}
      hover:shadow-lg transition-all duration-300 h-full relative
      ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
    `}>
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/70 rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-6 h-6 text-slate-500 mx-auto mb-1" />
            <p className="text-slate-400 text-xs font-semibold">Locked</p>
          </div>
        </div>
      )}
      
      {/* Badges */}
      <div className="flex items-start justify-between mb-3">
        <Badge className={`${tierInfo.bg} ${tierInfo.border} ${tierInfo.text} border text-[10px]`}>
          {tierName}
        </Badge>
        {isRecommended && !isLocked && (
          <Badge variant="gold" className="text-[10px] flex items-center gap-1">
            <Star className="w-3 h-3" />
            Recommended
          </Badge>
        )}
      </div>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white truncate mb-0.5">
            {track.name}
          </h3>
          {isEnrolled && !isLocked && (
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              {Math.round(completionPct)}% Complete
            </Badge>
          )}
        </div>
      </div>
      
      {/* Description */}
      <p className="text-xs text-och-steel line-clamp-2 mb-3 leading-relaxed">
        {track.description || 'Master essential skills in this comprehensive track.'}
      </p>
      
      {/* Stats */}
      <div className="flex items-center gap-2 text-[10px] text-och-steel mb-3">
        <span>{track.module_count} Modules</span>
        <span>•</span>
        <span>{track.lesson_count} Lessons</span>
        {track.estimated_duration_weeks && (
          <>
            <span>•</span>
            <span>{track.estimated_duration_weeks}w</span>
          </>
        )}
      </div>
      
      {/* Progress bar (if enrolled) */}
      {isEnrolled && !isLocked && (
        <div className="mb-3">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
      
      {/* Action */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${isLocked ? 'text-och-steel' : isEnrolled ? 'text-emerald-400' : colors.text}`}>
          {isLocked ? 'Locked' : isEnrolled ? 'Continue' : 'Start Track'}
        </span>
        {!isLocked && (
          <ChevronRight className={`w-4 h-4 ${colors.text}`} />
        )}
      </div>
    </div>
  );
  
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {cardContent}
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Link href={track.tier === 2 
        ? `/dashboard/student/curriculum/${track.code}/tier2`
        : track.tier === 6
        ? `/dashboard/student/curriculum/cross-track/${track.code}`
        : `/dashboard/student/curriculum/${track.code}`
      }>
        {cardContent}
      </Link>
    </motion.div>
  );
}

export default function CurriculumPage() {
  const [recommendedTrackKey, setRecommendedTrackKey] = useState<string | null>(null);
  const [loadingRecommendedTrack, setLoadingRecommendedTrack] = useState(true);
  
  const { user } = useAuth();
  const { tracks: rawTracks, loading: tracksLoading, error: tracksError } = useCurriculumTracks();
  const { tracks: enrolledTracks, stats, loading: progressLoading } = useMyProgress(String(user?.id || ''));
  
  const tracks = Array.isArray(rawTracks) ? rawTracks : [];

  // Debug: Log tracks to console
  useEffect(() => {
    if (tracks.length > 0) {
      console.log('📚 All curriculum tracks loaded:', tracks.length);
      const leadershipTracks = tracks.filter(t => t.code.toLowerCase().includes('leadership'));
      console.log('👑 Leadership tracks found:', leadershipTracks.length, leadershipTracks.map(t => `${t.code} (Tier ${t.tier})`));
    }
  }, [tracks]);

  // Fetch recommended track from user profile (Django)
  useEffect(() => {
    const fetchRecommendedTrack = async () => {
      if (!user?.id) {
        setLoadingRecommendedTrack(false);
        return;
      }

      try {
        // First, try to get recommended track from the profiler
        const profilingStatus = await fastapiClient.profiling.checkStatus();
        if (profilingStatus.completed && profilingStatus.session_id) {
          const results = await fastapiClient.profiling.getResults(profilingStatus.session_id);
          
          if (results.primary_track?.key) {
            setRecommendedTrackKey(results.primary_track.key.toLowerCase());
            console.log('✅ Recommended track from profiler:', results.primary_track.key);
            setLoadingRecommendedTrack(false);
            return;
          }
          
          if (results.recommendations && results.recommendations.length > 0) {
            const primaryRec = results.recommendations[0];
            if (primaryRec.track_key) {
              setRecommendedTrackKey(primaryRec.track_key.toLowerCase());
              console.log('✅ Recommended track from recommendations:', primaryRec.track_key);
              setLoadingRecommendedTrack(false);
              return;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch recommended track from profiler:', error);
      }

      // Fallback: Try to get from user profile if available
      if (user && 'recommended_track' in user) {
        const userProfile = user as any;
        if (userProfile.recommended_track) {
          setRecommendedTrackKey(userProfile.recommended_track.toLowerCase());
          console.log('✅ Recommended track from user profile:', userProfile.recommended_track);
          setLoadingRecommendedTrack(false);
          return;
        }
      }

      console.log('⚠️  No recommended track found for user');
      setLoadingRecommendedTrack(false);
    };

    fetchRecommendedTrack();
  }, [user?.id, user]);

  const getTrackProgress = (trackCode: string): UserTrackProgress | null => {
    return enrolledTracks.find(p => p.track_code === trackCode) || null;
  };

  const isTrackRelevant = (track: CurriculumTrack): boolean => {
    // Tier 6 (Cross-Track Programs) are always unlocked for all students
    // Per Tier 6 guidelines - cross-track programs are universal professional skills
    if (track.tier === 6) {
      return true;
    }
    
    // If no recommended track, show only Tier 6 (no primary tracks visible)
    if (!recommendedTrackKey) return false;
    
    const trackCodeLower = track.code.toLowerCase();
    const trackNameLower = track.name.toLowerCase();
    const recommendedLower = recommendedTrackKey.toLowerCase();
    
    const trackKeyMappings: Record<string, string[]> = {
      'defender': ['defender', 'defense', 'soc', 'security', 'blue', 'cyberdef'],
      'offensive': ['offensive', 'offense', 'red', 'penetration', 'hacking', 'pentest'],
      'grc': ['grc', 'governance', 'risk', 'compliance', 'audit'],
      'innovation': ['innovation', 'cloud', 'devops', 'automation', 'scripting', 'cloudsec'],
      'leadership': ['leadership', 'management', 'executive', 'strategy', 'vip'],
    };
    
    // Direct match in code or name
    if (trackCodeLower.includes(recommendedLower) || trackNameLower.includes(recommendedLower)) {
      return true;
    }
    
    // Check track code parts (e.g., LEADERSHIP_2 should match 'leadership')
    const trackCodeParts = trackCodeLower.split(/[_-]/);
    for (const part of trackCodeParts) {
      if (recommendedLower.includes(part) || part.includes(recommendedLower)) {
        return true;
      }
    }
    
    // Check mappings
    const mappings = trackKeyMappings[recommendedLower] || [];
    for (const mapping of mappings) {
      if (trackCodeLower.includes(mapping) || trackNameLower.includes(mapping)) {
        return true;
      }
    }
    
    return false;
  };

  const tracksByTier = tracks.reduce((acc, track) => {
    const tier = track.tier || 2;
    if (tier >= 2 && tier <= 6) {
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(track);
    }
    return acc;
  }, {} as Record<number, CurriculumTrack[]>);

  const tierOrder = [2, 3, 4, 5, 6];
  const tierColors: Record<number, { bg: string; text: string; border: string }> = {
    2: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    3: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    4: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    5: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };
  const tierLabels: Record<number, { name: string; icon: JSX.Element; description: string }> = {
    2: { name: 'Beginner', icon: <Rocket className="w-4 h-4" />, description: 'Build confidence through core concepts' },
    3: { name: 'Intermediate', icon: <Target className="w-4 h-4" />, description: 'Apply concepts with real tools' },
    4: { name: 'Advanced', icon: <Award className="w-4 h-4" />, description: 'Solve complex problems independently' },
    5: { name: 'Mastery', icon: <Star className="w-4 h-4" />, description: 'Lead real-world cyber outcomes' },
    6: { name: 'Cross-Track', icon: <MapIcon className="w-4 h-4" />, description: 'Professional skills across all cyber roles' },
  };

  const loading = tracksLoading || progressLoading || loadingRecommendedTrack;

  // Get track theme for recommended track
  const recommendedTheme = recommendedTrackKey 
    ? trackColors[recommendedTrackKey.toUpperCase()] || trackColors.DEFENDER
    : null;

  return (
    <RouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          
          {/* Compact Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-och-steel font-bold text-[10px] uppercase tracking-widest">Your Journey GPS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Curriculum <span className="text-indigo-400">Navigator</span>
              </h1>
            </div>
            {stats && enrolledTracks.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                  {stats.total_tracks_enrolled} Enrolled
                </Badge>
                <Badge variant="outline" className="text-xs text-och-gold border-och-gold/30">
                  {stats.total_points} Points
                </Badge>
              </div>
            )}
          </div>

          {/* Stats Summary - Compact */}
          {stats && enrolledTracks.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 md:grid-cols-6 gap-2"
            >
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-white">{stats.total_tracks_enrolled}</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Tracks</div>
              </Card>
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-emerald-400">{stats.total_points}</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Points</div>
              </Card>
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-och-gold">{stats.current_streak_days}</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Streak</div>
              </Card>
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-purple-400">{stats.total_badges}</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Badges</div>
              </Card>
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-cyan-400">{Math.round(stats.total_time_spent_minutes / 60)}h</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Time</div>
              </Card>
              <Card className="p-3 bg-och-midnight/60 border border-och-steel/20 rounded-lg">
                <div className="text-lg font-black text-pink-400">{stats.total_tracks_completed}</div>
                <div className="text-[10px] text-och-steel uppercase tracking-wide">Done</div>
              </Card>
            </motion.div>
          )}

          {/* Recommended Track Info - Compact */}
          {recommendedTrackKey && recommendedTheme && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-gradient-to-br ${recommendedTheme.gradient} border ${recommendedTheme.border} rounded-xl`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className={`w-4 h-4 ${recommendedTheme.text}`} />
                <h3 className="text-sm font-black text-white">Your Recommended Track</h3>
              </div>
              <p className="text-xs text-och-steel leading-relaxed">
                Based on your AI Profiler assessment, you've been matched with the <span className={`font-bold ${recommendedTheme.text} capitalize`}>{recommendedTrackKey}</span> track. 
                Tracks matching your recommendation are unlocked.
              </p>
            </motion.div>
          )}

          {/* Tracks by Tier */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : tracksError ? (
              <Card className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400 text-sm">
                {tracksError}
              </Card>
            ) : tracks.length === 0 ? (
              <Card className="p-6 bg-och-midnight/60 border border-och-steel/20 rounded-xl text-center">
                <p className="text-och-steel text-sm">No curriculum tracks available yet.</p>
              </Card>
            ) : (
              tierOrder.map((tier) => {
                const tierTracks = tracksByTier[tier] || [];
                if (tierTracks.length === 0) return null;
                
                const tierInfo = tierLabels[tier];
                
                return (
                  <div key={tier} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${tierColors[tier]?.bg || 'bg-emerald-500/20'} border ${tierColors[tier]?.border || 'border-emerald-500/30'}`}>
                        {tierInfo.icon}
                      </div>
                      <div>
                        <h2 className="text-base font-black text-white">{tierInfo.name} Tracks</h2>
                        <p className="text-xs text-och-steel">{tierInfo.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tierTracks.map((track, index) => {
                        const isRelevant = isTrackRelevant(track);
                        const trackCodeLower = track.code.toLowerCase();
                        const trackNameLower = track.name.toLowerCase();
                        const recommendedLower = recommendedTrackKey?.toLowerCase() || '';
                        
                        // Check if this track matches the recommended track
                        const isRecommended = recommendedTrackKey && 
                          (trackCodeLower.includes(recommendedLower) || 
                           trackNameLower.includes(recommendedLower) ||
                           trackCodeLower.split('_')[0] === recommendedLower ||
                           trackCodeLower.startsWith(recommendedLower + '_'));
                        
                        return (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <TrackCard 
                              track={track} 
                              progress={getTrackProgress(track.code)}
                              isLocked={!isRelevant}
                              isRecommended={!!isRecommended}
                              recommendedTrackKey={recommendedTrackKey || undefined}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
