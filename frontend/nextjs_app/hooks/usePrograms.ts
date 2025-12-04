/**
 * React hooks for Programs management
 * Uses useState/useEffect pattern consistent with other hooks in the project
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { programsClient, type Program, type Track, type Cohort, type ProgramRule, type CohortDashboard } from '@/services/programsClient'

// Programs
export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPrograms = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getPrograms()
      setPrograms(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load programs')
      setPrograms([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  return { programs, isLoading, error, reload: loadPrograms }
}

export function useProgram(id: string) {
  const [program, setProgram] = useState<Program | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProgram = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getProgram(id)
      setProgram(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load program')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  return { program, isLoading, error, reload: loadProgram }
}

export function useCreateProgram() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createProgram = useCallback(async (data: Partial<Program>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createProgram(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create program')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createProgram, isLoading, error }
}

export function useUpdateProgram() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProgram = useCallback(async (id: string, data: Partial<Program>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateProgram(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update program')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateProgram, isLoading, error }
}

// Tracks
export function useTracks(programId?: string) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTracks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getTracks(programId)
      setTracks(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load tracks')
      setTracks([])
    } finally {
      setIsLoading(false)
    }
  }, [programId])

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  return { tracks, isLoading, error, reload: loadTracks }
}

export function useCreateTrack() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTrack = useCallback(async (data: Partial<Track>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createTrack(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create track')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createTrack, isLoading, error }
}

// Cohorts
export function useCohorts(trackId?: string, status?: string) {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCohorts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohorts(trackId, status)
      setCohorts(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load cohorts')
      setCohorts([])
    } finally {
      setIsLoading(false)
    }
  }, [trackId, status])

  useEffect(() => {
    loadCohorts()
  }, [loadCohorts])

  return { cohorts, isLoading, error, reload: loadCohorts }
}

export function useCohort(id: string) {
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCohort = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohort(id)
      setCohort(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load cohort')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCohort()
  }, [loadCohort])

  return { cohort, isLoading, error, reload: loadCohort }
}

export function useCohortDashboard(cohortId: string) {
  const [dashboard, setDashboard] = useState<CohortDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!cohortId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getCohortDashboard(cohortId)
      setDashboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [cohortId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return { dashboard: dashboard, isLoading, error, reload: loadDashboard }
}

export function useCreateCohort() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCohort = useCallback(async (data: Partial<Cohort>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createCohort(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createCohort, isLoading, error }
}

export function useUpdateCohort() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCohort = useCallback(async (id: string, data: Partial<Cohort>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateCohort(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update cohort')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateCohort, isLoading, error }
}

// Program Rules
export function useProgramRules(programId?: string) {
  const [rules, setRules] = useState<ProgramRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await programsClient.getProgramRules(programId)
      setRules(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load rules')
    } finally {
      setIsLoading(false)
    }
  }, [programId])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  return { rules, isLoading, error, reload: loadRules }
}

export function useCreateProgramRule() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRule = useCallback(async (data: Partial<ProgramRule>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.createProgramRule(data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to create rule')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { createRule, isLoading, error }
}

export function useUpdateProgramRule() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRule = useCallback(async (id: string, data: Partial<ProgramRule>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await programsClient.updateProgramRule(id, data)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to update rule')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { updateRule, isLoading, error }
}
