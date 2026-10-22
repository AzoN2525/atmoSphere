import { apiClient } from '@/lib/api-client'
import type { HotspotFromAPI, IndicatorType } from '@/types/area'
import type {
  AggregationPeriod,
  HotspotFrequencyResponseFromAPI,
} from '@/types/dashboard'

export interface HotspotQueryParams {
  areaId?: number
  indicatorType?: IndicatorType
  from?: string
  to?: string
}

export const getHotspots = async (
  params: HotspotQueryParams = {},
): Promise<HotspotFromAPI[]> => {
  const searchParams = new URLSearchParams()

  if (params.areaId !== undefined) {
    searchParams.set('areaId', String(params.areaId))
  }

  if (params.indicatorType) {
    searchParams.set('indicatorType', params.indicatorType)
  }

  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)

  const queryString = searchParams.toString()
  const endpoint = queryString ? `/hotspots?${queryString}` : '/hotspots'

  try {
    return (await apiClient.get<HotspotFromAPI[]>(endpoint)) ?? []
  } catch (error) {
    console.error('Error fetching hotspots:', error)
    throw error
  }
}

export interface HotspotFrequencyQueryParams {
  areaId?: number
  from?: string
  to?: string
  aggregation?: AggregationPeriod
}

export const getHotspotFrequency = async (
  params: HotspotFrequencyQueryParams = {},
): Promise<HotspotFrequencyResponseFromAPI | null> => {
  const searchParams = new URLSearchParams()

  if (params.areaId !== undefined) {
    searchParams.set('areaId', String(params.areaId))
  }
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)
  if (params.aggregation) searchParams.set('aggregation', params.aggregation)

  const queryString = searchParams.toString()
  const endpoint = queryString
    ? `/hotspots/frequency?${queryString}`
    : '/hotspots/frequency'

  try {
    return await apiClient.get<HotspotFrequencyResponseFromAPI>(endpoint)
  } catch (error) {
    console.error('Error fetching hotspot frequency:', error)
    throw error
  }
}
