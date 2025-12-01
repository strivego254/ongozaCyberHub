'use client'

import { useState, useEffect, useCallback } from 'react'
import { profilerClient } from '@/services/profilerClient'
import type { FutureYou, UserTrack, ReadinessWindow } from '@/services/types/profiler'

export function useProfiler(menteeId: string | undefined) {
  const [futureYou, setFutureYou] = useState<FutureYou | null>(null)
  const [tracks, setTracks] = useState<UserTrack[]>([])
  const [readinessWindow, setReadinessWindow] = useState<ReadinessWindow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [futureYouData, tracksData, windowData] = await Promise.all([
        profilerClient.getFutureYou(menteeId),
        profilerClient.getUserTracks(menteeId),
        profilerClient.getReadinessWindow(menteeId),
      ])

      setFutureYou(futureYouData)
      setTracks(tracksData)
      setReadinessWindow(windowData)
    } catch (err: any) {
      setError(err.message || 'Failed to load profiler data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const updateTrack = useCallback(async (trackId: string) => {
    if (!menteeId) return

    try {
      const updatedTrack = await profilerClient.updateTrack(menteeId, trackId)
      setTracks(prev => {
        const index = prev.findIndex(t => t.id === trackId)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = updatedTrack
          return updated
        }
        return [...prev, updatedTrack]
      })
      return updatedTrack
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update track')
    }
  }, [menteeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    futureYou,
    tracks,
    readinessWindow,
    isLoading,
    error,
    reload: loadData,
    updateTrack,
  }
}

