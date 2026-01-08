'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { fastapiClient } from '@/services/fastapiClient'
import AIProfilerWelcome from './components/AIProfilerWelcome'
import AIProfilerInstructions from './components/AIProfilerInstructions'
import AIProfilerAssessment from './components/AIProfilerAssessment'
import AIProfilerResults from './components/AIProfilerResults'

type ProfilingSection = 'welcome' | 'instructions' | 'assessment' | 'results'

interface ProfilingQuestion {
  id: string
  question: string
  category: string
  options: Array<{
    value: string
    text: string
  }>
}

interface ProfilingSession {
  session_id: string
  status?: string
  progress?: {
    session_id: string
    current_question: number
    total_questions: number
    progress_percentage: number
    estimated_time_remaining: number
  }
}

interface ProfilingResult {
  user_id: string
  session_id: string
  recommendations: Array<{
    track_key: string
    track_name: string
    score: number
    confidence_level: string
    reasoning: string[]
    career_suggestions: string[]
  }>
  primary_track: {
    key: string
    name: string
    description: string
    focus_areas: string[]
    career_paths: string[]
  }
  assessment_summary: string
  completed_at: string
}

export default function AIProfilerPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, reloadUser } = useAuth()
  const [currentSection, setCurrentSection] = useState<ProfilingSection>('welcome')
  const [session, setSession] = useState<ProfilingSession | null>(null)
  const [questions, setQuestions] = useState<ProfilingQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ProfilingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (isLoading || !isAuthenticated) return

    // Check profiling status first
    checkProfilingStatus()
  }, [isAuthenticated, isLoading, router])

  // Listen for profiling completion event to refresh user
  useEffect(() => {
    const handleProfilingCompleted = () => {
      console.log('🔄 Profiling completed event received, refreshing user...')
      if (reloadUser) {
        reloadUser()
      }
    }

    window.addEventListener('profiling-completed', handleProfilingCompleted as EventListener)
    return () => {
      window.removeEventListener('profiling-completed', handleProfilingCompleted as EventListener)
    }
  }, [reloadUser])

  const checkProfilingStatus = async () => {
    try {
      setLoading(true)
      
      // Check if profiling is already completed
      const status = await fastapiClient.profiling.checkStatus()
      
      if (status.completed) {
        // Already completed, redirect to dashboard
        console.log('✅ Profiling already completed')
        router.push('/dashboard/student')
        return
      }
      
      // Check if there's an active session
      if (status.has_active_session && status.session_id) {
        // Resume existing session
        setSession({
          session_id: status.session_id,
          progress: status.progress
        })
        
        // Get questions
        const questionsResponse = await fastapiClient.profiling.getQuestions()
        setQuestions(questionsResponse)
        
        // Get progress to determine current question
        const progress = await fastapiClient.profiling.getProgress(status.session_id)
        setCurrentQuestionIndex(Math.min(progress.current_question - 1, questionsResponse.length - 1))
        
        setLoading(false)
        return
      }
      
      // Start new profiling session
      initializeProfiling()
    } catch (err: any) {
      setError(err.message || 'Failed to check profiling status')
      setLoading(false)
    }
  }

  const initializeProfiling = async () => {
    try {
      setLoading(true)

      // Start new profiling session
      const sessionResponse = await fastapiClient.profiling.startSession()
      setSession({
        session_id: sessionResponse.session_id,
        status: sessionResponse.status,
        progress: sessionResponse.progress
      })

      // Get all questions
      const questionsResponse = await fastapiClient.profiling.getQuestions()
      setQuestions(questionsResponse)

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to initialize AI profiling')
      setLoading(false)
    }
  }

  const handleStart = () => {
    setCurrentSection('instructions')
  }

  const handleContinue = () => {
    setCurrentSection('assessment')
  }

  const handleAnswer = async (questionId: string, answer: string) => {
    if (!session) return

    try {
      // Submit response to backend
      const response = await fastapiClient.profiling.submitResponse(
        session.session_id,
        questionId,
        answer
      )

      // Update session progress
      if (response.progress) {
        setSession(prev => prev ? {
          ...prev,
          progress: response.progress
        } : null)
      }

      // Update local responses
      setResponses(prev => ({ ...prev, [questionId]: answer }))

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        // Complete the profiling
        await completeProfiling()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer')
    }
  }

  const completeProfiling = async () => {
    if (!session) return

    try {
      setLoading(true)
      
      // Complete profiling session in FastAPI
      const resultResponse = await fastapiClient.profiling.completeSession(session.session_id)
      setResult(resultResponse)
      
      // Sync with Django backend to update user.profiling_complete
      try {
        const { apiGateway } = await import('@/services/apiGateway')
        const syncResponse = await apiGateway.post('/profiler/sync-fastapi', {
          user_id: user?.id?.toString(),
          session_id: resultResponse.session_id,
          completed_at: resultResponse.completed_at,
          primary_track: resultResponse.primary_track.key,
          recommendations: resultResponse.recommendations.map(rec => ({
            track_key: rec.track_key,
            score: rec.score,
            confidence_level: rec.confidence_level
          }))
        })
        console.log('✅ Profiling synced with Django backend:', syncResponse)
        
        // Refresh user auth state to reflect profiling completion
        if (typeof window !== 'undefined') {
          // Dispatch event for auth hook to refresh user
          window.dispatchEvent(new CustomEvent('profiling-completed', { 
            detail: { sessionId: resultResponse.session_id }
          }))
          
          // Also reload user directly after a short delay to allow sync to complete
          setTimeout(() => {
            if (reloadUser) {
              reloadUser()
            }
          }, 500)
        }
      } catch (syncError: any) {
        console.warn('⚠️ Failed to sync with Django:', syncError)
        // Continue anyway - the profiling is complete in FastAPI
        // User can still proceed, sync can happen later
      }
      
      setCurrentSection('results')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to complete profiling')
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    // Ensure user state is refreshed before redirecting
    if (reloadUser) {
      await reloadUser()
    }
    
    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Redirect to dashboard with track recommendation
    if (result?.primary_track) {
      router.push(`/dashboard/student?track=${result.primary_track.key}&welcome=true`)
    } else {
      router.push('/dashboard/student')
    }
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = session?.progress || {
    current_question: currentQuestionIndex + 1,
    total_questions: questions.length,
    progress_percentage: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
    estimated_time_remaining: (questions.length - currentQuestionIndex - 1) * 120
  }

  if (loading && currentSection !== 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-och-orange mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {currentSection === 'welcome' ? 'Initializing AI Profiler...' :
             currentSection === 'assessment' ? 'Processing your responses...' :
             'Analyzing your profile...'}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Profiling Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-och-orange hover:bg-och-orange/80 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-och-midnight via-och-space to-och-crimson">
      {currentSection === 'welcome' && (
        <AIProfilerWelcome onStart={handleStart} />
      )}
      {currentSection === 'instructions' && (
        <AIProfilerInstructions
          onContinue={handleContinue}
          totalQuestions={questions.length}
        />
      )}
      {currentSection === 'assessment' && currentQuestion && (
        <AIProfilerAssessment
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          progress={progress}
          onAnswer={handleAnswer}
          previousAnswer={responses[currentQuestion.id]}
        />
      )}
      {currentSection === 'results' && result && (
        <AIProfilerResults
          result={result}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
























