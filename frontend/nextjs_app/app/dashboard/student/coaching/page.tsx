'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiGateway } from '@/services/apiGateway'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Brain, 
  Sparkles, 
  Flame, 
  Target, 
  BookOpen,
  Zap,
  TrendingUp,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  Send,
  Shield,
  Swords,
  Scale,
  Lightbulb,
  Crown,
  ChevronRight,
  Calendar,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StudentProfile {
  first_name: string
  last_name: string
  tier: number
  track_key: string
  completed_missions_count: number
  current_streak: number
  recommended_tracks?: Array<{
    track_id: string
    confidence: number
    reason: string
  }>
}

interface CoachingMetrics {
  habits_streak: number
  goals_completed: number
  reflections_count: number
  weekly_completion_rate: number
  alignment_score: number
}

interface Habit {
  id: string
  name: string
  completed_today: boolean
  streak: number
}

interface Goal {
  id: string
  title: string
  progress: number
  deadline: string
  status: 'active' | 'completed' | 'paused'
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

const TRACK_CONFIG = {
  defender: { name: 'Defender', icon: Shield, color: 'text-och-defender', bg: 'bg-och-defender/20', border: 'border-och-defender/40' },
  offensive: { name: 'Offensive', icon: Swords, color: 'text-och-orange', bg: 'bg-och-orange/20', border: 'border-och-orange/40' },
  grc: { name: 'GRC', icon: Scale, color: 'text-och-mint', bg: 'bg-och-mint/20', border: 'border-och-mint/40' },
  innovation: { name: 'Innovation', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/40' },
  leadership: { name: 'Leadership', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/40' },
}

type ActiveTab = 'overview' | 'habits' | 'goals' | 'coach'

export default function CoachingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [metrics, setMetrics] = useState<CoachingMetrics | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
    }
  }, [isAuthenticated, authLoading, router])

  // Load all data
  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    const loadData = async () => {
      setLoading(true)
      try {
        const [profileData, metricsData, habitsData, goalsData] = await Promise.all([
          apiGateway.get<StudentProfile>('/student/profile').catch(() => null),
          apiGateway.get<CoachingMetrics>('/coaching/metrics').catch(() => ({
            habits_streak: 14,
            goals_completed: 3,
            reflections_count: 12,
            weekly_completion_rate: 85,
            alignment_score: 78
          })),
          apiGateway.get<Habit[]>('/coaching/habits').catch(() => [
            { id: '1', name: 'Learn', completed_today: true, streak: 14 },
            { id: '2', name: 'Practice', completed_today: false, streak: 13 },
            { id: '3', name: 'Reflect', completed_today: true, streak: 14 },
          ]),
          apiGateway.get<Goal[]>('/coaching/goals').catch((): Goal[] => [
            { id: '1', title: 'Master SIEM Log Analysis', progress: 65, deadline: '2026-01-20', status: 'active' },
            { id: '2', title: 'Complete Defender Track Missions', progress: 40, deadline: '2026-01-25', status: 'active' },
          ]),
        ])

        setProfile(profileData)
        setMetrics(metricsData)
        setHabits(habitsData)
        setGoals(goalsData)
        
        // Initialize AI coach with welcome message
        setChatMessages([{
          id: '1',
          role: 'assistant',
          content: `Hey ${profileData?.first_name || 'there'}! 👋 I'm your AI Coach, powered by OCH Genius. I've analyzed your ${profileData?.track_key || 'Defender'} track progress and I'm here to help you achieve your cybersecurity goals. What would you like to work on today?`,
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        console.error('Failed to load coaching data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, authLoading])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sendingMessage) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setSendingMessage(true)

    try {
      // Call AI coaching endpoint
      const response = await apiGateway.post<{ response: string }>('/ai/coaching/chat', {
        message: chatInput,
        context: {
          track: profile?.track_key,
          tier: profile?.tier,
          recent_activity: metrics
        }
      }).catch(() => ({
        response: "I understand you're asking about your progress. Based on your current metrics, I recommend focusing on maintaining your habit streak and completing your active goals. Would you like specific guidance on any particular area?"
      }))

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      }

      setChatMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  if (!isAuthenticated || authLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-och-gold" />
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-och-gold mx-auto" />
          </motion.div>
          <p className="text-och-steel">Loading Coaching OS...</p>
        </div>
      </div>
    )
  }

  const currentTrack = profile?.track_key ? TRACK_CONFIG[profile.track_key as keyof typeof TRACK_CONFIG] : TRACK_CONFIG.defender
  const TrackIcon = currentTrack.icon

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Section with Student Profile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card className="p-6 bg-gradient-to-r from-och-defender/20 via-och-midnight/60 to-och-mint/10 border border-och-defender/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-och-defender/5 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-och-mint/5 rounded-full blur-3xl -ml-40 -mb-40" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6">
              {/* Alignment Score Radial */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-och-defender to-och-mint p-[3px]">
                  <div className="w-full h-full rounded-full bg-och-midnight flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-black text-white">{metrics?.alignment_score || 78}</div>
                      <div className="text-[11px] text-och-steel font-bold uppercase tracking-wider">Alignment</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-och-mint border-4 border-och-midnight flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-och-midnight" />
                </div>
              </div>

              {/* Student Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
                  <Brain className="w-5 h-5 text-och-defender" />
                  <span className="text-xs font-black text-och-defender uppercase tracking-widest">Coaching OS Active</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">
                  Welcome back, <span className="text-och-gold">{profile?.first_name || 'Student'}</span>
                </h1>
                <p className="text-och-steel text-base mb-3">
                  Your Future-You alignment is at <span className="text-och-mint font-bold">{metrics?.alignment_score || 78}%</span>. 
                  Keep building your <span className="text-och-orange font-bold">{metrics?.habits_streak || 14}-day streak</span> to reach mastery.
                </p>

                {/* Track Badge */}
                <div className="flex items-center gap-4 justify-center lg:justify-start">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentTrack.bg} border ${currentTrack.border}`}>
                    <TrackIcon className={`w-5 h-5 ${currentTrack.color}`} />
                    <span className="text-sm font-bold text-white">{currentTrack.name} Track</span>
                  </div>
                  <Badge variant="gold" className="font-bold">Tier {profile?.tier || 1}</Badge>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setActiveTab('coach')}
                  variant="defender"
                  className="px-5 py-2.5 font-black uppercase tracking-widest"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Talk to AI Coach
                </Button>
                <Button
                  onClick={() => setActiveTab('habits')}
                  variant="ghost"
                  className="px-5 py-2.5 font-black uppercase tracking-widest border border-och-steel/20"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Log Habits
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            { label: 'Active Streak', value: `${metrics?.habits_streak || 14} days`, icon: Flame, color: 'text-och-orange', bg: 'bg-och-orange/20' },
            { label: 'Goals Completed', value: metrics?.goals_completed || 3, icon: Target, color: 'text-och-mint', bg: 'bg-och-mint/20' },
            { label: 'Reflections', value: metrics?.reflections_count || 12, icon: BookOpen, color: 'text-och-gold', bg: 'bg-och-gold/20' },
            { label: 'Weekly Rate', value: `${metrics?.weekly_completion_rate || 85}%`, icon: TrendingUp, color: 'text-och-defender', bg: 'bg-och-defender/20' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="p-4 bg-och-midnight/60 border border-och-steel/20 hover:border-och-defender/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-[11px] text-och-steel uppercase tracking-widest font-bold">{stat.label}</div>
              </Card>
            )
          })}
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: Brain },
            { id: 'habits', label: 'Habits', icon: Flame },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'coach', label: 'AI Coach', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                  activeTab === tab.id
                    ? 'bg-och-defender text-white'
                    : 'bg-och-midnight/60 text-och-steel hover:text-white border border-och-steel/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Habits Preview */}
              <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-5 h-5 text-och-orange" />
                    Daily Habits
                  </h3>
                  <button
                    onClick={() => setActiveTab('habits')}
                    className="text-och-steel hover:text-och-defender transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {habits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-4 rounded-xl bg-och-steel/5 border border-och-steel/10">
                      <div className="flex items-center gap-3">
                        {habit.completed_today ? (
                          <CheckCircle2 className="w-6 h-6 text-och-mint" />
                        ) : (
                          <Circle className="w-6 h-6 text-och-steel/40" />
                        )}
                        <div>
                          <div className="text-sm font-bold text-white">{habit.name}</div>
                          <div className="text-xs text-och-steel">{habit.streak} day streak</div>
                        </div>
                      </div>
                      {!habit.completed_today && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Goals Preview */}
              <Card className="p-4 bg-och-midnight/60 border border-och-steel/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-5 h-5 text-och-mint" />
                    Active Goals
                  </h3>
                  <button
                    onClick={() => setActiveTab('goals')}
                    className="text-och-steel hover:text-och-defender transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-xl bg-och-steel/5 border border-och-steel/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-bold text-white">{goal.title}</div>
                        <div className="text-xs text-och-mint font-bold">{goal.progress}%</div>
                      </div>
                      <div className="w-full h-2 bg-och-steel/10 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          className="h-full bg-och-mint"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-och-steel">
                        <Calendar className="w-3 h-3" />
                        Due {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Tracks */}
              {profile?.recommended_tracks && profile.recommended_tracks.length > 0 && (
                <Card className="p-4 bg-och-midnight/60 border border-och-steel/20 lg:col-span-2">
                  <h3 className="text-base font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-och-gold" />
                    AI-Recommended Learning Paths
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {profile.recommended_tracks.slice(0, 5).map((track, idx) => {
                      const trackConfig = TRACK_CONFIG[track.track_id as keyof typeof TRACK_CONFIG]
                      if (!trackConfig) return null
                      const Icon = trackConfig.icon
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl ${trackConfig.bg} border ${trackConfig.border} text-center hover:scale-105 transition-all cursor-pointer`}
                        >
                          <Icon className={`w-8 h-8 ${trackConfig.color} mx-auto mb-2`} />
                          <div className="text-sm font-bold text-white mb-1">{trackConfig.name}</div>
                          <div className="text-xs text-och-steel">{Math.round(track.confidence * 100)}% match</div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-och-orange/20 flex items-center justify-center border border-och-orange/40">
                    <Flame className="w-5 h-5 text-och-orange" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Habit Engine</h2>
                    <p className="text-sm text-och-steel">Track your daily discipline</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {habits.map((habit) => (
                    <Card key={habit.id} className="p-5 bg-och-steel/5 border border-och-steel/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                              habit.completed_today
                                ? 'bg-och-mint/20 border-och-mint'
                                : 'border-och-steel/30 hover:border-och-mint'
                            }`}
                          >
                            {habit.completed_today ? (
                              <CheckCircle2 className="w-5 h-5 text-och-mint" />
                            ) : (
                              <Circle className="w-5 h-5 text-och-steel/40" />
                            )}
                          </button>
                          <div>
                            <h3 className="text-base font-bold text-white">{habit.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-och-steel">
                              <Flame className="w-4 h-4 text-och-orange" />
                              {habit.streak} day streak
                            </div>
                          </div>
                        </div>
                        {!habit.completed_today && (
                          <Button variant="defender" size="sm">
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-6 bg-och-midnight/60 border border-och-steel/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-och-mint/20 flex items-center justify-center border border-och-mint/40">
                      <Target className="w-5 h-5 text-och-mint" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">Goal Tracker</h2>
                      <p className="text-sm text-och-steel">Set and achieve your objectives</p>
                    </div>
                  </div>
                  <Button variant="defender" size="sm">
                    <Target className="w-4 h-4 mr-2" />
                    New Goal
                  </Button>
                </div>

                <div className="space-y-5">
                  {goals.map((goal) => (
                    <Card key={goal.id} className="p-5 bg-och-steel/5 border border-och-steel/10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-white mb-1.5">{goal.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-och-steel">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Due {new Date(goal.deadline).toLocaleDateString()}
                            </div>
                            <Badge variant={goal.status === 'active' ? 'mint' : 'steel'}>
                              {goal.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xl font-black text-och-mint">{goal.progress}%</div>
                      </div>
                      <div className="w-full h-2.5 bg-och-steel/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          className="h-full bg-gradient-to-r from-och-mint to-och-defender"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="p-6 bg-och-midnight/60 border border-och-defender/40">
                {/* AI Coach Header */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-och-steel/10">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-och-defender to-och-mint p-0.5">
                      <div className="w-full h-full rounded-2xl bg-och-midnight flex items-center justify-center">
                        <Brain className="w-7 h-7 text-och-defender" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-och-mint border-2 border-och-midnight rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">AI Coach</h2>
                      <Badge variant="defender" className="text-[10px] font-black">OCH Genius</Badge>
                    </div>
                    <p className="text-sm text-och-steel">
                      Personalized guidance for your <span className="text-och-defender font-bold">{currentTrack.name}</span> journey
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-3 mb-5 max-h-[420px] overflow-y-auto pr-2">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-och-defender text-white'
                            : 'bg-och-steel/10 text-white border border-och-steel/20'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-och-gold" />
                            <span className="text-xs font-bold text-och-gold uppercase">AI Coach</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {sendingMessage && (
                    <div className="flex justify-start">
                      <div className="bg-och-steel/10 text-white border border-och-steel/20 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask your AI Coach anything..."
                    className="flex-1 px-3 py-2.5 bg-och-steel/10 border border-och-steel/20 rounded-xl text-white placeholder-och-steel focus:border-och-defender focus:outline-none"
                    disabled={sendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || sendingMessage}
                    variant="defender"
                    size="lg"
                    className="px-5"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-och-steel/10">
                  <p className="text-xs text-och-steel uppercase tracking-widest font-bold mb-2">Quick Actions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Analyze my progress',
                      'Suggest next mission',
                      'Review habit streak',
                      'Help with goal setting',
                    ].map((action) => (
                      <button
                        key={action}
                        onClick={() => {
                          setChatInput(action)
                          handleSendMessage()
                        }}
                        className="px-3.5 py-1.5 bg-och-steel/10 text-och-steel hover:text-white hover:bg-och-defender/20 border border-och-steel/20 hover:border-och-defender/40 rounded-lg text-[11px] font-bold transition-all"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
