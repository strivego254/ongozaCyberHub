'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { djangoClient } from '@/services/djangoClient'
import ProfilingWelcome from './components/ProfilingWelcome'
import ProfilingInstructions from './components/ProfilingInstructions'
import ProfilingAssessment from './components/ProfilingAssessment'
import ProfilingResults from './components/ProfilingResults'

type ProfilingSection = 'welcome' | 'instructions' | 'aptitude' | 'behavioral' | 'results'

export default function ProfilingPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [currentSection, setCurrentSection] = useState<ProfilingSection>('welcome')
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (isLoading || !isAuthenticated) return

    // Check if profiling is required
    const checkProfiling = async () => {
      try {
        const status = await djangoClient.profiler.checkRequired()
        
        if (!status.required || status.completed) {
          // Profiling not required or already completed
          router.push('/dashboard/student')
          return
        }

        if (status.has_active_session && status.session_token) {
          // Resume existing session
          setSessionData({
            session_id: status.session_id,
            session_token: status.session_token,
            current_section: status.current_section || 'welcome',
          })
          setCurrentSection((status.current_section as ProfilingSection) || 'welcome')
        }

        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to check profiling status')
        setLoading(false)
      }
    }

    checkProfiling()
  }, [isAuthenticated, isLoading, router])

  const handleStart = async () => {
    try {
      setLoading(true)
      const session = await djangoClient.profiler.start()
      setSessionData(session)
      setCurrentSection('instructions')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to start profiling')
      setLoading(false)
    }
  }

  const handleContinue = () => {
    setCurrentSection('aptitude')
  }

  const handleSectionComplete = async (section: 'aptitude' | 'behavioral', responses: Record<string, any>) => {
    if (!sessionData?.session_token) return

    try {
      await djangoClient.profiler.completeSection(sessionData.session_token, section, responses)
      
      if (section === 'aptitude') {
        setCurrentSection('behavioral')
      } else {
        // Complete profiling
        const result = await djangoClient.profiler.complete(sessionData.session_token)
        setSessionData({ ...sessionData, result: result.result })
        setCurrentSection('results')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete section')
    }
  }

  const handleComplete = () => {
    router.push('/dashboard/student')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-white text-xl">Loading profiling...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-och-midnight">
      {currentSection === 'welcome' && (
        <ProfilingWelcome onStart={handleStart} />
      )}
      {currentSection === 'instructions' && (
        <ProfilingInstructions onContinue={handleContinue} />
      )}
      {(currentSection === 'aptitude' || currentSection === 'behavioral') && sessionData && (
        <ProfilingAssessment
          sessionToken={sessionData.session_token}
          sessionId={sessionData.session_id}
          section={currentSection}
          questions={
            currentSection === 'aptitude'
              ? sessionData.aptitude_questions || []
              : sessionData.behavioral_questions || []
          }
          onComplete={(responses) => handleSectionComplete(currentSection, responses)}
        />
      )}
      {currentSection === 'results' && sessionData?.result && (
        <ProfilingResults
          result={sessionData.result}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}



