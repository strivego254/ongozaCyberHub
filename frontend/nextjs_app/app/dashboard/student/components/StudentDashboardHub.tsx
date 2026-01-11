/**
 * Redesigned Student Dashboard Hub
 * The "Mission Control" for OCH students.
 * Guiding from curiosity to employability with high-tech cockpit visuals.
 */

'use client';

import { useState } from 'react';
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
  LayoutGrid,
  List,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Flame,
  LineChart,
  MapPin,
  Globe,
  ArrowUpRight,
  Command,
  Store
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardStore } from '../lib/store/dashboardStore';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { CoachingNudge } from '@/components/coaching/CoachingNudge';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export function StudentDashboardHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { readiness, cohortProgress, trackOverview } = useDashboardStore();
  const { settings } = useSettingsMaster(user?.id);
  
  const [activeFeed, setActiveFeed] = useState<'local' | 'global'>('local');

  // Real data from API
  const readinessScore = readiness?.score || 0;
  const healthScore = readiness?.health_score || 0;
  const persona = readiness?.persona || user?.persona || "Not Set";

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* 1. MISSION CONTROL HEADER (Cockpit Telemetry) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-gradient-to-br from-och-midnight via-och-midnight to-och-defender/5 p-6 rounded-2xl border border-och-steel/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-och-gold/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-och-gold/10 transition-all duration-1000" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
             <div className="absolute inset-0 bg-och-gold/5 animate-pulse" />
             <Compass className="w-8 h-8 text-och-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">Mission Control</h1>
              <Badge variant="gold" className="text-[9px] font-black tracking-[0.2em] px-1.5 h-4">ACTIVE</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-och-steel text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-och-mint animate-ping" />
                Welcome Back, {user?.first_name || 'Cyber Builder'}
              </p>
              <div className="h-3 w-px bg-och-steel/20 hidden sm:block" />
              <p className="text-och-gold text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Persona: {persona}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto relative z-10">
          {[
            { label: 'Readiness Score', value: readinessScore, icon: TrendingUp, color: 'text-och-mint', trend: '+14' },
            { label: 'Platform Health', value: `${healthScore}%`, icon: Shield, color: 'text-och-defender' },
            { label: 'Daily Streak', value: '12d', icon: Flame, color: 'text-och-gold' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 min-w-[140px] xl:min-w-[150px] p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
               <div className={clsx("p-1.5 rounded-lg bg-current/10 mb-1.5 transition-transform group-hover:scale-110", stat.color)}>
                 <stat.icon className="w-3.5 h-3.5" />
               </div>
               <p className="text-[8px] text-och-steel font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-xl font-black text-white">{stat.value}</span>
                 {stat.trend && <span className="text-[8px] text-och-mint font-bold">{stat.trend}</span>}
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 2. NAVIGATION & ACTION PROMPTS (Left Column) */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* WHAT TO DO NEXT (Dynamic Prompt) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-och-gold/20 to-transparent border border-och-gold/20 relative overflow-hidden">
             <div className="flex items-center gap-2 mb-3">
               <Zap className="w-3.5 h-3.5 text-och-gold" />
               <span className="text-[9px] font-black text-white uppercase tracking-widest">Action Prompt</span>
             </div>
             <h3 className="text-sm font-black text-white leading-tight uppercase tracking-tight mb-3 italic">
               "Deploy to Module 3: Network Defense. Your mentor left a priority note."
             </h3>
             <Button 
               variant="defender" 
               className="w-full h-10 rounded-xl bg-och-gold text-black hover:bg-white transition-all font-black uppercase tracking-widest text-[9px]"
               onClick={() => router.push('/dashboard/student/curriculum')}
             >
               Start Next Step
               <ChevronRight className="w-3.5 h-3.5 ml-1" />
             </Button>
          </div>

          {/* QUICK LINKS SIDEBAR */}
          <nav className="space-y-1.5">
            {[
              { label: 'Curriculum GPS', icon: Compass, href: '/dashboard/student/curriculum' },
              { label: 'Mission Hub', icon: Target, href: '/dashboard/student/missions' },
              { label: 'Coaching OS', icon: MessageSquare, href: '/dashboard/student/coaching' },
              { label: 'Professional Portfolio', icon: Briefcase, href: '/dashboard/student/portfolio' },
              { label: 'Mentorship Hub', icon: Users, href: '/dashboard/student/mentorship' },
              { label: 'Marketplace', icon: Store, href: '/dashboard/student/marketplace' },
            ].map((link, i) => (
              <button
                key={i}
                onClick={() => router.push(link.href)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-och-steel/5 border border-white/5 text-och-steel hover:text-white hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <link.icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{link.label}</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </nav>

          {/* IDENTITY STATUS */}
          <div className="p-5 rounded-2xl bg-och-midnight border border-och-steel/10">
             <div className="flex items-center gap-2 mb-3">
               <Globe className="w-3 h-3 text-och-mint" />
               <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">Global Identity</span>
             </div>
             <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/5 border border-white/5 mb-3">
                <div className="w-7 h-7 rounded-full bg-och-gold/20 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-och-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] text-och-steel font-black uppercase tracking-tighter mb-0.5">och.africa/student/</p>
                  <p className="text-[10px] text-white font-bold truncate">@{user?.email?.split('@')[0] || 'handle'}</p>
                </div>
             </div>
             <p className="text-[9px] text-slate-400 leading-relaxed italic">
               "Your portfolio is currently in Anonymous Mode. Reach Readiness 750 to unlock Talent Visibility."
             </p>
          </div>
        </aside>

        {/* 3. CENTER OPS (Coaching & Missions) */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* HABITS ENGINE (Quick Log) */}
          <Card className="p-6 rounded-2xl bg-och-midnight/50 border border-och-steel/10 backdrop-blur-md">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Habits Engine</h2>
                   <p className="text-och-steel text-[9px] font-black uppercase tracking-widest mt-0.5">Daily Log: Learn • Practice • Reflect</p>
                </div>
                <Badge variant="mint" className="h-5 px-2.5 text-[9px] font-black tracking-widest">12 DAY STREAK</Badge>
             </div>
             
             <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Learn', icon: Clock, color: 'text-och-gold' },
                  { label: 'Practice', icon: Target, color: 'text-och-defender' },
                  { label: 'Reflect', icon: MessageSquare, color: 'text-och-mint' },
                ].map((habit, i) => (
                  <button key={i} className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all flex flex-col items-center justify-center text-center gap-2">
                     <div className={clsx("p-2.5 rounded-xl bg-current/10 group-hover:scale-110 transition-transform", habit.color)}>
                        <habit.icon className="w-5 h-5" />
                     </div>
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">{habit.label}</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-och-steel/20 group-active:bg-och-mint transition-colors" />
                  </button>
                ))}
             </div>

             <div className="p-4 rounded-xl bg-gradient-to-r from-och-mint/10 to-transparent border border-och-mint/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-center sm:text-left">
                   <div className="w-8 h-8 rounded-full bg-och-mint/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-och-mint" />
                   </div>
                   <div>
                     <p className="text-[9px] text-och-mint font-black uppercase tracking-widest mb-0.5">Daily Reflection Prompt</p>
                     <p className="text-[10px] text-white font-bold italic">"How did today's lab session shift your perspective on Threat Intelligence?"</p>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg border-och-mint/30 text-och-mint hover:bg-och-mint hover:text-black font-black uppercase tracking-widest text-[8px]">
                   Open Reflection OS
                </Button>
             </div>
          </Card>

          {/* ACTIVE MISSION (Current Ops) */}
          <div className="space-y-3">
             <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                   <Target className="w-4 h-4 text-och-defender" />
                   <span className="text-xs font-black text-white uppercase tracking-tighter">Current Operations</span>
                </div>
                <button className="text-[9px] font-black text-och-gold uppercase tracking-widest hover:underline" onClick={() => router.push('/dashboard/student/missions')}>
                   View All Missions
                </button>
             </div>
             
             <div className="p-6 rounded-2xl bg-gradient-to-br from-och-defender/20 via-och-midnight to-och-midnight border border-och-defender/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-och-defender/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 relative z-10">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <Badge variant="defender" className="text-[8px] font-black px-1.5 uppercase h-4">TIER 3: INTERMEDIATE</Badge>
                         <span className="text-[9px] text-och-steel font-black uppercase tracking-widest">• 2h Estimated</span>
                      </div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Ransomware Triage: Apex Protocol</h3>
                      <p className="text-[10px] text-slate-400 max-w-md italic leading-relaxed">
                        "Initial telemetry suggests a localized encryption event on the R&D segment. You are tasked with primary containment."
                      </p>
                   </div>
                   <div className="flex flex-col items-center gap-1.5">
                      <div className="w-16 h-16 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                         <div className="absolute inset-0 border-2 border-och-defender rounded-full border-t-transparent animate-spin-slow" />
                         <span className="text-lg font-black text-white">42%</span>
                      </div>
                      <span className="text-[8px] text-och-steel font-black uppercase tracking-widest">Progress</span>
                   </div>
                </div>

                <div className="flex items-center gap-3 mt-8 relative z-10">
                   <Button 
                    variant="defender" 
                    className="flex-1 h-10 rounded-xl bg-och-defender text-black hover:bg-white transition-all font-black uppercase tracking-widest text-[9px] shadow-lg shadow-och-defender/20"
                    onClick={() => router.push('/dashboard/student/missions')}
                   >
                     Resume Mission
                     <Zap className="w-3.5 h-3.5 ml-1.5 fill-current" />
                   </Button>
                   <Button 
                    variant="outline" 
                    className="h-10 px-6 rounded-xl border-och-steel/20 text-och-steel hover:text-white transition-all font-black uppercase tracking-widest text-[9px]"
                   >
                     Evidence (3)
                   </Button>
                </div>
             </div>
          </div>
        </main>

        {/* 4. ANALYTICS & COMMUNITY (Right Column) */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* TALENTSCOPE RADAR (Mini) */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                   <LineChart className="w-3.5 h-3.5 text-och-mint" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">TalentScope Radar</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-och-steel" />
             </div>
             
             <div className="aspect-square w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center mb-4 relative">
                <div className="absolute inset-3 rounded-full border border-white/5" />
                <div className="absolute inset-10 rounded-full border border-white/5" />
                <div className="absolute inset-16 rounded-full border border-white/5" />
                <div className="w-full h-full p-3 flex items-center justify-center">
                   {/* Placeholder for Skills Radar */}
                   <div className="w-full h-full bg-och-mint/10 rounded-full animate-pulse flex items-center justify-center">
                      <p className="text-[7px] text-och-mint font-black uppercase tracking-[0.3em]">TELEMETRY ACTIVE</p>
                   </div>
                </div>
             </div>

             <div className="space-y-2.5">
                {[
                  { label: 'Technical Dept', val: 74, color: 'bg-och-gold' },
                  { label: 'Behavorial Readiness', val: 88, color: 'bg-och-mint' },
                  { label: 'Identity Alignment', val: 92, color: 'bg-och-defender' },
                ].map((m, i) => (
                  <div key={i} className="space-y-1">
                     <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className="text-och-steel">{m.label}</span>
                        <span className="text-white">{m.val}%</span>
                     </div>
                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={clsx("h-full rounded-full", m.color)} style={{ width: `${m.val}%` }} />
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* COMMUNITY FEED (Tabs) */}
          <div className="p-5 rounded-2xl bg-och-midnight border border-och-steel/10 space-y-4">
             <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                <button 
                  onClick={() => setActiveFeed('local')}
                  className={clsx(
                    "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                    activeFeed === 'local' ? "bg-och-gold text-black" : "text-och-steel hover:text-white"
                  )}
                >
                  Local Feed
                </button>
                <button 
                  onClick={() => setActiveFeed('global')}
                  className={clsx(
                    "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                    activeFeed === 'global' ? "bg-och-gold text-black" : "text-och-steel hover:text-white"
                  )}
                >
                  Global Feed
                </button>
             </div>

             <div className="space-y-3">
                {[
                  { user: 'Sarah K.', action: 'Achieved "First Blood" in module 2', time: '12m ago', icon: Zap },
                  { user: 'Uni of Nairobi', action: 'New mentorship session open for GRC track', time: '1h ago', icon: Users },
                  { user: 'Michael O.', action: 'Verified 5 items in Portfolio', time: '3h ago', icon: CheckCircle2 },
                ].map((post, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
                     <div className="w-8 h-8 rounded-lg bg-och-midnight border border-och-steel/10 flex items-center justify-center shrink-0">
                        <post.icon className="w-4 h-4 text-och-gold" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[9px] text-white font-black uppercase tracking-tight mb-0.5">{post.user}</p>
                        <p className="text-[9px] text-slate-400 italic leading-tight mb-1.5 truncate">"{post.action}"</p>
                        <span className="text-[7px] text-och-steel font-black uppercase tracking-widest">{post.time}</span>
                     </div>
                  </div>
                ))}
             </div>

             <Button 
               variant="outline" 
               className="w-full h-8 rounded-lg border-och-steel/20 text-och-steel hover:text-white font-black uppercase tracking-widest text-[8px]"
               onClick={() => router.push('/dashboard/student/community')}
             >
                Open Community Hub
             </Button>
          </div>
        </aside>
      </div>

      {/* 5. MOBILE FLOATING NOTIFICATION (Top-right "Bell") */}
      <button className="fixed top-6 right-6 z-50 w-10 h-10 rounded-xl bg-och-gold text-black flex items-center justify-center shadow-lg shadow-och-gold/20 hover:scale-110 transition-transform sm:hidden">
         <div className="relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-och-defender rounded-full border-2 border-och-gold" />
         </div>
      </button>

      {/* 6. AI COACHING NUDGE (Coaching OS Integration) */}
      <CoachingNudge userId={user?.id?.toString()} autoLoad={true} />

    </div>
  );
}


