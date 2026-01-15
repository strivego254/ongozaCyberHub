/**
 * Student Curriculum Page - Redesigned v3
 * The "GPS" for navigating the OCH learning journey
 * Now with real track data from the Curriculum Engine API
 */

'use client';

import { useState, useEffect } from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { CurriculumHierarchy } from './components/CurriculumHierarchy';
import { AICoachWidget } from './components/AICoachWidget';
import { TalentScopePreview } from './components/TalentScopePreview';
import { motion } from 'framer-motion';
import { Map as MapIcon, BookOpen, Sparkles, LayoutGrid, Brain, TrendingUp, Zap, Shield, Cloud, Monitor, ChevronRight, Loader2, Lock, Unlock, Star, Award, Target, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurriculumTracks, useMyProgress } from '@/hooks/useCurriculumProgress';
import { useAuth } from '@/hooks/useAuth';
import { fastapiClient } from '@/services/fastapiClient';
import Link from 'next/link';
import type { CurriculumTrack, UserTrackProgress } from '@/services/types/curriculum';

// Mock data removed - using real API data

// Track icons
const trackIcons: Record<string, React.ReactNode> = {
  CYBERDEF: <Shield className="w-6 h-6" />,
  CLOUDSEC: <Cloud className="w-6 h-6" />,
  SOCANALYST: <Monitor className="w-6 h-6" />,
  DEFENDER: <Shield className="w-6 h-6" />,
  OFFENSIVE: <Zap className="w-6 h-6" />,
  GRC: <FileText className="w-6 h-6" />,
  INNOVATION: <Rocket className="w-6 h-6" />,
  LEADERSHIP: <Award className="w-6 h-6" />,
};

import { FileText } from 'lucide-react';

