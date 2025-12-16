/**
 * Enhanced Mission Card Component
 * Draggable card with radial progress, animations, and hover effects
 */
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RadialProgress } from './shared/RadialProgress'
import { StatusBadge } from './shared/StatusBadge'
import { useMissionStore } from '../lib/store/missionStore'
import type { Mission } from '../types'

interface MissionCardEnhancedProps {
  mission: Mission & { gates?: any[]; warnings?: any[] }
  isDragging?: boolean
  provided?: any
  [key: string]: any // Allow additional props for drag-drop
}

export function MissionCardEnhanced({
  mission,
  isDragging = false,
  provided,
}: MissionCardEnhancedProps) {
  const router = useRouter()
  const { setCurrentMission } = useMissionStore()

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mission.status === 'locked') {
      // Navigate to coaching if locked
      router.push('/dashboard/student/coaching')
      return
    }
    setCurrentMission(mission)
    router.push(`/dashboard/student/missions/${mission.id}`)
  }
  
  const isLocked = mission.status === 'locked'

  const getDifficultyVariant = () => {
    switch (mission.difficulty) {
      case 'beginner':
        return 'mint'
      case 'intermediate':
        return 'orange'
      case 'advanced':
        return 'defender'
      case 'capstone':
        return 'gold'
      default:
        return 'steel'
    }
  }

  const getProgressColor = (): string => {
    const progress = mission.progress_percent || 0
    if (progress >= 80) return '#10B981'
    if (progress >= 50) return '#F59E0B'
    if (progress >= 25) return '#3B82F6'
    return '#EF4444'
  }

  const cardContent = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`group hover:shadow-xl transition-all duration-300 border-2 ${
          isLocked 
            ? 'border-amber-500/50 opacity-75 bg-slate-800/50' 
            : 'border-transparent hover:border-blue-300'
        } ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant={getDifficultyVariant()}>{mission.difficulty}</Badge>
            <RadialProgress
              percentage={mission.progress_percent || 0}
              size={40}
              strokeWidth={4}
              color={getProgressColor()}
            />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold line-clamp-2 group-hover:text-blue-600 mb-3 min-h-[3rem]">
            {mission.title}
          </h3>

          {/* Metadata */}
          <div className="space-y-2 text-sm text-slate-600 mb-4">
            {mission.estimated_time_minutes && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>⏱️ {Math.ceil(mission.estimated_time_minutes / 60)}h remaining</span>
              </div>
            )}
            {mission.recipe_recommendations && (
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>🍳 {mission.recipe_recommendations.length || 0} recipes</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <StatusBadge status={mission.status as any} />
          </div>

          {/* Locked Gates Info */}
          {isLocked && mission.gates && mission.gates.length > 0 && (
            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
              <p className="text-amber-300 font-medium mb-1">🔒 Locked</p>
              {mission.gates.slice(0, 1).map((gate: any, idx: number) => (
                <p key={idx} className="text-amber-200/80">{gate.message}</p>
              ))}
            </div>
          )}

          {/* Action Button */}
          <Button
            className={`w-full group-hover:scale-[1.02] ${
              isLocked
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
            onClick={handleStart}
          >
            {isLocked 
              ? 'Unlock in Coaching OS' 
              : mission.status === 'in_progress' 
                ? 'Continue Mission' 
                : 'Start Mission'
            }
          </Button>
        </div>
      </Card>
    </motion.div>
  )

  if (provided) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        {cardContent}
      </div>
    )
  }

  return cardContent
}

