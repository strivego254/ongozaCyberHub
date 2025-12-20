/**
 * Enhanced Mission View Component
 * 4-zone layout with story, objectives, subtask view, and recipe sidebar
 */
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Check, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TimerDisplay } from './shared/TimerDisplay'
import { SubtaskViewEnhanced } from './SubtaskViewEnhanced'
import { RecipeSidebarEnhanced } from './RecipeSidebarEnhanced'
import { useMissionProgress } from '../hooks/useMissionProgress'
import { apiGateway } from '@/services/apiGateway'
import { useMissionStore } from '../lib/store/missionStore'
import type { Mission } from '../types'

interface MissionViewEnhancedProps {
  missionId: string
}

export function MissionViewEnhanced({ missionId }: MissionViewEnhancedProps) {
  const { currentMission, setCurrentMission, currentSubtask, setCurrentSubtask } = useMissionStore()
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const { isOffline, lastSaved, saveNow } = useMissionProgress()

  const { data: missionData, isLoading } = useQuery<Mission>({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      const response = await apiGateway.get<Mission>(`/student/missions/${missionId}`)
      return response
    },
  })

  useEffect(() => {
    if (missionData) {
      setCurrentMission(missionData)
      setTimeRemaining((missionData.estimated_time_minutes || 0) * 60)
    }
  }, [missionData, setCurrentMission])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading mission...</p>
        </div>
      </div>
    )
  }

  if (!missionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mission Not Found</h2>
          <p className="text-slate-600">The mission you're looking for doesn't exist.</p>
        </Card>
      </div>
    )
  }

  const objectivesProgress = missionData.objectives
    ? Math.round(
        (missionData.objectives.filter((_, i) => {
          const progressThreshold = ((i + 1) / missionData.objectives!.length) * 100
          return (missionData.progress_percent || 0) >= progressThreshold
        }).length /
          missionData.objectives.length) *
          100
      )
    : 0

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6"
      role="main"
      aria-label={`Mission ${missionData.title}`}
      aria-describedby="mission-story"
    >
      {/* HEADER: Story + Objectives */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200"
      >
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-slate-700 bg-clip-text text-transparent mb-2">
              {missionData.title}
            </h1>
            <div className="flex items-center text-sm text-slate-500 gap-4">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Track: {missionData.track?.toUpperCase() || missionData.track_key?.toUpperCase() || missionData.track_name?.toUpperCase() || 'DEFENDER'}
              </div>
              <div>|</div>
              <div>Tier: {missionData.tier?.toUpperCase() || 'BEGINNER'}</div>
            </div>
          </div>
          <TimerDisplay
            timeLeft={timeRemaining}
            isPaused={isPaused}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
          />
        </div>

        {/* STORY */}
        {missionData.description && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg max-w-none mb-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-l-4 border-orange-400"
            role="region"
            aria-label="Mission story"
            id="mission-story"
            aria-live="polite"
          >
            <div className="bg-transparent border-none p-0">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <span className="mr-2" aria-hidden="true">🛡️</span>
                Mission Brief
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {missionData.description}
              </p>
            </div>
          </motion.section>
        )}

        {/* OBJECTIVES CHECKLIST */}
        {missionData.objectives && missionData.objectives.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missionData.objectives.map((obj, i) => {
              const isCompleted = objectivesProgress >= ((i + 1) / missionData.objectives!.length) * 100
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`flex items-start p-3 rounded-lg transition-colors ${
                    isCompleted ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`mt-0.5 mr-3 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {isCompleted && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                    {obj}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* MAIN CONTENT: 4-Zone Layout */}
      <nav role="navigation" aria-label="Subtasks" className="grid grid-cols-1 lg:grid-cols-4 gap-6 auto-rows-fr min-h-[70vh]">
        {/* LEFT: CURRENT SUBTASK (70%) */}
        <div className="lg:col-span-3">
          <SubtaskViewEnhanced missionId={missionId} />
        </div>

        {/* RIGHT: RECIPES + NAV (30%) */}
        <div className="lg:col-span-1 space-y-4">
          <RecipeSidebarEnhanced
            recipeIds={missionData.recipe_recommendations || []}
          />
        </div>
      </nav>

      {/* Offline Indicator */}
      {isOffline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          role="status"
          aria-live="polite"
        >
          <span>⚠️</span>
          <span>Offline - Progress saved locally</span>
          {lastSaved && (
            <span className="text-xs opacity-75">
              Last saved: {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </motion.div>
      )}

      {/* Auto-save Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: lastSaved ? 0.6 : 0 }}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-lg text-xs shadow-lg z-50"
        role="status"
        aria-live="polite"
      >
        💾 Auto-saved
      </motion.div>
    </div>
  )
}

