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
      setTracks(Array.isArray(tracksData) ? tracksData : [])
      setReadinessWindow(windowData)
    } catch (err: any) {
      setError(err.message || 'Failed to load profiler data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const changeTrack = useCallback(async (trackId: string) => {
    if (!menteeId) return

    try {
      const result = await profilerClient.updateTrack(menteeId, trackId)
      await loadData() // Refresh data
      return result
    } catch (err: any) {
      throw new Error(err.message || 'Failed to change track')
    }
  }, [menteeId, loadData])

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
    changeTrack,
  }
}
