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
import { Map as MapIcon, BookOpen, Sparkles, LayoutGrid, Brain, TrendingUp, Zap, Shield, Cloud, Monitor, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurriculumTracks, useMyProgress } from '@/hooks/useCurriculumProgress';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import type { CurriculumTrack, UserTrackProgress } from '@/services/types/curriculum';

// Mock data removed - using real API data

// Track icons
const trackIcons: Record<string, React.ReactNode> = {
  CYBERDEF: <Shield className="w-6 h-6" />,
  CLOUDSEC: <Cloud className="w-6 h-6" />,
  SOCANALYST: <Monitor className="w-6 h-6" />,
};

// Track colors
const trackColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  CYBERDEF: { bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/30', text: 'text-indigo-400', shadow: 'shadow-indigo-500/20' },
  CLOUDSEC: { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400', shadow: 'shadow-cyan-500/20' },
  SOCANALYST: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', text: 'text-purple-400', shadow: 'shadow-purple-500/20' },
};

interface TrackCardProps {
  track: CurriculumTrack;
  progress?: UserTrackProgress | null;
}

function TrackCard({ track, progress }: TrackCardProps) {
  const colors = trackColors[track.code] || trackColors.CYBERDEF;
  const icon = trackIcons[track.code] || <BookOpen className="w-6 h-6" />;
  const isEnrolled = !!progress;
  const completionPct = progress?.completion_percentage || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group"
    >
      <Link href={`/dashboard/student/curriculum/${track.code}`}>
        <div className={`
          p-6 rounded-2xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} 
          hover:shadow-xl ${colors.shadow} transition-all duration-300 cursor-pointer h-full
        `}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${colors.text} bg-slate-900/50 flex items-center justify-center`}>
              {icon}
            </div>
            {isEnrolled && (
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
          {isEnrolled && (
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
            <span className={`text-sm font-medium ${isEnrolled ? 'text-emerald-400' : colors.text}`}>
              {isEnrolled ? 'Continue Learning' : 'Start Track'}
            </span>
            <ChevronRight className={`w-5 h-5 ${colors.text} group-hover:translate-x-1 transition-transform`} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CurriculumPage() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showLegacyView, setShowLegacyView] = useState(false);
  
  const { user } = useAuth();
  const { tracks: rawTracks, loading: tracksLoading, error: tracksError } = useCurriculumTracks();
  const { tracks: enrolledTracks, stats, loading: progressLoading } = useMyProgress(user?.id || '');
  
  // Ensure tracks is always an array
  const tracks = Array.isArray(rawTracks) ? rawTracks : [];

  // Find enrolled progress for each track
  const getTrackProgress = (trackCode: string): UserTrackProgress | null => {
    return enrolledTracks.find(p => p.track_code === trackCode) || null;
  };

  const loading = tracksLoading || progressLoading;

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

        {/* Available Tracks Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-px h-8 bg-gradient-to-b from-indigo-400 to-transparent" />
            <h2 className="text-2xl font-black text-white">Available Tracks</h2>
          </div>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TrackCard track={track} progress={getTrackProgress(track.code)} />
                </motion.div>
              ))}
            </div>
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
                    <button className="px-6 py-2.5 bg-amber-500 text-slate-900 font-black uppercase text-xs rounded-xl hover:bg-amber-400 transition-all">
                      Browse Recipes
                    </button>
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
