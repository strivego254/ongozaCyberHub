/**
 * Student Curriculum Page - Redesigned v2
 * The "GPS" for navigating the OCH learning journey
 */

'use client';

import { useState } from 'react';
import { RouteGuard } from '@/components/auth/RouteGuard';
import { CurriculumHierarchy } from './components/CurriculumHierarchy';
import { AICoachWidget } from './components/AICoachWidget';
import { TalentScopePreview } from './components/TalentScopePreview';
import { motion } from 'framer-motion';
import { Map as MapIcon, BookOpen, Sparkles, LayoutGrid, Brain, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

// Mock Data
const MOCK_PERSONA = {
  name: "Cyber Guardian",
  archetype: "Defender",
  track: "Security Operations",
  level: "Tier 2",
};

const MOCK_MODULES = [
  {
    id: 'm1',
    title: 'OCH Ecosystem Alignment',
    description: 'Orientation and mindset alignment for cybersecurity professionals.',
    tier: 1,
    progress: 100,
    isLocked: false,
    hasMission: true,
    lessons: [
      { id: 'l1', title: 'The OCH Philosophy', duration: '5:20', isCompleted: true, isLocked: false, type: 'video' },
      { id: 'l2', title: 'Your Future-You Blueprint', duration: '12:45', isCompleted: true, isLocked: false, type: 'video' },
    ]
  },
  {
    id: 'm2',
    title: 'Foundational Defense workflow',
    description: 'Core concepts and early-stage "soft" missions.',
    tier: 2,
    progress: 45,
    isLocked: false,
    hasMission: true,
    lessons: [
      { id: 'l3', title: 'Introduction to SIEM', duration: '15:00', isCompleted: true, isLocked: false, type: 'video' },
      { id: 'l4', title: 'Log Analysis Basics', duration: '22:10', isCompleted: false, isLocked: false, type: 'video' },
      { id: 'l5', title: 'Network Traffic Analysis', duration: '18:30', isCompleted: false, isLocked: true, type: 'video' },
    ]
  },
  {
    id: 'm3',
    title: 'Applied Threat Hunting',
    description: 'Applied capabilities and complex workflow.',
    tier: 3,
    progress: 0,
    isLocked: true,
    hasMission: true,
    lessons: []
  }
];

export default function CurriculumPage() {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  return (
    <RouteGuard>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapIcon className="w-5 h-5 text-och-defender" />
              <span className="text-och-steel font-bold text-xs uppercase tracking-widest">Your Journey GPS</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              Curriculum <span className="text-och-defender">Navigator</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-och-midnight border border-och-steel/20 text-och-steel hover:text-white transition-all">
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-bold">Catalog</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-white">
                <BookOpen className="w-5 h-5 text-och-mint" />
                <h2 className="text-xl font-bold uppercase tracking-wider italic">Active Learning Path</h2>
              </div>
              <Badge variant="mint" className="animate-pulse">Live: Log Analysis</Badge>
            </div>

            <CurriculumHierarchy 
              currentTier={2} 
              modules={MOCK_MODULES} 
              onSelectLesson={(id) => setActiveLessonId(id)}
            />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-r from-och-gold/10 via-transparent to-transparent border border-och-gold/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-24 h-24 text-och-gold" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-2 text-och-gold">
                    <Zap className="w-4 h-4 text-och-gold" />
                    <span className="font-black text-xs uppercase tracking-widest">Recipe Engine</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Feeling stuck on a mission?</h3>
                  <p className="text-och-steel text-sm leading-relaxed">
                    Bridge technical gaps with micro-skill boosters. Focused, step-by-step guides contextually available for your current track tasks.
                  </p>
                </div>
                <button className="px-6 py-2.5 bg-och-gold text-och-midnight font-black uppercase text-xs rounded-xl hover:bg-white transition-all">
                  Browse Recipes
                </button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <div className="flex items-center gap-3 text-white mb-4 pl-1">
              <Brain className="w-5 h-5 text-och-defender" />
              <h2 className="text-xl font-bold uppercase tracking-wider italic">Coaching OS</h2>
            </div>
            <AICoachWidget alignmentScore={82} />

            <div className="flex items-center gap-3 text-white mb-4 pl-1 pt-4">
              <TrendingUp className="w-5 h-5 text-och-mint" />
              <h2 className="text-xl font-bold uppercase tracking-wider italic">TalentScope</h2>
            </div>
            <TalentScopePreview 
              readinessScore={68} 
              topGaps={['Network Forensics', 'SIEM Config', 'Python Automation']}
            />
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
