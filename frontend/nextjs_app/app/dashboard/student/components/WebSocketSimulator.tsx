'use client'

import { useEffect } from 'react'
import { useDashboardStore } from '../lib/store/dashboardStore'
import { useRealtimeUpdates } from '../lib/hooks/useRealtimeUpdates'

export function WebSocketSimulator() {
  const { updatePoints, updateReadiness } = useDashboardStore()
  
  useRealtimeUpdates()

  useEffect(() => {
    const interval = setInterval(() => {
      updatePoints(1)
    }, 30000)

    return () => clearInterval(interval)
  }, [updatePoints])

  useEffect(() => {
    const interval = setInterval(() => {
      const shouldUpdate = Math.random() > 0.7
      if (shouldUpdate) {
        const delta = Math.random() > 0.5 ? 1 : -1
        updateReadiness(delta)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [updateReadiness])

  return null
}

