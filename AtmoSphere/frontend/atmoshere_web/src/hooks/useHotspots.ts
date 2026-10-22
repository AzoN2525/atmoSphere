import { useCallback, useEffect, useMemo, useState } from 'react'
import { getHotspots } from '@/services/HotspotService'
import type { HotspotFromAPI, IndicatorType } from '@/types/area'

interface UseHotspotsOptions {
  enabledIndicators?: IndicatorType[]
  from?: string
  to?: string
  refreshIntervalMs?: number
}

export function useHotspots({
  enabledIndicators,
  from,
  to,
  refreshIntervalMs = 15000,
}: UseHotspotsOptions = {}) {
  const [hotspots, setHotspots] = useState<HotspotFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const enabledIndicatorKey = useMemo(
    () => [...(enabledIndicators ?? [])].sort().join(','),
    [enabledIndicators],
  )

  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await getHotspots({ from, to })
      setHotspots(filterHotspotsByIndicators(data, enabledIndicators))
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load hotspots'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [enabledIndicatorKey, enabledIndicators, from, to])

  useEffect(() => {
    void refresh()

    if (refreshIntervalMs <= 0) return

    const intervalId = window.setInterval(() => {
      void refresh()
    }, refreshIntervalMs)

    return () => window.clearInterval(intervalId)
  }, [refresh, refreshIntervalMs])

  return {
    hotspots,
    isLoading,
    error,
    refresh,
  }
}

function filterHotspotsByIndicators(
  hotspots: HotspotFromAPI[],
  enabledIndicators?: IndicatorType[],
) {
  if (!enabledIndicators || enabledIndicators.length === 0) return []

  const enabledSet = new Set(enabledIndicators)

  return hotspots.flatMap((hotspot) => {
    const indicators = hotspot.indicators.filter((indicator) =>
      enabledSet.has(indicator.indicatorType),
    )

    if (indicators.length === 0) return []

    return [
      {
        ...hotspot,
        triggeredIndicatorCount: indicators.length,
        indicators,
      },
    ]
  })
}
