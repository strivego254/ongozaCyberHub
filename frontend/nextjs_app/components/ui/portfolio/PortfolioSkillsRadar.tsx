/**
 * Portfolio Skills Radar Component
 * Interactive radar chart visualization of skill mastery
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillData {
  name: string;
  score: number;
}

interface PortfolioSkillsRadarProps {
  skills: Array<{ skill: string; score: number; count: number }>;
}

export function PortfolioSkillsRadar({ skills }: PortfolioSkillsRadarProps) {
  // Transform skills data for radar chart
  const radarData = skills
    .slice(0, 8) // Top 8 skills for readability
    .map((skill) => ({
      name: skill.skill.length > 12 ? skill.skill.substring(0, 12) + '...' : skill.skill,
      fullName: skill.skill,
      score: Math.min(100, skill.score), // Cap at 100
      count: skill.count,
    }));

  // If no skills, show empty state
  if (radarData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/40">
        <div className="p-8 text-center">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg text-slate-300 mb-2">Skills Mastery</h3>
          <p className="text-sm text-slate-500">Complete portfolio items to build your skills profile</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/40 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-indigo-400" />
          <h3 className="font-bold text-xl text-slate-100">Skills Mastery</h3>
        </div>

        <div className="relative h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="#374151" strokeWidth={1} />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 500 }}
                tickLine={{ stroke: '#4B5563' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#6B7280', fontSize: 10 }}
                tickCount={6}
              />
              <Radar
                name="Mastery"
                dataKey="score"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-2 justify-center pt-4 border-t border-slate-800/50">
            {radarData.slice(0, 6).map((skill) => (
              <div
                key={skill.fullName}
                className="flex items-center gap-1.5 text-xs bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800/50"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-slate-300 font-medium">{skill.fullName}</span>
                <span className="font-mono text-indigo-400">{Math.round(skill.score)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-400">{skills.length}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Total Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length) || 0}%
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Mastery</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {skills.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Items</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

