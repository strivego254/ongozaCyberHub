/**
 * Redesigned Mentorship Hub
 * Implements the MMM (Mentorship Management Module)
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Target, 
  MessageSquare, 
  History,
  TrendingUp,
  Shield,
  Zap,
  ArrowUpRight,
  Clock,
  Plus,
  Search,
  Filter,
  Star,
  ExternalLink,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MentorProfileCard } from './MentorProfileCard';
import { SchedulingHub } from './SchedulingHub';
import { GoalsTracker } from './GoalsTracker';
import { SessionHistory } from './SessionHistory';
import { MentorshipMessaging } from './MentorshipMessaging';
import { useAuth } from '@/hooks/useAuth';
import { useMentorship } from '@/hooks/useMentorship';
import clsx from 'clsx';

export function MentorshipHub() {
  const { user } = useAuth();
  const userId = user?.id;
  const { 
    mentor, 
    sessions, 
    goals, 
    isLoading, 
    refetchAll 
  } = useMentorship(userId);

  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'goals' | 'chat'>('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-och-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-och-steel animate-pulse font-black uppercase tracking-widest text-[10px]">Syncing MMM Telemetry...</p>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. MENTORSHIP TELEMETRY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {[
           {
             label: 'Mentor Match',
             value: mentor?.name || 'Pairing...',
             sub: mentor?.cohort_name ? `${mentor.cohort_name}${mentor.mentor_role ? ` (${mentor.mentor_role})` : ''}` : (mentor?.track || 'Awaiting Director'),
             icon: Users,
             color: 'text-och-gold'
           },
           { 
             label: 'Next Session', 
             value: upcomingSessions.length > 0 ? new Date(upcomingSessions[0].start_time).toLocaleDateString() : 'None Scheduled', 
             sub: upcomingSessions.length > 0 ? new Date(upcomingSessions[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Request a meeting', 
             icon: Calendar, 
             color: 'text-och-mint' 
           },
           { 
             label: 'Goals Progress', 
             value: `${goals.filter(g => g.status === 'verified').length}/${goals.length}`, 
             sub: 'Milestones Achieved', 
             icon: Target, 
             color: 'text-och-defender' 
           },
         ].map((stat, i) => (
           <div key={i} className="p-4 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-4 hover:border-white/10 transition-all group">
              <div className={clsx("p-2.5 rounded-xl bg-current/10 transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                <h4 className="text-lg font-black text-white leading-none">{stat.value}</h4>
                <p className="text-[10px] text-slate-400 mt-1 italic">{stat.sub}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 2. NAVIGATION SIDEBAR (MMM STACK) */}
        <aside className="xl:col-span-3 space-y-4">
          <div className="flex flex-col gap-2">
            {[
              { id: 'overview', label: 'Mentorship Overview', icon: History },
              { id: 'sessions', label: 'Scheduling & Calendar', icon: CalendarDays },
              { id: 'goals', label: 'Goals & Milestones', icon: Target },
              { id: 'chat', label: 'Mentor Messaging', icon: MessageSquare },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] border",
                  activeTab === item.id 
                    ? "bg-och-gold text-black border-och-gold shadow-lg shadow-och-gold/20 scale-[1.02]" 
                    : "bg-white/5 text-och-steel border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* MENTOR PROFILE PREVIEW (If matched) */}
          {mentor && <MentorProfileCard mentor={mentor} />}
        </aside>

        {/* 3. MAIN MMM CONSOLE */}
        <main className="xl:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-[500px]"
            >
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Engagement History</h2>
                    <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-och-steel/20">
                      Export Transcript
                    </Button>
                  </div>
                  <SessionHistory sessions={sessions} />
                </div>
              )}
              
              {activeTab === 'sessions' && (
                <SchedulingHub sessions={sessions} />
              )}
              
              {activeTab === 'goals' && (
                <GoalsTracker 
                  goals={goals} 
                  onGoalCreated={() => {
                    refetchAll();
                  }}
                />
              )}
              
              {activeTab === 'chat' && (
                <MentorshipMessaging />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}


