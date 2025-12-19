/**
 * Coaching Sidebar Component
 * Persistent sidebar for desktop, bottom tab bar for mobile
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, Sparkles, BookOpen, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RadialAlignment } from './RadialAlignment'
import { useCoachingStore } from '@/lib/coaching/store'

interface CoachingSidebarProps {
  onNavigate?: (section: 'habits' | 'goals' | 'reflect' | 'coach') => void
}

export function CoachingSidebar({ onNavigate }: CoachingSidebarProps) {
  const { metrics } = useCoachingStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  const quickActions = [
    { icon: Flame, label: 'Log Habits', section: 'habits' as const },
    { icon: Target, label: 'Check Goals', section: 'goals' as const },
    { icon: Sparkles, label: 'AI Coach', section: 'coach' as const },
    { icon: BookOpen, label: 'Reflect', section: 'reflect' as const },
  ]
  
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-900/95 to-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 z-50 hidden lg:block"
      >
        {/* Radial Progress Header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100">Coaching OS</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:bg-slate-800"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </Button>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <RadialAlignment score={metrics?.alignmentScore || 0} target={95} size="md" />
              <p className="text-sm text-slate-400 mt-2 text-center">
                Future-You Alignment
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Quick Action Buttons */}
        <div className="p-4 space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.section}
              variant="outline"
              size="sm"
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-indigo-300"
              onClick={() => onNavigate?.(action.section)}
            >
              <action.icon className="w-4 h-4 mr-2" />
              {!isCollapsed && action.label}
            </Button>
          ))}
        </div>
        
        {/* Stats Summary */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Active Habits</span>
                <span className="text-indigo-300 font-semibold">{metrics?.activeHabits ?? metrics?.habits_streak ?? 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Streak</span>
                <span className="text-orange-300 font-semibold">{metrics?.totalStreakDays ?? metrics?.habits_streak ?? 0} days</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Reflections</span>
                <span className="text-purple-300 font-semibold">{metrics?.reflectionCount ?? metrics?.reflections_count ?? 0}</span>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
      
      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50 lg:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {quickActions.slice(0, 4).map((action) => (
            <Button
              key={action.section}
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 py-3 border-0 text-slate-400 hover:bg-slate-800/50 hover:text-indigo-300"
              onClick={() => {
                onNavigate?.(action.section)
                setIsMobileOpen(true)
              }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs">{action.label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Mobile Full Modal */}
      {isMobileOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed inset-0 bg-slate-900 z-50 lg:hidden"
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">Coaching OS</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileOpen(false)}
              className="border-slate-700 text-slate-400"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-6">
            <RadialAlignment score={metrics?.alignmentScore || 0} target={95} size="lg" className="mx-auto mb-4" />
            <p className="text-center text-slate-300 mb-6">
              {metrics?.alignmentScore || 0}% aligned with your Future-You
            </p>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Button
                  key={action.section}
                  variant="outline"
                  size="lg"
                  className="w-full justify-start border-slate-700 text-slate-300"
                  onClick={() => {
                    onNavigate?.(action.section)
                    setIsMobileOpen(false)
                  }}
                >
                  <action.icon className="w-5 h-5 mr-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

