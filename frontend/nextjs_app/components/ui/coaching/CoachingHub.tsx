/**
 * Coaching Hub Component
 * Main dashboard for Coaching OS - single pane of glass
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { HabitTracker } from './HabitTracker'
import { GoalsDashboard } from './GoalsDashboard'
import { ReflectionModal } from './ReflectionModal'
import { AICoachChat } from './AICoachChat'
import { RadialAlignment } from './RadialAlignment'
import { CoachingMetrics } from './CoachingMetrics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useCoachingStore } from '@/lib/coaching/store'

export function CoachingHub() {
  const { metrics } = useCoachingStore()
  const [reflectionModalOpen, setReflectionModalOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-8 lg:ml-80">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Coaching OS
        </h1>
        <div className="max-w-2xl mx-auto">
          <RadialAlignment score={metrics.alignmentScore} size="lg" className="mx-auto mb-4" />
          <p className="text-xl text-slate-300">
            {metrics.alignmentScore}% aligned with your Future-You
          </p>
        </div>
      </motion.div>
      
      {/* Metrics Cards */}
      <CoachingMetrics />
      
      {/* 3-Column Grid - Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* HABITS CARD */}
        <HabitTracker />
        
        {/* GOALS CARD */}
        <GoalsDashboard />
        
        {/* REFLECTIONS CARD */}
        <Card className="lg:col-span-1 col-span-full h-[420px] overflow-hidden glass-card">
          <div className="p-6 border-b border-slate-800/50">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Reflections
            </h3>
          </div>
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <p className="text-slate-400 text-sm">
                Daily reflection helps you track growth and identify patterns.
              </p>
              <Button
                variant="defender"
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                onClick={() => setReflectionModalOpen(true)}
              >
                Reflect Now
              </Button>
              {metrics.lastReflectionDate && (
                <p className="text-xs text-slate-500 mt-4">
                  Last reflection: {new Date(metrics.lastReflectionDate).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          </div>
        </Card>
      </div>
      
      {/* AI COACH CHAT */}
      <AICoachChat />
      
      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={reflectionModalOpen}
        onClose={() => setReflectionModalOpen(false)}
      />
    </div>
  )
}

