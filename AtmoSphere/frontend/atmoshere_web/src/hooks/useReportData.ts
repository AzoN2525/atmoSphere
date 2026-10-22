import { useEffect, useState } from 'react'
import { getKpis } from '@/services/KpiService'
import {
  getExpandedAirQualityHistory,
  getExpandedNoiseHistory,
  getExpandedTrafficHistory,
} from '@/services/HistoricalDataService'
import type {
  ExpandedAirQualityHistoryFromAPI,
  ExpandedNoiseHistoryFromAPI,
  ExpandedTrafficHistoryFromAPI,
  KpiResponseFromAPI,
} from '@/types/dashboard'

interface UseReportDataOptions {
  areaId: number | null
  from: string
  to: string
}

export function useReportData({ areaId, from, to }: UseReportDataOptions) {
  const [kpis, setKpis] = useState<KpiResponseFromAPI | null>(null)
  const [kpisLoading, setKpisLoading] = useState(false)
  const [expandedTraffic, setExpandedTraffic] = useState<ExpandedTrafficHistoryFromAPI | null>(null)
  const [expandedNoise, setExpandedNoise] = useState<ExpandedNoiseHistoryFromAPI | null>(null)
  const [expandedAir, setExpandedAir] = useState<ExpandedAirQualityHistoryFromAPI | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  useEffect(() => {
    if (areaId === null) return

    let cancelled = false
    const params = { from, to }

    setKpisLoading(true)
    getKpis({ areaId, startDate: from, endDate: to })
      .then((result) => { if (!cancelled) setKpis(result) })
      .catch((err) => console.error('Failed to load KPIs for report:', err))
      .finally(() => { if (!cancelled) setKpisLoading(false) })

    setExpandedLoading(true)
    Promise.all([
      getExpandedTrafficHistory(areaId, params),
      getExpandedNoiseHistory(areaId, params),
      getExpandedAirQualityHistory(areaId, params),
    ])
      .then(([traffic, noise, air]) => {
        if (!cancelled) {
          setExpandedTraffic(traffic)
          setExpandedNoise(noise)
          setExpandedAir(air)
        }
      })
      .catch((err) => console.error('Failed to load expanded data for report:', err))
      .finally(() => { if (!cancelled) setExpandedLoading(false) })

    return () => { cancelled = true }
  }, [areaId, from, to])

  const avgAqi = kpis?.averageAirQualityByArea[0]?.averageAqi ?? null
  const avgDensity = kpis?.averageTrafficDensityByArea[0]?.averageDensity ?? null
  const avgLeq = kpis?.averageNoiseLevelByArea[0]?.averageLeq ?? null
  const hotspotCount = kpis?.hotspotsDetected.length ?? 0

  return {
    kpisLoading,
    avgAqi,
    avgDensity,
    avgLeq,
    hotspotCount,
    expandedAir,
    expandedTraffic,
    expandedNoise,
    expandedLoading,
  }
}