// Track colors
const trackColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  CYBERDEF: { bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
  CLOUDSEC: { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
  SOCANALYST: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400', shadow: 'shadow-purple-500/20' },
  DEFENDER: { bg: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
  OFFENSIVE: { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30', text: 'text-red-400', shadow: 'shadow-red-500/20' },
  GRC: { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', shadow: 'shadow-emerald-500/20' },
  INNOVATION: { bg: 'from-cyan-500/20 to-indigo-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
  LEADERSHIP: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', text: 'text-amber-400', shadow: 'shadow-amber-500/20' },
};

interface TrackCardProps {
  track: CurriculumTrack;
  progress?: UserTrackProgress | null;
  isLocked: boolean;
  isRecommended: boolean;
  recommendedTrackKey?: string;
}

function TrackCard({ track, progress, isLocked, isRecommended, recommendedTrackKey }: TrackCardProps) {
  const baseCode = track.code.split('_')[0];
  const colors = trackColors[baseCode] || trackColors[track.code] || trackColors.CYBERDEF;
  const icon = trackIcons[baseCode] || trackIcons[track.code] || <BookOpen className="w-6 h-6" />;
  const isEnrolled = !!progress;
  const completionPct = progress?.completion_percentage || 0;
  
  const tierNames: Record<number, string> = {
    2: 'Beginner',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Mastery',
  };
  
  const tierColors: Record<number, { bg: string; text: string; border: string }> = {
    2: { bg: 'from-emerald-500/20 to-teal-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    3: { bg: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    4: { bg: 'from-orange-500/20 to-red-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    5: { bg: 'from-purple-500/20 to-pink-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  };
  
  const tierInfo = tierColors[track.tier || 2] || tierColors[2];
  const tierName = tierNames[track.tier || 2] || 'Beginner';
  
  const cardContent = (
    <div className={`
      p-6 rounded-2xl bg-gradient-to-br ${isLocked ? 'bg-slate-900/30' : colors.bg} 
      border-2 ${isLocked ? 'border-slate-700/50' : colors.border} 
      ${isLocked ? 'opacity-60' : ''}
      hover:shadow-xl ${colors.shadow} transition-all duration-300 h-full relative
      ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
    `}>
      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-semibold">Not Your Track</p>
            <p className="text-slate-500 text-xs mt-1">
              Recommended: {recommendedTrackKey || 'Your Track'}
            </p>
          </div>
        </div>
      )}
      
      {/* Recommended Badge */}
      {isRecommended && !isLocked && (
        <div className="absolute top-4 right-4 z-20">
          <Badge variant="gold" className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            Recommended
          </Badge>
        </div>
      )}
      
      {/* Tier Badge */}
      <div className="absolute top-4 left-4 z-20">
        <Badge className={`${tierInfo.bg} ${tierInfo.border} ${tierInfo.text} border`}>
          Tier {track.tier || 2} - {tierName}
        </Badge>
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4 mt-8">
        <div className={`w-12 h-12 rounded-xl ${colors.text} bg-slate-900/50 flex items-center justify-center`}>
          {icon}
        </div>
        {isEnrolled && !isLocked && (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            {Math.round(completionPct)}% Complete
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
        {track.name}
      </h3>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4">
        {track.description || 'Master essential skills in this comprehensive track.'}
      </p>
      
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span>{track.module_count} Modules</span>
        <span>•</span>
        <span>{track.lesson_count} Lessons</span>
        {track.estimated_duration_weeks && (
          <>
            <span>•</span>
            <span>{track.estimated_duration_weeks} weeks</span>
          </>
        )}
      </div>
      
      {/* Progress bar (if enrolled) */}
      {isEnrolled && !isLocked && (
        <div className="mb-4">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
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
        <span className={`text-sm font-medium ${isLocked ? 'text-slate-500' : isEnrolled ? 'text-emerald-400' : colors.text}`}>
          {isLocked ? 'Locked' : isEnrolled ? 'Continue Learning' : 'Start Track'}
        </span>
        {!isLocked && (
          <ChevronRight className={`w-5 h-5 ${colors.text} group-hover:translate-x-1 transition-transform`} />
        )}
      </div>
    </div>
  );
  
  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        {cardContent}
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <Link href={track.tier === 2 
        ? `/dashboard/student/curriculum/${track.code}/tier2`
        : `/dashboard/student/curriculum/${track.code}`
      }>
        {cardContent}
      </Link>
    </motion.div>
  );
}

export default function CurriculumPage() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showLegacyView, setShowLegacyView] = useState(false);
  const [recommendedTrackKey, setRecommendedTrackKey] = useState<string | null>(null);
  const [loadingRecommendedTrack, setLoadingRecommendedTrack] = useState(true);
  
  const { user } = useAuth();
  const { tracks: rawTracks, loading: tracksLoading, error: tracksError } = useCurriculumTracks();
  const { tracks: enrolledTracks, stats, loading: progressLoading } = useMyProgress(user?.id || '');
  
  // Ensure tracks is always an array
  const tracks = Array.isArray(rawTracks) ? rawTracks : [];

  // Fetch recommended track from profiler
  useEffect(() => {
    const fetchRecommendedTrack = async () => {
      if (!user?.id) {
        setLoadingRecommendedTrack(false);
        return;
      }

      try {
        // Try FastAPI profiling first
        const profilingStatus = await fastapiClient.profiling.checkStatus();
        if (profilingStatus.completed && profilingStatus.session_id) {
          const results = await fastapiClient.profiling.getResults(profilingStatus.session_id);
          
          if (results.primary_track?.key) {
            setRecommendedTrackKey(results.primary_track.key.toLowerCase());
            setLoadingRecommendedTrack(false);
            return;
          }
          
          // Fallback to recommendations
          if (results.recommendations && results.recommendations.length > 0) {
            const primaryRec = results.recommendations[0];
            if (primaryRec.track_key) {
              setRecommendedTrackKey(primaryRec.track_key.toLowerCase());
              setLoadingRecommendedTrack(false);
              return;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch recommended track from FastAPI:', error);
      }

      setLoadingRecommendedTrack(false);
    };

    fetchRecommendedTrack();
  }, [user?.id]);

  // Find enrolled progress for each track
  const getTrackProgress = (trackCode: string): UserTrackProgress | null => {
    return enrolledTracks.find(p => p.track_code === trackCode) || null;
  };

  // Check if track matches recommended track
  const isTrackRelevant = (track: CurriculumTrack): boolean => {
    if (!recommendedTrackKey) return true; // If no recommendation, show all tracks unlocked
    
    const trackCodeLower = track.code.toLowerCase();
    const trackNameLower = track.name.toLowerCase();
    const recommendedLower = recommendedTrackKey.toLowerCase();
    
    // Track key mappings (e.g., "defender" matches "DEFENDER", "SOCDEFENSE", etc.)
    const trackKeyMappings: Record<string, string[]> = {
      'defender': ['defender', 'defense', 'soc', 'security', 'blue', 'cyberdef'],
      'offensive': ['offensive', 'offense', 'red', 'penetration', 'hacking', 'pentest'],
      'grc': ['grc', 'governance', 'risk', 'compliance', 'audit'],
      'innovation': ['innovation', 'cloud', 'devops', 'automation', 'scripting', 'cloudsec'],
      'leadership': ['leadership', 'management', 'executive', 'strategy'],
    };
    
    // Check direct match
    if (trackCodeLower.includes(recommendedLower) || trackNameLower.includes(recommendedLower)) {
      return true;
    }
    
    // Check against mappings
    const mappings = trackKeyMappings[recommendedLower] || [];
    for (const mapping of mappings) {
      if (trackCodeLower.includes(mapping) || trackNameLower.includes(mapping)) {
        return true;
      }
    }
    
    // Check reverse (if recommended is in track code)
    const trackCodeParts = trackCodeLower.split(/[_-]/);
    for (const part of trackCodeParts) {
      if (recommendedLower.includes(part) || part.includes(recommendedLower)) {
        return true;
      }
    }
    
    return false;
  };

  // Group tracks by tier (2-5: Beginner, Intermediate, Advanced, Mastery)
  const tracksByTier = tracks.reduce((acc, track) => {
    const tier = track.tier || 2;
    if (tier >= 2 && tier <= 5) {
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(track);
    }
    return acc;
  }, {} as Record<number, CurriculumTrack[]>);

  const tierOrder = [2, 3, 4, 5];
  const tierLabels: Record<number, { name: string; icon: JSX.Element; description: string }> = {
    2: { name: 'Beginner Tracks', icon: <Rocket className="w-5 h-5" />, description: 'Build confidence through core concepts' },
    3: { name: 'Intermediate Tracks', icon: <Target className="w-5 h-5" />, description: 'Apply concepts with real tools' },
    4: { name: 'Advanced Tracks', icon: <Award className="w-5 h-5" />, description: 'Solve complex problems independently' },
    5: { name: 'Mastery Tracks', icon: <Star className="w-5 h-5" />, description: 'Lead real-world cyber outcomes' },
  };

  const loading = tracksLoading || progressLoading || loadingRecommendedTrack;

  return (
    <RouteGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapIcon className="w-5 h-5 text-indigo-400" />
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Your Journey GPS</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Curriculum <span className="text-indigo-400">Navigator</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowLegacyView(!showLegacyView)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-bold">{showLegacyView ? 'New View' : 'Legacy'}</span>
            </button>
            <Link href="/dashboard/student/profiler">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Persona Strategy</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Summary (if enrolled in any track) */}
        {stats && enrolledTracks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-white">{stats.total_tracks_enrolled}</div>
              <div className="text-xs text-slate-500">Tracks Enrolled</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-emerald-400">{stats.total_points}</div>
              <div className="text-xs text-slate-500">Total Points</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{stats.current_streak_days}</div>
              <div className="text-xs text-slate-500">Day Streak</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-purple-400">{stats.total_badges}</div>
              <div className="text-xs text-slate-500">Badges Earned</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-cyan-400">{Math.round(stats.total_time_spent_minutes / 60)}h</div>
              <div className="text-xs text-slate-500">Time Invested</div>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-2xl font-bold text-pink-400">{stats.total_tracks_completed}</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
          </motion.div>
        )}

        {/* Recommended Track Info */}
        {recommendedTrackKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-2 border-indigo-500/30 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-black text-white">Your Recommended Track</h3>
            </div>
            <p className="text-gray-300">
              Based on your AI Profiler assessment, you've been matched with the <span className="font-bold text-amber-400 capitalize">{recommendedTrackKey}</span> track. 
              Tracks matching your recommendation are unlocked, while others are locked until you complete your recommended path.
            </p>
          </motion.div>
        )}

        {/* Tracks by Tier */}
        <div className="space-y-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          ) : tracksError ? (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-red-400">
              {tracksError}
            </div>
          ) : tracks.length === 0 ? (
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
              <p className="text-slate-400">No curriculum tracks available yet.</p>
            </div>
          ) : (
            tierOrder.map((tier) => {
              const tierTracks = tracksByTier[tier] || [];
              if (tierTracks.length === 0) return null;
              
              const tierInfo = tierLabels[tier];
              
              return (
                <div key={tier} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-px h-8 bg-gradient-to-b from-indigo-400 to-transparent" />
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        {tierInfo.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">{tierInfo.name}</h2>
                        <p className="text-slate-400 text-sm">{tierInfo.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tierTracks.map((track, index) => {
                      const isRelevant = isTrackRelevant(track);
                      const isRecommended = recommendedTrackKey && 
                        (track.code.toLowerCase().includes(recommendedTrackKey) || 
                         track.name.toLowerCase().includes(recommendedTrackKey));
                      
                      return (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
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

        {/* Legacy View Toggle */}
        {showLegacyView && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 text-white">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-bold uppercase tracking-wider italic">Active Learning Path</h2>
                  </div>
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 animate-pulse">Live: Log Analysis</Badge>
                </div>

                <CurriculumHierarchy 
                  currentTier={2} 
                  modules={[]} 
                  onSelectLesson={(id) => setActiveLessonId(id)}
                />

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border border-amber-500/20 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-24 h-24 text-amber-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-2 text-amber-400">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-xs uppercase tracking-widest">Recipe Engine</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Feeling stuck on a mission?</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        Bridge technical gaps with micro-skill boosters. Focused, step-by-step guides contextually available for your current track tasks.
                      </p>
                    </div>
                    <Link href="/recipes">
                      <button className="px-6 py-2.5 bg-amber-500 text-slate-900 font-black uppercase text-xs rounded-xl hover:bg-amber-400 transition-all">
                        Browse Recipes
                      </button>
                    </Link>
                  </div>
                </motion.div>
              </div>

              <div className="lg:col-span-4 space-y-8 sticky top-8">
                <div className="flex items-center gap-3 text-white mb-4 pl-1">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-bold uppercase tracking-wider italic">Coaching OS</h2>
                </div>
                <AICoachWidget alignmentScore={82} />

                <div className="flex items-center gap-3 text-white mb-4 pl-1 pt-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-bold uppercase tracking-wider italic">TalentScope</h2>
                </div>
                <TalentScopePreview 
                  readinessScore={68} 
                  topGaps={['Network Forensics', 'SIEM Config', 'Python Automation']}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
