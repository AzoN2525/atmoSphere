import { useCallback, useEffect, useState } from 'react'
import { getCombinedHistory } from '@/services/HistoricalDataService'
import type { AggregationPeriod, CombinedHistoricalDataPointFromAPI } from '@/types/dashboard'
import type { AreaFromAPI } from '@/types/area'

export interface AreaComparisonPoint {
  areaId: number
  areaName: string
  avgAirQuality: number | null
  avgTrafficDensity: number | null
  avgNoiseLevel: number | null
}

function calcAvg(
  pts: CombinedHistoricalDataPointFromAPI[],
  key: 'airQualityIndex' | 'trafficDensityK' | 'noiseLeq',
): number | null {
  const vals = pts.map((p) => p[key]).filter((v): v is number => v != null)
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export function toggleArea(prev: number[], id: number, maxAreas: number): number[] {
  if (prev.includes(id)) return prev.filter((x) => x !== id)
  if (prev.length >= maxAreas) return prev
  return [...prev, id]
}

interface UseAreaComparisonOptions {
  selectedAreaIds: number[]
  areas: AreaFromAPI[]
  from: string
  to: string
  isCustomRangeValid: boolean
  aggregation: AggregationPeriod
}

export function useAreaComparison({
  selectedAreaIds,
  areas,
  from,
  to,
  isCustomRangeValid,
  aggregation,
}: UseAreaComparisonOptions) {
  const [comparisonData, setComparisonData] = useState<AreaComparisonPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (selectedAreaIds.length < 2 || !from || !to || !isCustomRangeValid) {
      setComparisonData([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const results = await Promise.all(
        selectedAreaIds.map((id) =>
          getCombinedHistory(id, { from, to, aggregation }),
        ),
      )

      setComparisonData(
        results.map((result, i) => {
          const areaId = selectedAreaIds[i]
          const pts = result?.data ?? []
          return {
            areaId,
            areaName: areas.find((a) => a.id === areaId)?.name ?? `Area ${areaId}`,
            avgAirQuality: calcAvg(pts, 'airQualityIndex'),
            avgTrafficDensity: calcAvg(pts, 'trafficDensityK'),
            avgNoiseLevel: calcAvg(pts, 'noiseLeq'),
          }
        }),
      )
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load comparison data'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [selectedAreaIds, areas, from, to, isCustomRangeValid, aggregation])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { comparisonData, isLoading, error, refresh }
}
