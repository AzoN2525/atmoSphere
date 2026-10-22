import { useCallback, useEffect, useState } from 'react'
import { getCombinedHistory } from '@/services/HistoricalDataService'
import type {
  AggregationPeriod,
  CombinedHistoricalResponseFromAPI,
} from '@/types/dashboard'

interface UseHistoricalAnalysisOptions {
  areaId: number | null
  from: string
  to: string
  aggregation: AggregationPeriod
}

export function useHistoricalAnalysis({
  areaId,
  from,
  to,
  aggregation,
}: UseHistoricalAnalysisOptions) {
  const [history, setHistory] =
    useState<CombinedHistoricalResponseFromAPI | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (areaId === null) return

    setIsLoading(true)

    try {
      const data = await getCombinedHistory(areaId, { from, to, aggregation })
      setHistory(data)
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load historical data'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [areaId, from, to, aggregation])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { history, isLoading, error, refresh }
}
