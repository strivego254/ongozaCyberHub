/**
 * Redesigned Portfolio Dashboard
 * Immersive "Portfolio Engine" and "Proof of Transformation" Hub
 * Follows the OCH dark theme and strictly implements the user story lifecycle.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Filter, 
  Eye, 
  Settings, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  Award, 
  FileCode, 
  Zap, 
  LayoutGrid, 
  List, 
  Search,
  ExternalLink,
  Globe,
  User,
  ArrowUpRight,
  BarChart3,
  Flame,
  Clock,
  EyeOff,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { PortfolioItemCard } from './PortfolioItemCard';
import { PortfolioItemForm } from './PortfolioItemForm';
import { PortfolioHealthCard } from './PortfolioHealthCard';
import { PortfolioSkillsRadar } from './PortfolioSkillsRadar';
import { PortfolioTimeline } from './PortfolioTimeline';
import { PortfolioDashboardSkeleton } from './PortfolioSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { usePortfolioTimeline } from '@/hooks/usePortfolioTimeline';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItem } from '@/hooks/usePortfolio';
import clsx from 'clsx';

// Local type definitions to match user story
type PortfolioItemStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'published';
type PortfolioItemType = 'mission' | 'reflection' | 'certification' | 'github' | 'lab_report' | 'research';

export function PortfolioDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;
  
  const {
    items = [],
    healthMetrics,
    topSkills = [],
    pendingReviews = [],
    approvedItems = [],
    isLoading,
    error,
    refetch,
  } = usePortfolio(userId);

  const { settings, entitlements } = useSettingsMaster(userId);
  const { timelineData } = usePortfolioTimeline({ items, isLoading });
  
  // Entitlement checks (Starter 3 vs Professional 7)
  const isProfessional = entitlements?.tier === 'professional';
  const isStarterEnhanced = entitlements?.tier === 'starter' && entitlements?.enhancedAccessUntil && new Date(entitlements.enhancedAccessUntil) > new Date();
  const canRequestReview = isProfessional && entitlements?.mentorAccess === true;
  const maxItemsView = isProfessional ? Infinity : (isStarterEnhanced ? Infinity : 5);

  // TalentScope Metrics
  const healthScore = healthMetrics?.healthScore ? Math.round(healthMetrics.healthScore * 10) : 0;
  const readinessScore = 742; // TODO: Implement TalentScope API

  const [statusFilter, setStatusFilter] = useState<PortfolioItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PortfolioItemType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Check for 'new=true' in URL
  useEffect(() => {
    if (searchParams?.get('new') === 'true') {
      setIsFormOpen(true);
      // Clean up URL without reload
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [searchParams]);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading && items.length === 0 && !error) {
    return <PortfolioDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-och-midnight text-slate-200">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        
        {/* 1. PORTFOLIO ENGINE HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-och-gold/5 animate-pulse group-hover:bg-och-gold/10 transition-colors" />
              <Briefcase className="w-8 h-8 text-och-gold relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Portfolio Engine</h1>
                <Badge variant={isProfessional ? "gold" : "steel"} className="text-[10px] font-black tracking-widest px-2 py-0.5">
                  {isProfessional ? "PROFESSIONAL TIER" : "STARTER TIER"}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-och-mint" />
                  Verified Outcomes Repository
                </p>
                <div className="h-4 w-px bg-och-steel/20" />
                <p className="text-och-steel text-xs font-black uppercase tracking-[0.2em]">
                  {items.length} Registered Items
                </p>
              </div>
            </div>
          </div>

          {/* TALENTSCOPE TELEMETRY BAR */}
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            {[
              { label: 'Readiness Score', value: readinessScore, trend: '+14', icon: TrendingUp, color: 'text-och-mint' },
              { label: 'Portfolio Health', value: `${healthScore}%`, icon: Shield, color: 'text-och-defender' },
              { label: 'Verified Evidence', value: approvedItems.length, icon: CheckCircle, color: 'text-och-gold' },
            ].map((stat, i) => (
              <div key={i} className="flex-1 min-w-[200px] xl:min-w-[240px] px-6 py-4 rounded-2xl bg-och-steel/5 border border-och-steel/10 flex items-center gap-4 hover:border-och-steel/20 transition-all group">
                <div className={clsx("p-2.5 rounded-xl bg-current/10 transition-transform group-hover:scale-110", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-och-steel font-black uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white leading-none">{stat.value}</span>
                    {stat.trend && (
                      <span className="text-[10px] text-och-mint font-bold flex items-center gap-0.5">
                        <ArrowUpRight className="w-2 h-2" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 2. ANALYTICS & IDENTITY SIDEBAR */}
          <aside className="lg:col-span-3 space-y-8 sticky top-24">
            {/* PUBLIC IDENTITY CARD */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-och-gold/20 to-transparent border border-och-gold/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                <Globe className="w-32 h-32 text-och-gold" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="gold" className="text-[8px] px-2 py-0.5 font-black tracking-widest uppercase">Public Identity</Badge>
                  <div className="flex-1 h-px bg-och-gold/20" />
                </div>
                <h4 className="text-sm font-black text-white mb-2 uppercase tracking-tight">Public Profile</h4>
                <div className="p-3 rounded-xl bg-och-midnight/80 border border-och-steel/10 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-och-gold/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-och-gold" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white font-bold truncate">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.first_name || user?.name || 'Student'}
                      </p>
                      <p className="text-[10px] text-och-steel font-medium truncate mt-0.5">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-6 italic">
                  "{settings?.bio || 'No custom bio established. Curate your professional identity to showcase your best work.'}"
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-[10px] font-black uppercase tracking-widest border-och-gold/30 text-och-gold hover:bg-och-gold hover:text-black transition-all"
                  onClick={() => router.push('/dashboard/student/settings?tab=profile')}
                >
                  Configure Identity
                  <Settings className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>

            {/* TALENTSCOPE HEALTH RADAR */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-2">
                 <BarChart3 className="w-4 h-4 text-och-mint" />
                 <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">TalentScope Radar</span>
               </div>
               <PortfolioSkillsRadar skills={topSkills} />
            </div>

            {/* RECENT REPOSITORY ACTIVITY */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-2">
                 <Clock className="w-4 h-4 text-och-defender" />
                 <span className="text-[10px] font-black text-och-steel uppercase tracking-widest">Repository Activity</span>
               </div>
               <PortfolioTimeline data={timelineData} />
            </div>
          </aside>

          {/* 3. REPOSITORY TERMINAL */}
          <main className="lg:col-span-9 space-y-8">
            
            {/* TERMINAL BAR (Filters & Search) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-och-midnight/50 p-4 rounded-3xl border border-och-steel/10 backdrop-blur-md shadow-2xl">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-och-steel" />
                <input 
                  type="text" 
                  placeholder="SEARCH REPOSITORY, TAGS, OR EVIDENCE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-och-midnight/80 border border-och-steel/20 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-och-steel/50 focus:border-och-gold/50 outline-none transition-all shadow-inner uppercase tracking-wider"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PortfolioItemStatus | 'all')}
                  className="bg-och-midnight/80 border border-och-steel/20 rounded-2xl py-2.5 px-4 text-[10px] font-black text-white uppercase tracking-widest focus:border-och-gold/50 outline-none transition-all cursor-pointer shadow-inner"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="draft">DRAFT</option>
                  <option value="submitted">SUBMITTED</option>
                  <option value="in_review">MENTOR REVIEW</option>
                  <option value="approved">APPROVED</option>
                  <option value="published">PUBLISHED</option>
                </select>
                
                <div className="flex bg-och-midnight/80 rounded-2xl border border-och-steel/20 p-1 shadow-inner">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all", 
                      viewMode === 'grid' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all", 
                      viewMode === 'list' ? "bg-och-steel/20 text-white shadow-lg" : "text-och-steel hover:text-white"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* PEER PORTFOLIOS */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard/student/portfolio/cohort')}
                    className="h-[46px] px-6 rounded-2xl border-och-steel/20 text-och-steel hover:border-white transition-all font-black uppercase tracking-widest text-[10px]"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Peer Portfolios
                  </Button>
                </div>

                <Button 
                  variant="defender" 
                  onClick={() => setIsFormOpen(true)}
                  className="h-[46px] px-6 rounded-2xl bg-och-gold text-black hover:bg-white transition-all shadow-lg shadow-och-gold/20 font-black uppercase tracking-widest text-[10px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Outcome
                </Button>
              </div>
            </div>

            {/* STATUS LIFECYCLE INDICATOR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Drafts', status: 'draft' as PortfolioItemStatus, count: items.filter(i => i.status === 'draft').length, color: 'text-och-steel' },
                 { label: 'Submitted', status: 'submitted' as PortfolioItemStatus, count: items.filter(i => i.status === 'submitted').length, color: 'text-och-defender' },
                 { label: 'In Review', status: 'in_review' as PortfolioItemStatus, count: pendingReviews.length, color: 'text-och-gold' },
                 { label: 'Approved', status: 'approved' as PortfolioItemStatus, count: approvedItems.length, color: 'text-och-mint' },
               ].map((phase, i) => (
                 <button
                   key={i}
                   onClick={() => setStatusFilter(phase.status)}
                   className={clsx(
                     "p-4 rounded-2xl bg-white/5 border flex items-center justify-between group hover:border-white/20 transition-all cursor-pointer",
                     statusFilter === phase.status ? "border-och-gold/50 bg-och-gold/10" : "border-och-steel/10"
                   )}
                 >
                    <span className="text-[9px] font-black text-och-steel uppercase tracking-widest">{phase.label}</span>
                    <span className={clsx("text-lg font-black", phase.color)}>{phase.count}</span>
                 </button>
               ))}
            </div>

            {/* REPOSITORY GRID */}
            {filteredItems.length > 0 ? (
              <div className={clsx(
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "flex flex-col gap-4"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredItems.slice(0, maxItemsView).map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PortfolioItemCard 
                        item={item} 
                        canRequestReview={canRequestReview}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-och-steel/10 rounded-[3rem]">
                <div className="w-24 h-24 rounded-full bg-och-steel/5 flex items-center justify-center mb-8">
                  <Briefcase className="w-12 h-12 text-och-steel/30" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">No Items Found</h3>
                <p className="text-och-steel text-sm max-w-md italic font-medium mb-6">
                  No portfolio items match your current filters. Try adjusting your search or status filter.
                </p>
                <Button 
                  variant="outline" 
                  className="h-12 px-8 rounded-xl border-och-gold/30 text-och-gold font-black uppercase tracking-widest hover:bg-och-gold hover:text-black transition-all"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-och-steel/10 rounded-[3rem]">
                <div className="w-24 h-24 rounded-full bg-och-steel/5 flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 rounded-full border border-och-steel/10 animate-ping" />
                  <Briefcase className="w-12 h-12 text-och-steel/30" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Repository Empty</h3>
                <p className="text-och-steel text-sm max-w-md italic font-medium mb-6">
                  "Your professional stat sheet is awaiting data. Complete missions or import certifications to build your verified highlight reel."
                </p>
                <Button 
                  variant="outline" 
                  className="h-12 px-8 rounded-xl border-och-gold/30 text-och-gold font-black uppercase tracking-widest hover:bg-och-gold hover:text-black transition-all"
                  onClick={() => setIsFormOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Outcome
                </Button>
              </div>
            )}

            {/* UPGRADE CALLOUT (If applicable) */}
            {filteredItems.length > maxItemsView && !isProfessional && (
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-och-gold/20 to-och-defender/10 border border-och-gold/30 flex flex-col md:flex-row items-center justify-between gap-6">
                 <div>
                   <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Expansion Required</h4>
                   <p className="text-xs text-slate-300 font-medium italic">"Starter tier handles 5 items. Professional tier unlocks unlimited repository depth."</p>
                 </div>
                 <Button 
                   variant="defender" 
                   className="h-12 px-8 rounded-xl bg-och-gold text-black hover:bg-white transition-all font-black uppercase tracking-widest text-[10px]"
                   onClick={() => router.push('/dashboard/student/settings?tab=subscription')}
                 >
                   Upgrade to Professional
                 </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. IMMERSIVE OVERLAYS */}

      <AnimatePresence>
        {isFormOpen && (
          <PortfolioItemForm 
            onClose={() => {
              setIsFormOpen(false)
              // Refetch items after closing form to ensure new items appear
              refetch()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
