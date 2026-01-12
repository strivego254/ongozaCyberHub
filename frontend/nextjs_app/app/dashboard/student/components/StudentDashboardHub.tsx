/**
 * Redesigned Student Dashboard Hub
 * Cockpit-style command center for Kenyan university students
 * Mobile-first, intuitive, and dynamically evolving
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Target, 
  TrendingUp, 
  Compass, 
  MessageSquare, 
  Users, 
  Star,
  Clock,
  CheckCircle2,
  Briefcase,
  ChevronRight,
  Flame,
  LineChart,
  Globe,
  ArrowUpRight,
  Store,
  PlayCircle,
  BookOpen,
  Award,
  BarChart3,
  Sparkles,
  Trophy,
  Bell,
  Calendar,
  Map,
  Rocket,
  Activity,
  Brain,
  TrendingDown,
  Eye,
  Lock,
  Unlock,
  MessageCircle,
  UserCircle,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStore } from '../lib/store/dashboardStore';
import { CoachingNudge } from '@/components/coaching/CoachingNudge';
import { fastapiClient } from '@/services/fastapiClient';
import { apiGateway } from '@/services/apiGateway';
import { programsClient } from '@/services/programsClient';
import { communityClient } from '@/services/communityClient';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function StudentDashboardHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    readiness, 
    cohortProgress, 
    trackOverview, 
    gamification, 
    portfolio, 
    nextActions,
    habits,
    events,
    communityFeed,
    leaderboard,
  } = useDashboardStore();
  const prefersReducedMotion = useReducedMotion();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'community'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [profiledTrack, setProfiledTrack] = useState<string | null>(null);
  const [loadingTrack, setLoadingTrack] = useState(true);
  
  // Cohort data state
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [cohortName, setCohortName] = useState<string | null>(null);
  const [cohortDiscussions, setCohortDiscussions] = useState<any[]>([]);
  const [cohortMentors, setCohortMentors] = useState<any[]>([]);
  const [loadingCohortData, setLoadingCohortData] = useState(true);

  // Track key to display name mapping
  const getTrackDisplayName = (trackKey: string | null | undefined): string => {
    if (!trackKey) return '';
    
    const trackMap: Record<string, string> = {
      'defender': 'Cyber Defender',
      'offensive': 'Cyber Offensive',
      'grc': 'Cyber GRC',
      'innovation': 'Cyber Innovator',
      'leadership': 'Cyber Leader',
    };
    
    return trackMap[trackKey.toLowerCase()] || trackKey;
  };

  // Fetch profiled track from backend
  useEffect(() => {
    const fetchProfiledTrack = async () => {
      if (!user?.id) {
        setLoadingTrack(false);
        return;
      }

      try {
        // Try FastAPI profiling results first (AI engine results)
        try {
          const profilingStatus = await fastapiClient.profiling.checkStatus();
          if (profilingStatus.completed && profilingStatus.session_id) {
            const results = await fastapiClient.profiling.getResults(profilingStatus.session_id);
            
            // primary_track is a TrackInfo object with a 'key' field
            if (results.primary_track) {
              const trackKey = results.primary_track.key || results.primary_track.track_key;
              if (trackKey) {
                setProfiledTrack(trackKey);
                setLoadingTrack(false);
                return;
              }
            }
            
            // Fallback: Check recommendations if primary_track not available
            if (results.recommendations && results.recommendations.length > 0) {
              const primaryRec = results.recommendations[0];
              if (primaryRec.track_key) {
                setProfiledTrack(primaryRec.track_key);
                setLoadingTrack(false);
                return;
              }
            }
          }
        } catch (fastapiError) {
          console.log('FastAPI profiling not available, trying Django...', fastapiError);
        }

        // Fallback to Django student profile
        try {
          const profileResponse = await apiGateway.get('/student/profile');
          
          // Check profiled_track first (from AI profiling engine)
          if (profileResponse?.profiled_track?.track_key) {
            setProfiledTrack(profileResponse.profiled_track.track_key);
            setLoadingTrack(false);
            return;
          }
          
          // Check future_you track
          if (profileResponse?.future_you?.track) {
            const track = profileResponse.future_you.track;
            // Extract track key from track name
            const trackKey = typeof track === 'string' 
              ? track.toLowerCase().replace(/\s+/g, '_').replace('cyber_', '').replace('_track', '')
              : track?.key || track?.track_key;
            if (trackKey && trackKey !== 'not recommended') {
              setProfiledTrack(trackKey);
              setLoadingTrack(false);
              return;
            }
          }
          
          // Check enrollment track_key
          if (profileResponse?.enrollment?.track_key) {
            setProfiledTrack(profileResponse.enrollment.track_key);
            setLoadingTrack(false);
            return;
          }
          
          // Check basic track_key
          if (profileResponse?.basic?.track_key) {
            setProfiledTrack(profileResponse.basic.track_key);
            setLoadingTrack(false);
            return;
          }
        } catch (djangoError) {
          console.log('Django profile not available:', djangoError);
        }
      } catch (error) {
        console.error('Failed to fetch profiled track:', error);
      } finally {
        setLoadingTrack(false);
      }
    };

    fetchProfiledTrack();
  }, [user?.id]);

  // Fetch cohort data (enrollment, discussions, mentors)
  useEffect(() => {
    const fetchCohortData = async () => {
      if (!user?.id) {
        setLoadingCohortData(false);
        return;
      }

      setLoadingCohortData(true);
      try {
        // Get student profile to find cohort
        const profileResponse = await apiGateway.get('/student/profile');
        const enrollment = profileResponse?.enrollment;
        
        if (enrollment?.cohort_id) {
          const cohortIdStr = String(enrollment.cohort_id);
          setCohortId(cohortIdStr);
          setCohortName(enrollment.cohort_name || null);

          // Fetch cohort discussions/feed
          try {
            // Get community feed (will include cohort discussions)
            const feedResponse = await communityClient.getFeed({ 
              page: 1, 
              page_size: 5 
            });
            setCohortDiscussions(feedResponse.results || []);
          } catch (feedError) {
            console.error('Failed to fetch cohort discussions:', feedError);
            setCohortDiscussions([]);
          }

          // Fetch cohort mentors
          try {
            const mentors = await programsClient.getCohortMentors(cohortIdStr);
            setCohortMentors(mentors.filter((m: any) => m.active !== false) || []);
          } catch (mentorError) {
            console.error('Failed to fetch cohort mentors:', mentorError);
            setCohortMentors([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch cohort data:', error);
      } finally {
        setLoadingCohortData(false);
      }
    };

    fetchCohortData();
  }, [user?.id]);

  // Real data from API
  const readinessScore = readiness?.score || 0;
  const healthScore = readiness?.health_score || readinessScore;
  const persona = readiness?.persona || user?.persona || "Not Set";
  const streak = gamification?.streak || 0;
  const points = gamification?.points || 0;
  const rank = gamification?.rank || 'Bronze';
  const circleLevel = gamification?.level || '1';
  const badges = gamification?.badges || 0;

  // Get track display name for welcome message
  const trackDisplayName = getTrackDisplayName(profiledTrack);
  const welcomeMessage = trackDisplayName 
    ? `${trackDisplayName}`
    : user?.first_name || 'Student';
  
  // Full welcome text for desktop
  const welcomeText = trackDisplayName 
    ? `Welcome back, ${trackDisplayName}`
    : `Welcome back, ${user?.first_name || 'Student'}`;

  // Animation config
  const animationConfig = prefersReducedMotion 
    ? { duration: 0.1 }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-midnight/95 to-slate-950">
      {/* TOP NAVIGATION BAR - Mobile-First */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-och-midnight/95 backdrop-blur-md border-b border-och-steel/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Welcome */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-och-gold to-och-gold/80 flex items-center justify-center">
                <Shield className="w-6 h-6 text-black" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-och-steel font-bold uppercase tracking-wider">
                  {loadingTrack ? 'Loading...' : 'Welcome back'}
                </p>
                <p className="text-sm font-black text-white">
                  {loadingTrack ? user?.first_name || 'Student' : welcomeText}
                </p>
              </div>
              <div className="sm:hidden">
                <p className="text-sm font-black text-white">
                  {loadingTrack 
                    ? user?.first_name || 'Student' 
                    : (trackDisplayName ? `${trackDisplayName}` : user?.first_name || 'Student')
                  }
                </p>
              </div>
            </div>

            {/* Notification Bell & Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <Bell className="w-5 h-5 text-och-steel" />
                {events && events.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-och-defender rounded-full border border-och-midnight" />
                )}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/student/settings')}
                className="hidden sm:flex"
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* FLIGHT INSTRUMENTS - TalentScope Metrics */}
        <motion.div
          variants={prefersReducedMotion ? {} : containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Readiness Score - Primary Instrument */}
          <motion.div variants={itemVariants}>
            <Card className="p-5 bg-gradient-to-br from-och-mint/10 to-transparent border border-och-mint/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-och-mint" />
                  <span className="text-xs font-black text-och-steel uppercase tracking-wider">
                    Readiness
                  </span>
                </div>
                <Badge variant="mint" className="text-xs font-bold">
                  {readinessScore}/100
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {readinessScore}
                  </span>
                  <span className="text-xs text-och-steel">points</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-och-mint rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${readinessScore}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
                {readiness?.trend && (
                  <p className="text-xs text-och-mint font-bold">
                    {readiness.trend > 0 ? '+' : ''}{readiness.trend} this week
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Streak Counter */}
          <motion.div variants={itemVariants}>
            <Card className="p-5 bg-gradient-to-br from-och-gold/10 to-transparent border border-och-gold/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-och-gold" />
                  <span className="text-xs font-black text-och-steel uppercase tracking-wider">
                    Streak
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {streak}
                  </span>
                  <span className="text-xs text-och-steel">days</span>
                </div>
                <p className="text-xs text-och-gold font-bold">
                  Keep it going! 🔥
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Points & Level */}
          <motion.div variants={itemVariants}>
            <Card className="p-5 bg-gradient-to-br from-och-defender/10 to-transparent border border-och-defender/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-och-defender" />
                  <span className="text-xs font-black text-och-steel uppercase tracking-wider">
                    Points
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {points.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-och-steel">
                  Level {circleLevel} • {rank}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Badges & Achievements */}
          <motion.div variants={itemVariants}>
            <Card className="p-5 bg-gradient-to-br from-och-orange/10 to-transparent border border-och-orange/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-och-orange" />
                  <span className="text-xs font-black text-och-steel uppercase tracking-wider">
                    Badges
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {badges}
                  </span>
                </div>
                <p className="text-xs text-och-steel">
                  Achievements unlocked
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* WHAT TO DO NEXT - Actionable Guidance */}
        {nextActions && nextActions.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="p-6 bg-gradient-to-br from-och-gold/20 via-och-gold/10 to-transparent border border-och-gold/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-och-gold/20 flex items-center justify-center shrink-0">
                  <Rocket className="w-6 h-6 text-och-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight">
                    What to do next
                  </h3>
                  <p className="text-sm text-white mb-4 leading-relaxed">
                    {nextActions[0].title || "Continue your learning journey"}
                  </p>
                  {nextActions[0].description && (
                    <p className="text-xs text-och-steel mb-4">
                      {nextActions[0].description}
                    </p>
                  )}
                  <Button
                    variant="defender"
                    className="bg-och-gold text-black hover:bg-white font-bold uppercase tracking-wide text-xs"
                    onClick={() => router.push(nextActions[0].href || '/dashboard/student/curriculum')}
                  >
                    Start Now
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* MAIN CONTENT TABS */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-och-steel/20">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'progress', label: 'Progress', icon: LineChart },
              { id: 'community', label: 'Community', icon: Users },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all",
                    activeTab === tab.id
                      ? "border-och-gold text-white"
                      : "border-transparent text-och-steel hover:text-white"
                  )}
                >
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Missions & Curriculum */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Active Mission */}
                    <Card className="p-6 bg-gradient-to-br from-och-defender/20 to-transparent border border-och-defender/30">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-och-defender" />
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">
                          Current Mission
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-base font-bold text-white mb-2">
                            {trackOverview?.trackName || 'Cyber Defense Fundamentals'}
                          </h4>
                          <p className="text-sm text-och-steel">
                            Continue your journey through the {trackOverview?.trackName || 'cybersecurity'} track
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-och-steel font-bold">Progress</span>
                              <span className="text-xs text-white font-bold">
                                {Math.round(cohortProgress?.percentage || 0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-och-defender rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${cohortProgress?.percentage || 0}%` }}
                                transition={{ duration: 1 }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="defender"
                          className="w-full font-bold uppercase tracking-wide text-xs"
                          onClick={() => router.push('/dashboard/student/missions')}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Continue Mission
                        </Button>
                      </div>
                    </Card>

                    {/* Daily Habits Engine */}
                    <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-och-mint" />
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            Daily Habits
                          </h3>
                        </div>
                        {streak > 0 && (
                          <Badge variant="gold" className="text-xs font-bold">
                            {streak} Day Streak
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Learn', icon: BookOpen, color: 'och-gold', href: '/dashboard/student/curriculum' },
                          { label: 'Practice', icon: Target, color: 'och-defender', href: '/dashboard/student/missions' },
                          { label: 'Reflect', icon: MessageSquare, color: 'och-mint', href: '/dashboard/student/coaching' },
                        ].map((habit) => {
                          const HabitIcon = habit.icon;
                          return (
                            <button
                              key={habit.label}
                              onClick={() => router.push(habit.href)}
                              className={clsx(
                                "p-4 rounded-xl bg-white/5 border border-white/10 hover:border-och-gold/30 transition-all flex flex-col items-center gap-2 group"
                              )}
                            >
                              <div className={clsx("p-3 rounded-lg bg-och-gold/10 group-hover:bg-och-gold/20 transition-all")}>
                                <HabitIcon className={clsx("w-5 h-5 text-och-gold")} />
                              </div>
                              <span className="text-xs font-bold text-white uppercase tracking-wide">
                                {habit.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Cohort Discussions & Mentors */}
                  <div className="space-y-6">
                    {/* Cohort Group Discussions */}
                    <Card className="p-5 bg-och-midnight/60 border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-och-steel uppercase tracking-wider">
                          Cohort Discussions
                        </h3>
                        {cohortId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-och-gold hover:text-och-gold/80"
                            onClick={() => router.push('/dashboard/student/community')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View All
                          </Button>
                        )}
                      </div>
                      
                      {loadingCohortData ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : cohortDiscussions.length > 0 ? (
                        <div className="space-y-3">
                          {cohortDiscussions.slice(0, 3).map((discussion: any) => (
                            <button
                              key={discussion.id}
                              onClick={() => router.push(`/dashboard/student/community?post=${discussion.id}`)}
                              className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                            >
                              <div className="flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 text-och-gold mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-white uppercase tracking-wide truncate mb-1">
                                    {discussion.title || 'Discussion'}
                                  </p>
                                  <p className="text-xs text-och-steel line-clamp-2">
                                    {discussion.content || discussion.excerpt || ''}
                                  </p>
                                  {discussion.comment_count > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <MessageSquare className="w-3 h-3 text-och-steel" />
                                      <span className="text-xs text-och-steel">
                                        {discussion.comment_count} {discussion.comment_count === 1 ? 'reply' : 'replies'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-och-steel group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <MessageCircle className="w-8 h-8 text-och-steel/50 mx-auto mb-2" />
                          <p className="text-xs text-och-steel mb-3">
                            {cohortName ? `No discussions in ${cohortName} yet` : 'No cohort discussions available'}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-och-steel/30 text-och-steel hover:bg-white/10 text-xs"
                            onClick={() => router.push('/dashboard/student/community')}
                          >
                            Start Discussion
                          </Button>
                        </div>
                      )}
                    </Card>

                    {/* Available Cohort Mentors */}
                    <Card className="p-5 bg-och-midnight/60 border border-och-steel/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-och-steel uppercase tracking-wider">
                          Cohort Mentors
                        </h3>
                        {cohortId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-och-gold hover:text-och-gold/80"
                            onClick={() => router.push('/dashboard/student/mentorship')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View All
                          </Button>
                        )}
                      </div>
                      
                      {loadingCohortData ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                          ))}
                        </div>
                      ) : cohortMentors.length > 0 ? (
                        <div className="space-y-2">
                          {cohortMentors.slice(0, 4).map((mentor: any) => {
                            const mentorName = mentor.mentor_name || 
                              (mentor.mentor?.first_name && mentor.mentor?.last_name 
                                ? `${mentor.mentor.first_name} ${mentor.mentor.last_name}`
                                : mentor.mentor?.email || 'Mentor');
                            const mentorRole = mentor.role || 'Mentor';
                            
                            return (
                              <button
                                key={mentor.id || mentor.mentor?.id}
                                onClick={() => router.push(`/dashboard/student/mentorship?mentor=${mentor.mentor?.id || mentor.mentor_id}`)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-och-gold/20 flex items-center justify-center flex-shrink-0">
                                    <UserCircle className="w-5 h-5 text-och-gold" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white uppercase tracking-wide truncate">
                                      {mentorName}
                                    </p>
                                    <p className="text-xs text-och-steel capitalize">
                                      {mentorRole}
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-och-steel group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <UserCircle className="w-8 h-8 text-och-steel/50 mx-auto mb-2" />
                          <p className="text-xs text-och-steel mb-3">
                            {cohortName ? `No mentors assigned to ${cohortName} yet` : 'No mentors available'}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-och-steel/30 text-och-steel hover:bg-white/10 text-xs"
                            onClick={() => router.push('/dashboard/student/mentorship')}
                          >
                            View Mentorship
                          </Button>
                        </div>
                      )}
                    </Card>

                    {/* AI Success Advisor */}
                    <Card className="p-5 bg-gradient-to-br from-och-mint/10 to-transparent border border-och-mint/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-och-mint" />
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">
                          AI Success Advisor
                        </h3>
                      </div>
                      <p className="text-xs text-och-steel mb-4 leading-relaxed">
                        Your co-pilot for cybersecurity transformation. Ask questions, get guidance, and stay aligned with your Future-You persona.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-och-mint/30 text-och-mint hover:bg-och-mint hover:text-black font-bold uppercase tracking-wide text-xs"
                        onClick={() => router.push('/dashboard/student/coaching')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with AI Coach
                      </Button>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* TalentScope Analytics */}
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-och-mint" />
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        TalentScope Analytics
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/dashboard/student/portfolio')}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Readiness Breakdown */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                        Readiness Breakdown
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Technical Depth', value: 74, color: 'bg-och-gold' },
                          { label: 'Behavioral Readiness', value: 88, color: 'bg-och-mint' },
                          { label: 'Identity Alignment', value: 92, color: 'bg-och-defender' },
                        ].map((metric) => (
                          <div key={metric.label} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-och-steel">{metric.label}</span>
                              <span className="text-white">{metric.value}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${metric.color} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 1, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Future-You Blueprint */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                        Your Future-You Blueprint
                      </h4>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-och-gold/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-och-gold" />
                          </div>
                          <div>
                            <p className="text-xs text-och-steel font-bold uppercase tracking-wider">
                              Persona
                            </p>
                            <p className="text-sm font-black text-white">
                              {persona}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-och-steel leading-relaxed">
                          Your personalized career path based on your strengths and aspirations. Track your progress toward becoming your Future-You.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Track Progress */}
                {trackOverview && (
                  <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">
                      Track Progress
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white">
                            {trackOverview.trackName || 'Current Track'}
                          </span>
                          <span className="text-sm font-bold text-och-gold">
                            {trackOverview.completedMilestones || 0}/{trackOverview.totalMilestones || 0} Milestones
                          </span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-och-gold rounded-full"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${((trackOverview.completedMilestones || 0) / (trackOverview.totalMilestones || 1)) * 100}%` 
                            }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* University Community Feed */}
                <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-och-gold" />
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        Community Feed
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/dashboard/student/community')}
                    >
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {communityFeed && communityFeed.length > 0 ? (
                      communityFeed.slice(0, 5).map((post: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-och-midnight border border-och-steel/10 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-och-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white mb-1">
                                {post.user || 'Community Member'}
                              </p>
                              <p className="text-xs text-och-steel leading-relaxed">
                                {post.action || post.content || 'Shared an update'}
                              </p>
                              {post.time && (
                                <p className="text-[10px] text-och-steel mt-2">
                                  {post.time}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-och-steel mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-och-steel">
                          No community updates yet. Check back soon!
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Upcoming Events */}
                {events && events.length > 0 && (
                  <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-och-defender" />
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        Upcoming Events
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {events.slice(0, 3).map((event: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-white mb-1">
                                {event.title || 'Event'}
                              </p>
                              <p className="text-xs text-och-steel">
                                {event.date || event.time || 'TBA'}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              RSVP
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Coaching Nudge (Floating) */}
      <CoachingNudge userId={user?.id?.toString()} autoLoad={true} />
    </div>
  );
}
