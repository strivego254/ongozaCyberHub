/**
 * Coaching Control Panel Component
 * AI Coach and habit preferences
 */

'use client';

import { Brain, Target, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { UserSettings, SettingsUpdate } from '@/lib/settings/types';

interface CoachingControlPanelProps {
  settings: UserSettings | null;
  onUpdate: (updates: SettingsUpdate) => void;
}

export function CoachingControlPanel({ settings, onUpdate }: CoachingControlPanelProps) {
  if (!settings) return null;

  const coachStyles = [
    {
      value: 'motivational' as const,
      label: 'Motivational',
      description: 'Encouraging and supportive',
    },
    {
      value: 'direct' as const,
      label: 'Direct',
      description: 'Straightforward and actionable',
    },
    {
      value: 'analytical' as const,
      label: 'Analytical',
      description: 'Data-driven and detailed',
    },
  ];

  return (
    <Card className="glass-card glass-card-hover">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Coaching Preferences</h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize your AI Coach style and reflection preferences
            </p>
          </div>
        </div>

        {/* AI Coach Style */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block">AI Coach Style</label>
          <div className="space-y-2">
            {coachStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => onUpdate({ aiCoachStyle: style.value })}
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  settings.aiCoachStyle === style.value
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-200">{style.label}</div>
                <div className="text-xs text-slate-500">{style.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Habit Frequency */}
        <div className="mb-6">
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <Target className="w-5 h-5" />
            Habit Frequency
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({ habitFrequency: 'daily' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                settings.habitFrequency === 'daily'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Daily</div>
            </button>
            <button
              onClick={() => onUpdate({ habitFrequency: 'weekly' })}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                settings.habitFrequency === 'weekly'
                  ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold">Weekly</div>
            </button>
          </div>
        </div>

        {/* Reflection Prompt Style */}
        <div>
          <label className="font-bold text-slate-100 mb-3 block flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Reflection Style
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'guided' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'guided'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Guided</div>
              <div className="text-xs text-slate-500">Structured prompts and questions</div>
            </button>
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'freeform' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'freeform'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Freeform</div>
              <div className="text-xs text-slate-500">Open-ended journaling</div>
            </button>
            <button
              onClick={() => onUpdate({ reflectionPromptStyle: 'structured' })}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                settings.reflectionPromptStyle === 'structured'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-slate-200">Structured</div>
              <div className="text-xs text-slate-500">Template-based reflections</div>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

