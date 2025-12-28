'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiGateway } from '@/services/apiGateway'
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
  const { user, isAuthenticated, isLoading } = useAuth()
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

    // Start profiling session
    initializeProfiling()
  }, [isAuthenticated, isLoading, router])

  const initializeProfiling = async () => {
    try {
      setLoading(true)

      // Start new profiling session
      const sessionResponse = await apiGateway.post('/profiling/session/start')
      setSession(sessionResponse)

      // Get all questions
      const questionsResponse = await apiGateway.get('/profiling/questions')
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
      await apiGateway.post(`/profiling/session/${session.session_id}/respond`, {
        question_id: questionId,
        selected_option: answer
      })

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
      const resultResponse = await apiGateway.post(`/profiling/session/${session.session_id}/complete`)
      setResult(resultResponse)
      setCurrentSection('results')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to complete profiling')
      setLoading(false)
    }
  }

  const handleComplete = () => {
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



