'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { djangoClient } from '@/services/djangoClient'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'

export default function ProfilingResultsPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/student')
      return
    }

    if (isLoading || !isAuthenticated) return

    const fetchResults = async () => {
      try {
        const data = await djangoClient.profiler.getResults()
        if (data.completed && data.result) {
          setResults(data.result)
        } else {
          setError('No profiling results found. Please complete your profiling assessment.')
        }
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load profiling results')
        setLoading(false)
      }
    }

    fetchResults()
  }, [isAuthenticated, isLoading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center">
        <div className="text-white text-xl">Loading profiling results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-4">
        <Card gradient="defender" className="p-8 max-w-2xl">
          <div className="text-center">
            <div className="text-5xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-white mb-4">No Profiling Results</h1>
            <p className="text-steel-grey mb-6">{error}</p>
            <Button
              onClick={() => router.push('/profiling')}
              variant="defender"
            >
              Start Profiling
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!results) {
    return null
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Profiling Results</h1>
        <p className="text-steel-grey">Your Future-You persona and assessment results</p>
      </motion.div>

      {/* Overall Score */}
      <Card gradient="defender" glow className="p-8 border border-defender-blue/40 rounded-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-cyber-mint mb-2">
            {Math.round(results.overall_score)}%
          </div>
          <div className="text-steel-grey text-lg">Overall Score</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
            <h3 className="text-xl font-semibold text-white mb-4">Aptitude Score</h3>
            <div className="text-4xl font-bold text-defender-blue mb-2">
              {Math.round(results.aptitude_score)}%
            </div>
            <div className="w-full bg-steel-grey/20 rounded-full h-2">
              <motion.div
                className="bg-defender-blue h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${results.aptitude_score}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>

          <div className="bg-och-midnight/50 rounded-lg p-6 border border-steel-grey/30">
            <h3 className="text-xl font-semibold text-white mb-4">Behavioral Score</h3>
            <div className="text-4xl font-bold text-cyber-mint mb-2">
              {Math.round(results.behavioral_score)}%
            </div>
            <div className="w-full bg-steel-grey/20 rounded-full h-2">
              <motion.div
                className="bg-cyber-mint h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${results.behavioral_score}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>💪</span>
            <span>Your Strengths</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {results.strengths.map((strength: string, idx: number) => (
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
        </div>

        {/* Areas for Growth */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <span>📈</span>
            <span>Areas for Growth</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {results.areas_for_growth.map((area: string, idx: number) => (
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
        </div>

        {/* OCH Mapping */}
        {results.och_mapping && (
          <div className="bg-gradient-to-r from-defender-blue/20 to-cyber-mint/20 rounded-lg p-6 border border-defender-blue/30">
            <h3 className="text-xl font-semibold text-white mb-3">
              🎯 Your OCH System Mapping
            </h3>
            <div className="space-y-2 text-steel-grey">
              <div>
                <strong className="text-white">Tier:</strong> {results.och_mapping.tier || 'Tier 0'}
              </div>
              <div>
                <strong className="text-white">Readiness Score:</strong>{' '}
                {Math.round(results.och_mapping.readiness_score || results.overall_score)}%
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}






