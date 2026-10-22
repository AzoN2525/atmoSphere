import { apiClient } from '@/lib/api-client'
import type {
  AggregationPeriod,
  CombinedHistoricalResponseFromAPI,
  ExpandedAirQualityHistoryFromAPI,
  ExpandedNoiseHistoryFromAPI,
  ExpandedTrafficHistoryFromAPI,
} from '@/types/dashboard'

export interface CombinedHistoryQueryParams {
  from?: string
  to?: string
  aggregation?: AggregationPeriod
}

export interface ExpandedHistoryQueryParams {
  from?: string
  to?: string
}

function buildEndpoint(base: string, params: object): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  }
  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

async function getExpandedHistory<T>(
  areaId: number,
  indicator: string,
  params: ExpandedHistoryQueryParams = {},
): Promise<T | null> {
  return apiClient.get<T>(
    buildEndpoint(`/areas/${areaId}/history/${indicator}/expanded`, params),
  )
}

export const getCombinedHistory = async (
  areaId: number,
  params: CombinedHistoryQueryParams = {},
): Promise<CombinedHistoricalResponseFromAPI | null> =>
  apiClient.get<CombinedHistoricalResponseFromAPI>(
    buildEndpoint(`/areas/${areaId}/history`, params),
  )

export const getExpandedTrafficHistory = async (
  areaId: number,
  params: ExpandedHistoryQueryParams = {},
): Promise<ExpandedTrafficHistoryFromAPI | null> =>
  getExpandedHistory<ExpandedTrafficHistoryFromAPI>(areaId, 'traffic', params)

export const getExpandedNoiseHistory = async (
  areaId: number,
  params: ExpandedHistoryQueryParams = {},
): Promise<ExpandedNoiseHistoryFromAPI | null> =>
  getExpandedHistory<ExpandedNoiseHistoryFromAPI>(areaId, 'noise', params)

export const getExpandedAirQualityHistory = async (
  areaId: number,
  params: ExpandedHistoryQueryParams = {},
): Promise<ExpandedAirQualityHistoryFromAPI | null> =>
  getExpandedHistory<ExpandedAirQualityHistoryFromAPI>(areaId, 'air-quality', params)
