'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { programsClient, type Cohort, type MentorAssignment, type Track } from '@/services/programsClient'

/**
 * Resolve mentor -> (cohorts, tracks) by scanning cohorts and checking cohort mentors.
 *
 * This is not the most efficient approach, but works with the current backend without
 * needing new endpoints. We can replace later with a dedicated /mentor/assignments endpoint.
 */
export function useMentorAssignedTracks(mentorId: string | undefined) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!mentorId) return
    setIsLoading(true)
    setError(null)
    try {
      // Fetch cohorts and tracks; then filter cohorts where mentor has an active assignment.
      const [{ results: allCohorts }, allTracks] = await Promise.all([
        programsClient.getCohorts({ page: 1, pageSize: 500 }),
        programsClient.getTracks(),
      ])

      const assignedCohorts: Cohort[] = []
      for (const cohort of allCohorts) {
        try {
          const mentors = await programsClient.getCohortMentors(String(cohort.id))
          const hasAssignment = (mentors as MentorAssignment[]).some(
            (a) => String(a.mentor) === String(mentorId) && a.active
          )
          if (hasAssignment) assignedCohorts.push(cohort)
        } catch {
          // ignore per-cohort failure
        }
      }

      const assignedTrackIds = new Set(assignedCohorts.map((c) => String(c.track)))
      const assignedTracks = allTracks.filter((t) => assignedTrackIds.has(String(t.id)))

      setCohorts(assignedCohorts)
      setTracks(assignedTracks)
    } catch (err: any) {
      setError(err?.message || 'Failed to load mentor assigned tracks')
      setCohorts([])
      setTracks([])
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    load()
  }, [load])

  const trackIds = useMemo(() => tracks.map((t) => String(t.id)), [tracks])
  const trackKeys = useMemo(() => tracks.map((t: any) => String(t.key)).filter(Boolean), [tracks])

  return { tracks, cohorts, trackIds, trackKeys, isLoading, error, reload: load }
}










