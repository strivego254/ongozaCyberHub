/**
 * Profiler Summary Component - Refactored
 * Displays the "North Star" - Future-You persona and archetypes
 */
'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { Sparkles, Target, Zap } from 'lucide-react';

interface ProfilerSummaryProps {
  persona?: {
    name: string;
    archetype: string;
    track: string;
    level: string;
  };
  isComplete: boolean;
}

export function ProfilerSummary({ persona, isComplete }: ProfilerSummaryProps) {
  if (!isComplete) {
    return (
      <Card className="border-och-orange/50 bg-och-orange/5">
        <div className="p-6 text-center">
          <Target className="w-12 h-12 text-och-orange mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Establish Your North Star</h3>
          <p className="text-och-steel mb-4 max-w-lg mx-auto">
            You haven't completed your Tier 0 Profiler yet. Start your journey by defining your Future-You persona.
          </p>
          <button className="px-6 py-2 bg-och-orange text-white rounded-lg font-semibold hover:bg-och-orange/80 transition-colors">
            Start Profiler Series
          </button>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-och-defender/30 bg-gradient-to-br from-och-defender/10 via-transparent to-och-mint/5 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-och-defender/20 flex items-center justify-center border-2 border-och-defender/50">
                <Sparkles className="w-8 h-8 text-och-defender" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {persona?.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="defender" className="text-xs uppercase tracking-wider font-bold">
                    {persona?.archetype}
                  </Badge>
                  <span className="text-och-steel text-sm">•</span>
                  <span className="text-och-steel text-sm font-medium uppercase tracking-widest">
                    {persona?.track} Track
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 pr-4">
              <div className="text-center">
                <p className="text-[10px] text-och-steel uppercase tracking-widest mb-1">Current Tier</p>
                <p className="text-xl font-bold text-och-mint uppercase tracking-wider">{persona?.level}</p>
              </div>
              <div className="h-10 w-px bg-och-steel/20" />
              <div className="text-center">
                <p className="text-[10px] text-och-steel uppercase tracking-widest mb-1">Blueprint</p>
                <div className="flex items-center gap-1.5 text-white font-bold cursor-pointer hover:text-och-defender transition-colors">
                  <span>View</span>
                  <Zap className="w-3 h-3 text-och-gold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
