'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function ProfilingResultsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (authLoading || !isAuthenticated) return

    const checkAndRedirect = async () => {
      try {
        setCheckingStatus(true)
        
        // Check FastAPI profiling status first (for students)
        const fastapiStatus = await fastapiClient.profiling.checkStatus()
        
        if (!fastapiStatus.completed) {
          // Profiling not completed - redirect to FastAPI profiling
          console.log('✅ Profiling not completed, redirecting to FastAPI profiling')
          router.push('/onboarding/ai-profiler')
          return
        }

        // Profiling is completed - fetch results
        if (fastapiStatus.session_id) {
          try {
            const fastapiResults = await fastapiClient.profiling.getResults(fastapiStatus.session_id)
            setResults({
              recommendations: fastapiResults.recommendations,
              primary_track: fastapiResults.primary_track,
              assessment_summary: fastapiResults.assessment_summary,
              completed_at: fastapiResults.completed_at,
              // Map FastAPI results to expected format
              overall_score: fastapiResults.recommendations?.[0]?.score || 0,
              aptitude_score: fastapiResults.recommendations?.[0]?.score || 0,
              behavioral_score: fastapiResults.recommendations?.[0]?.score || 0,
              strengths: fastapiResults.recommendations?.[0]?.reasoning || [],
              areas_for_growth: fastapiResults.recommendations?.slice(1, 3).map(r => r.track_name) || [],
            })
            setLoading(false)
            setCheckingStatus(false)
            return
          } catch (resultsError: any) {
            console.warn('⚠️ Failed to fetch FastAPI results:', resultsError)
            // Continue to show error or fallback
          }
        }

        // Fallback: Try Django results if FastAPI doesn't have session_id
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
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-och-defender animate-spin mx-auto" />
            <div className="text-white text-xl">
              {checkingStatus ? 'Checking profiling status...' : 'Loading profiling results...'}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card gradient="defender" className="p-8 max-w-2xl">
          <div className="text-center space-y-6">
            <div className="text-5xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-white mb-4">Profiling Not Completed</h1>
            <p className="text-steel-grey mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/onboarding/ai-profiler')}
                variant="defender"
                className="w-full"
                glow
              >
                Start AI Profiling Assessment
              </Button>
              <Button
                onClick={() => router.push('/dashboard/student')}
                variant="outline"
                className="w-full"
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
    // Redirect to profiling if no results
    useEffect(() => {
      router.push('/onboarding/ai-profiler')
    }, [router])
    return null
  }

  // Use FastAPI results format if available, fallback to Django format
  const primaryRecommendation = results.recommendations?.[0]
  const overallScore = results.overall_score || primaryRecommendation?.score || 0
  const primaryTrack = results.primary_track || primaryRecommendation
  const strengths = results.strengths || primaryRecommendation?.reasoning || []
  const areasForGrowth = results.areas_for_growth || results.recommendations?.slice(1, 3).map((r: any) => r.track_name) || []

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">AI Profiling Results</h1>
        <p className="text-steel-grey">Your track recommendations and assessment results</p>
      </motion.div>

      {/* Primary Track Recommendation */}
      {primaryTrack && (
        <Card gradient="defender" glow className="p-8 border border-defender-blue/40 rounded-2xl mb-6">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">Recommended Track</h2>
            <div className="text-3xl font-bold text-cyber-mint mb-2">
              {primaryTrack.name || primaryTrack.track_name}
            </div>
            <div className="text-steel-grey text-lg">
              {primaryRecommendation?.score ? `${Math.round(primaryRecommendation.score)}% Match` : ''}
            </div>
            {primaryTrack.description && (
              <p className="text-steel-grey mt-4 max-w-2xl mx-auto">
                {primaryTrack.description}
              </p>
            )}
          </div>

          {/* Overall Score */}
          <div className="text-center mb-8 pt-6 border-t border-steel-grey/30">
            <div className="text-5xl font-bold text-cyber-mint mb-2">
              {Math.round(overallScore)}%
            </div>
            <div className="text-steel-grey text-lg">Overall Assessment Score</div>
          </div>
        </Card>
      )}

      {/* Assessment Summary */}
      {results.assessment_summary && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Assessment Summary</h3>
          <p className="text-steel-grey leading-relaxed">{results.assessment_summary}</p>
        </Card>
      )}

      {/* Track Recommendations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">All Track Recommendations</h3>
          <div className="space-y-4">
            {results.recommendations.map((rec: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-och-midnight/50 rounded-lg p-4 border border-steel-grey/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{rec.track_name}</h4>
                    <div className="text-steel-grey text-sm">
                      {rec.confidence_level && (
                        <span className="capitalize">{rec.confidence_level} confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-cyber-mint">
                    {Math.round(rec.score)}%
                  </div>
                </div>
                {rec.reasoning && rec.reasoning.length > 0 && (
                  <ul className="list-disc list-inside text-steel-grey mt-2 space-y-1">
                    {rec.reasoning.map((reason: string, rIdx: number) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                )}
                {rec.career_suggestions && rec.career_suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-steel-grey/20">
                    <div className="text-sm font-medium text-white mb-2">Career Paths:</div>
                    <div className="flex flex-wrap gap-2">
                      {rec.career_suggestions.map((career: string, cIdx: number) => (
                        <span
                          key={cIdx}
                          className="bg-defender-blue/20 text-defender-blue px-3 py-1 rounded-full text-xs"
                        >
                          {career}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>💪</span>
            <span>Your Strengths</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {strengths.map((strength: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-cyber-mint/10 border border-cyber-mint/30 rounded-lg p-4 text-white"
              >
                {strength}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Areas for Growth */}
      {areasForGrowth.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Alternative Paths to Explore</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {areasForGrowth.map((area: string, idx: number) => (
              <motion.div
                key={idx}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-defender-blue/10 border border-defender-blue/30 rounded-lg p-4 text-white"
              >
                {area}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => router.push('/dashboard/student')}
          variant="defender"
          className="flex-1"
          glow
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => router.push('/onboarding/ai-profiler')}
          variant="outline"
          className="flex-1"
        >
          Retake Assessment
        </Button>
      </div>
    </div>
  )
}






