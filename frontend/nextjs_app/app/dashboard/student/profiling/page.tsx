'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Loader2, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Rocket, 
  Shield, 
  ArrowRight, 
  CheckCircle2,
  Zap,
  Brain,
  Map,
  GraduationCap,
  Briefcase,
  Star,
  Award,
  Compass
} from 'lucide-react'

export default function ProfilingResultsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [blueprint, setBlueprint] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [allTracks, setAllTracks] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (authLoading || !isAuthenticated) return

    const checkAndRedirect = async () => {
      try {
        setCheckingStatus(true)
        
        const fastapiStatus = await fastapiClient.profiling.checkStatus()
        
        if (!fastapiStatus.completed) {
          router.push('/onboarding/ai-profiler')
          return
        }

        if (fastapiStatus.session_id) {
          try {
            const fastapiResults = await fastapiClient.profiling.getResults(fastapiStatus.session_id)
            // Fetch OCH Blueprint for deeper analysis
            let bp: any | null = null
            try {
              bp = await fastapiClient.profiling.getBlueprint(fastapiStatus.session_id)
              setBlueprint(bp)
            } catch (bpError) {
              console.warn('⚠️ Failed to fetch OCH Blueprint for dashboard profiling view:', bpError)
            }

            setResults({
              recommendations: fastapiResults.recommendations,
              primary_track: fastapiResults.primary_track,
              assessment_summary: fastapiResults.assessment_summary,
              completed_at: fastapiResults.completed_at,
              overall_score:
                bp?.personalized_insights?.career_alignment?.career_readiness_score ??
                fastapiResults.recommendations?.[0]?.score ??
                0,
              aptitude_score: fastapiResults.recommendations?.[0]?.score || 0,
              behavioral_score: fastapiResults.recommendations?.[0]?.score || 0,
              strengths:
                bp?.learning_strategy?.strengths_to_leverage?.length
                  ? bp.learning_strategy.strengths_to_leverage
                  : fastapiResults.recommendations?.[0]?.reasoning || [],
              areas_for_growth:
                bp?.learning_strategy?.growth_opportunities?.length
                  ? bp.learning_strategy.growth_opportunities
                  : fastapiResults.recommendations?.slice(1, 3).map((r: any) => r.track_name) || [],
            })

            // Load all tracks for overview section
            try {
              const tracksResp = await fastapiClient.profiling.getTracks()
              setAllTracks(tracksResp.tracks || {})
            } catch (tracksError) {
              console.warn('⚠️ Failed to load OCH tracks for profiling dashboard:', tracksError)
            }

            setLoading(false)
            setCheckingStatus(false)
            return
          } catch (resultsError: any) {
            console.warn('⚠️ Failed to fetch FastAPI results:', resultsError)
          }
        }

        try {
          const { djangoClient } = await import('@/services/djangoClient')
          const djangoData = await djangoClient.profiler.getResults()
          if (djangoData.completed && djangoData.result) {
            setResults(djangoData.result)
          } else {
            setError('No profiling results found. Please complete your profiling assessment.')
          }
        } catch (djangoError: any) {
          setError('Unable to load profiling results. Please try completing the assessment again.')
        }

        setLoading(false)
        setCheckingStatus(false)
      } catch (err: any) {
        console.error('Error checking profiling status:', err)
        setError(err.message || 'Failed to load profiling status')
        setLoading(false)
        setCheckingStatus(false)
      }
    }

    checkAndRedirect()
  }, [isAuthenticated, authLoading, router])

  if (checkingStatus || loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-gold/30 rounded-3xl max-w-md w-full">
          <div className="text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mx-auto"
            >
              <Sparkles className="w-16 h-16 text-och-gold" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {checkingStatus ? 'Analyzing Profile' : 'Loading Results'}
              </h2>
              <p className="text-sm text-och-steel font-medium">
                The AI engine is processing your assessment
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 flex items-center justify-center p-4">
        <Card className="p-12 bg-och-midnight/90 border border-och-defender/40 rounded-3xl max-w-2xl w-full">
          <div className="text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-och-defender/10 flex items-center justify-center mx-auto border-2 border-och-defender/30">
              <Brain className="w-12 h-12 text-och-defender" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Profiling Not Completed</h1>
              <p className="text-base text-och-steel leading-relaxed">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => router.push('/onboarding/ai-profiler')}
                variant="defender"
                className="flex-1 font-black uppercase tracking-widest text-sm"
                glow
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
              <Button
                onClick={() => router.push('/dashboard/student')}
                variant="outline"
                className="flex-1 font-black uppercase tracking-widest text-sm"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!results) {
    useEffect(() => {
      router.push('/onboarding/ai-profiler')
    }, [router])
    return null
  }

  const primaryRecommendation = results.recommendations?.[0]
  const overallScore = results.overall_score || primaryRecommendation?.score || 0
  const primaryTrack = results.primary_track || primaryRecommendation
  const strengths = results.strengths || primaryRecommendation?.reasoning || []
  const secondaryRecommendations = results.recommendations?.slice(1, 3) || []

  const difficultyLevel = blueprint?.difficulty_level
  const careerAlignment = blueprint?.personalized_insights?.career_alignment
  const valueStatement = blueprint?.value_statement
  const nextSteps = blueprint?.next_steps || []

  // Journey steps
  const journeySteps = [
    { 
      icon: Brain, 
      title: 'AI Profiling', 
      description: 'Assessment complete',
      status: 'completed',
      color: 'och-gold'
    },
    { 
      icon: Target, 
      title: 'Track Match', 
      description: primaryTrack?.name || 'Track selected',
      status: 'current',
      color: 'och-mint'
    },
    { 
      icon: Compass, 
      title: 'Curriculum GPS', 
      description: 'Personalized learning path',
      status: 'upcoming',
      color: 'och-steel'
    },
    { 
      icon: Rocket, 
      title: 'Missions', 
      description: 'Hands-on practice',
      status: 'upcoming',
      color: 'och-steel'
    },
    { 
      icon: Briefcase, 
      title: 'Career Ready', 
      description: 'Industry-ready skills',
      status: 'upcoming',
      color: 'och-steel'
    },
  ]

  // Track icon mapping
  const trackIcons: Record<string, string> = {
    defender: '🛡️',
    offensive: '⚔️',
    innovation: '🔬',
    leadership: '👑',
    grc: '📋'
  }
  const primaryTrackIcon = primaryTrack?.key ? trackIcons[primaryTrack.key] : trackIcons[primaryTrack?.track_key || ''] || '🎯'

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-och-midnight to-slate-950 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Celebration Hero Section */}
      <section className="w-full relative overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>
        
        <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-12 lg:py-16 xl:py-20">
          {/* Celebration Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-10 lg:mb-12"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
              className="inline-flex items-center justify-center mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-br from-och-gold via-och-mint to-och-defender rounded-full blur-2xl opacity-50"
                />
                <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-och-gold via-och-mint to-och-defender shadow-2xl shadow-och-gold/50 p-1">
                  <div className="w-full h-full rounded-2xl bg-och-midnight/95 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-och-gold" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Badge variant="gold" className="mb-4 text-xs font-black uppercase tracking-widest px-3 py-1.5">
                Assessment Complete
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-4 lg:mb-5 leading-tight">
                <span className="block mb-1">Welcome to Your</span>
                <span className="block bg-gradient-to-r from-och-gold via-och-mint to-och-defender bg-clip-text text-transparent">
                  {primaryTrack?.name || primaryTrack?.track_name || 'Career Journey'}
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-och-steel/80 max-w-3xl mx-auto font-medium leading-relaxed">
                Your personalized path to cybersecurity excellence is ready{difficultyLevel?.selected ? (
                  <>
                    {' '}at the{' '}
                    <span className="text-och-gold font-bold uppercase">
                      {difficultyLevel.selected.toUpperCase()}
                    </span>{' '}
                    level.
                  </>
                ) : null}
              </p>
            </motion.div>
          </motion.div>

          {/* Primary Track Hero Card - Redesigned */}
          {primaryTrack && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
              className="w-full max-w-6xl mx-auto"
            >
              <Card className="w-full relative overflow-hidden bg-gradient-to-br from-och-midnight/90 via-och-midnight/80 to-och-midnight/90 border-2 border-och-mint/50 rounded-2xl sm:rounded-3xl lg:rounded-[2rem] p-6 sm:p-8 lg:p-10 xl:p-12 shadow-2xl shadow-och-mint/30 backdrop-blur-xl">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-och-mint/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-och-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  {/* Track Icon & Badge */}
                  <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="inline-flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-och-mint/30 to-och-gold/30 border-2 border-och-mint/50 mb-4 shadow-xl shadow-och-mint/30 backdrop-blur-sm"
                    >
                      <span className="text-3xl sm:text-4xl lg:text-5xl">{primaryTrackIcon}</span>
                    </motion.div>
                    <Badge variant="mint" className="text-xs font-black uppercase mb-3 px-3 py-1.5 tracking-widest">
                      Your Perfect Match
                    </Badge>
                  </div>

                  {/* Track Name & Score */}
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-5 leading-tight">
                      <span className="block mb-2">{primaryTrack.name || primaryTrack.track_name}</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: "spring" }}
                        className="inline-flex items-center justify-center gap-3 px-5 py-2 rounded-xl bg-och-mint/10 border border-och-mint/30 backdrop-blur-sm"
                      >
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-och-mint to-och-gold bg-clip-text text-transparent">
                          {Math.round(primaryRecommendation?.score || overallScore)}%
                        </span>
                        <span className="text-xs sm:text-sm lg:text-base text-och-steel font-bold uppercase tracking-widest">
                          Match
                        </span>
                      </motion.div>
                    </h2>
                    {primaryTrack.description && (
                      <p className="text-sm sm:text-base lg:text-lg text-och-steel/90 max-w-2xl mx-auto leading-relaxed">
                        {primaryTrack.description}
                      </p>
                    )}
                    {careerAlignment?.career_readiness_score && (
                      <p className="mt-3 text-xs sm:text-sm text-och-steel/80 font-medium">
                        Career readiness score:{' '}
                        <span className="text-och-gold font-bold">
                          {careerAlignment.career_readiness_score}%
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Focus Areas & Career Paths - Enhanced Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-och-steel/20">
                    {primaryTrack.focus_areas && primaryTrack.focus_areas.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="w-full"
                      >
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                          <div className="p-2 rounded-xl bg-och-mint/20 border border-och-mint/40">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-och-mint" />
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">
                            Focus Areas
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {primaryTrack.focus_areas.map((area: string, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1 + idx * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <Badge variant="mint" className="text-xs sm:text-sm font-bold uppercase px-4 py-2 cursor-default">
                                {area}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {primaryTrack.career_paths && primaryTrack.career_paths.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 }}
                        className="w-full"
                      >
                        <div className="flex items-center gap-3 mb-4 sm:mb-6">
                          <div className="p-2 rounded-xl bg-och-gold/20 border border-och-gold/40">
                            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-och-gold" />
                          </div>
                          <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest">
                            Career Paths
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {primaryTrack.career_paths.map((path: string, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.1 + idx * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <Badge variant="gold" className="text-xs sm:text-sm font-bold uppercase px-4 py-2 cursor-default">
                                {path}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* Your Journey Map - Full Width */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-6 sm:mb-8 text-center"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3 uppercase tracking-tight leading-tight">
            Your <span className="text-och-gold">OCH Journey</span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-och-steel max-w-2xl mx-auto leading-relaxed px-4">
            From AI-powered profiling to career-ready expertise, here's your path to cybersecurity mastery
          </p>
        </motion.div>

        <div className="relative w-full">
          {/* Journey Timeline - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-och-gold via-och-mint to-och-steel/30" />
          
          <div className="space-y-6 sm:space-y-8 lg:space-y-12 w-full">
            {journeySteps.map((step, idx) => {
              const StepIcon = step.icon
              const isLeft = idx % 2 === 0
              
              return (
              <motion.div
                key={idx}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="w-full flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8 xl:gap-12"
                >
                  <div className={`w-full lg:flex-1 ${isLeft ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8 lg:order-2'} ${!isLeft ? 'lg:order-2' : ''}`}>
                    <div className={`flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3 ${isLeft ? 'lg:justify-end' : 'lg:justify-start'}`}>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl flex items-center justify-center border-2 shrink-0 ${
                        step.status === 'completed' 
                          ? 'bg-och-gold/20 border-och-gold text-och-gold' 
                          : step.status === 'current'
                          ? 'bg-och-mint/20 border-och-mint text-och-mint'
                          : 'bg-och-steel/10 border-och-steel/30 text-och-steel'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                        ) : (
                          <StepIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-xs sm:text-sm lg:text-base text-och-steel font-bold uppercase tracking-widest mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center Dot - Hidden on mobile */}
                  <div className="hidden lg:flex items-center justify-center w-10 h-10 xl:w-12 xl:h-12 shrink-0 relative z-10">
                    <div className={`w-4 h-4 xl:w-6 xl:h-6 rounded-full border-2 ${
                      step.status === 'completed' 
                        ? 'bg-och-gold border-och-gold' 
                        : step.status === 'current'
                        ? 'bg-och-mint border-och-mint animate-pulse'
                        : 'bg-och-steel/30 border-och-steel/50'
                    }`} />
                  </div>
                  
                  <div className="hidden lg:block lg:flex-1" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* All OCH Tracks Overview - Full Width */}
      {Object.keys(allTracks).length > 0 && (
        <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="w-full"
          >
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3 uppercase tracking-tight leading-tight">
                All <span className="text-och-gold">OCH Career Tracks</span>
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-och-steel max-w-2xl mx-auto leading-relaxed px-4">
                Explore all specialized cybersecurity tracks available in the OCH ecosystem
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {Object.entries(allTracks).map(([key, track]) => {
                const isPrimary = primaryTrack?.key === key || primaryTrack?.track_key === key
                const trackIcons: Record<string, string> = {
                  defender: '🛡️',
                  offensive: '⚔️',
                  innovation: '🔬',
                  leadership: '👑',
                  grc: '📋'
                }
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + (Object.keys(allTracks).indexOf(key) * 0.1) }}
                  >
                    <Card className={`w-full h-full bg-gradient-to-br ${
                      isPrimary 
                        ? 'from-och-mint/30 via-och-midnight/80 to-och-midnight/80 border-2 border-och-mint/50 shadow-2xl shadow-och-mint/20' 
                        : 'from-och-midnight/60 to-och-midnight/80 border border-och-steel/20'
                    } rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-och-gold/30 transition-all`}>
                      <div className="text-center mb-3 sm:mb-4">
                        <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl mb-3 ${
                          isPrimary ? 'bg-och-mint/20 border-2 border-och-mint/40' : 'bg-och-steel/10 border border-och-steel/30'
                        }`}>
                          <span className="text-2xl sm:text-3xl">{trackIcons[key] || '🎯'}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1.5">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white uppercase tracking-tight">
                            {track.name}
                          </h3>
                          {isPrimary && (
                            <Badge variant="mint" className="text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5">
                              Your Track
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-och-steel leading-relaxed mb-3">
                          {track.description}
                        </p>
                      </div>
                      
                      {track.focus_areas && track.focus_areas.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-och-gold" />
                            Focus Areas
                          </h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {track.focus_areas.slice(0, 4).map((area: string, idx: number) => (
                              <Badge key={idx} variant="steel" className="text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {track.career_paths && track.career_paths.length > 0 && (
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-och-steel uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-och-gold" />
                            Career Paths
                          </h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {track.career_paths.slice(0, 3).map((path: string, idx: number) => (
                              <Badge key={idx} variant="gold" className="text-[8px] sm:text-[9px] font-bold uppercase px-2 py-0.5">
                                {path}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </section>
      )}

      {/* Assessment Insights - Full Width */}
      {results.assessment_summary && (
        <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-10 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="w-full"
          >
            <Card className="w-full bg-och-midnight/60 border border-och-steel/10 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-12 xl:p-16">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl bg-och-defender/10 border border-och-defender/30 flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-och-defender" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight mb-1 leading-tight">
                    AI Assessment Summary
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-och-steel font-bold uppercase tracking-widest">
                    Your personalized analysis
                  </p>
                    </div>
                  </div>
              <div className="space-y-4 sm:space-y-6">
                <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-och-steel leading-relaxed">
                  {results.assessment_summary}
                </p>
                {valueStatement && (
                  <div className="mt-4 border-t border-och-steel/20 pt-4 sm:pt-5">
                    <h4 className="text-sm sm:text-base lg:text-lg font-black text-white uppercase tracking-widest mb-2">
                      Your Value Statement
                    </h4>
                    <p className="text-sm sm:text-base lg:text-lg text-och-steel leading-relaxed">
                      {valueStatement}
                    </p>
                  </div>
                )}
              </div>
            </Card>
              </motion.div>
        </section>
      )}

      {/* Strengths & Alternative Paths - Full Width Grid */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 w-full">
      {/* Strengths */}
      {strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
              className="w-full"
            >
              <Card className="w-full h-full bg-gradient-to-br from-och-gold/10 to-och-midnight/60 border border-och-gold/20 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-och-gold/20 border border-och-gold/40 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-och-gold" />
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                    Your Strengths
          </h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
            {strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-och-gold shrink-0 mt-0.5 sm:mt-1" />
                      <p className="text-sm sm:text-base lg:text-lg text-och-steel leading-relaxed">{strength}</p>
                    </div>
            ))}
          </div>
        </Card>
            </motion.div>
      )}

          {/* Alternative Tracks */}
          {secondaryRecommendations.length > 0 && (
              <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="w-full"
            >
              <Card className="w-full h-full bg-gradient-to-br from-och-defender/10 to-och-midnight/60 border border-och-defender/20 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-och-defender/20 border border-och-defender/40 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-och-defender" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight leading-tight">
                    Alternative Paths
                  </h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {secondaryRecommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-och-midnight/40 border border-och-steel/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-tight">{rec.track_name}</h4>
                        <Badge variant="defender" className="text-[9px] sm:text-[10px] font-black uppercase shrink-0 ml-2 px-2 py-0.5">
                          {Math.round(rec.score)}%
                        </Badge>
                      </div>
                      {rec.confidence_level && (
                        <p className="text-[9px] sm:text-[10px] text-och-steel uppercase tracking-widest font-bold">
                          {rec.confidence_level} confidence
                        </p>
                      )}
                    </div>
                  ))}
                </div>
        </Card>
            </motion.div>
      )}
        </div>
      </section>

      {/* Call to Action - Full Width */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="text-center w-full"
        >
          <Card className="w-full bg-gradient-to-r from-och-mint/20 via-och-gold/10 to-och-defender/20 border-2 border-och-mint/30 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-8 sm:p-10 lg:p-12 xl:p-16">
            <div className="max-w-4xl mx-auto w-full">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4 lg:mb-6 uppercase tracking-tight leading-tight">
                Ready to Begin Your <span className="text-och-gold">Journey</span>?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-och-steel mb-6 sm:mb-8 lg:mb-10 leading-relaxed px-2">
                Your personalized learning path is ready. Start your first mission and begin building the skills that will transform your career.
              </p>
              {nextSteps.length > 0 && (
                <div className="mb-6 sm:mb-8 lg:mb-10">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest mb-3">
                    Recommended Next Steps
                  </h4>
                  <ul className="text-xs sm:text-sm lg:text-base text-och-steel space-y-1.5 sm:space-y-2 text-left max-w-3xl mx-auto">
                    {nextSteps.map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 text-och-mint shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
        <Button
          onClick={() => router.push('/dashboard/student')}
                  variant="mint"
                  size="lg"
                  className="flex-1 sm:flex-none font-black uppercase tracking-widest text-sm sm:text-base px-6 sm:px-8"
          glow
        >
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Launch Dashboard
        </Button>
        <Button
                  onClick={() => router.push('/dashboard/student/curriculum')}
          variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none font-black uppercase tracking-widest text-sm sm:text-base px-6 sm:px-8 border-och-gold/50 text-och-gold hover:bg-och-gold/10"
        >
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  View Curriculum
        </Button>
      </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
