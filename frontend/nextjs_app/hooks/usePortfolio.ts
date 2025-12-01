'use client'

import { useState, useEffect, useCallback } from 'react'
import { portfolioClient } from '@/services/portfolioClient'
import type { PortfolioItem, PortfolioCounts } from '@/services/types/portfolio'

export function usePortfolio(menteeId: string | undefined) {
  const [latestItem, setLatestItem] = useState<PortfolioItem | null>(null)
  const [counts, setCounts] = useState<PortfolioCounts | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!menteeId) return

    setIsLoading(true)
    setError(null)

    try {
      const [itemData, countsData] = await Promise.all([
        portfolioClient.getLatestItem(menteeId).catch(() => null),
        portfolioClient.getCounts(menteeId),
      ])

      setLatestItem(itemData)
      setCounts(countsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio data')
    } finally {
      setIsLoading(false)
    }
  }, [menteeId])

  const addItem = useCallback(async (data: {
    title: string
    description: string
    skills: string[]
    mission_id?: string
    file?: File
  }) => {
    if (!menteeId) return

    try {
      const item = await portfolioClient.addItem(menteeId, data)
      setLatestItem(item)
      if (counts) {
        setCounts({ ...counts, total_items: counts.total_items + 1 })
      }
      return item
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add portfolio item')
    }
  }, [menteeId, counts])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    latestItem,
    counts,
    isLoading,
    error,
    reload: loadData,
    addItem,
  }
}

