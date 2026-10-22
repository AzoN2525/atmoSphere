import { useCallback, useEffect, useState } from 'react'
import { getCombinedHistory } from '@/services/HistoricalDataService'
import { getHotspotFrequency } from '@/services/HotspotService'
import { getKpis } from '@/services/KpiService'
import type {
  AggregationPeriod,
  CombinedHistoricalResponseFromAPI,
  HotspotFrequencyResponseFromAPI,
  KpiResponseFromAPI,
} from '@/types/dashboard'

interface UseDashboardDataOptions {
  areaId: number | null
  from: string
  to: string
  aggregation: AggregationPeriod
}

export function useDashboardData({
  areaId,
  from,
  to,
  aggregation,
}: UseDashboardDataOptions) {
  const [kpis, setKpis] = useState<KpiResponseFromAPI | null>(null)
  const [history, setHistory] =
    useState<CombinedHistoricalResponseFromAPI | null>(null)
  const [hotspotFrequency, setHotspotFrequency] =
    useState<HotspotFrequencyResponseFromAPI | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (areaId === null) return

    setIsLoading(true)

    try {
      const [kpiData, historyData, hotspotFrequencyData] = await Promise.all([
        getKpis({ areaId, startDate: from, endDate: to }),
        getCombinedHistory(areaId, { from, to, aggregation }),
        getHotspotFrequency({ areaId, from, to, aggregation }),
      ])

      setKpis(kpiData)
      setHistory(historyData)
      setHotspotFrequency(hotspotFrequencyData)
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load dashboard data'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [aggregation, areaId, from, to])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    kpis,
    history,
    hotspotFrequency,
    isLoading,
    error,
    refresh,
  }
}
