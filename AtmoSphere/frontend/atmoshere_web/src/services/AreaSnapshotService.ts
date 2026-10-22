import { apiClient, isApiRequestError } from '@/lib/api-client'
import type {
  AirQualityFromAPI,
  AreaSnapshotFromAPI,
  NoiseFromAPI,
  TrafficFromAPI,
} from '@/types/area'

export const getAllAreaSnapshots = async (): Promise<
  AreaSnapshotFromAPI[]
> => {
  try {
    return (await apiClient.get<AreaSnapshotFromAPI[]>('/areas/snapshots')) ?? []
  } catch (error) {
    console.error('Error fetching area snapshots:', error)
    throw error
  }
}

export const getHistoricalAreaSnapshots = async (params: {
  from: string
  to: string
  aggregation?: 'HOURLY' | 'DAILY' | 'MONTHLY'
}): Promise<AreaSnapshotFromAPI[]> => {
  try {
    const searchParams = new URLSearchParams()
    searchParams.set('from', params.from)
    searchParams.set('to', params.to)
    searchParams.set('aggregation', params.aggregation ?? 'DAILY')

    return (
      (await apiClient.get<AreaSnapshotFromAPI[]>(
        `/areas/snapshots/history?${searchParams.toString()}`,
      )) ?? []
    )
  } catch (error) {
    console.error('Error fetching historical area snapshots:', error)
    throw error
  }
}

export const getAreaSnapshot = async (
  areaId: number,
): Promise<AreaSnapshotFromAPI | null> => {
  try {
    return await apiClient.get<AreaSnapshotFromAPI>(
      `/areas/snapshots/${areaId}`,
    )
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error fetching area snapshot:', error)
    throw error
  }
}

export const refreshAreaSnapshot = async (
  areaId: number,
): Promise<AreaSnapshotFromAPI | null> => {
  try {
    return await apiClient.put<AreaSnapshotFromAPI>(
      `/areas/snapshots/${areaId}/refresh`,
    )
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error refreshing area snapshot:', error)
    throw error
  }
}

export const getAreaAirQuality = async (
  areaId: number,
): Promise<AirQualityFromAPI | null> => {
  try {
    return await apiClient.get<AirQualityFromAPI>(
      `/areas/snapshots/${areaId}/air-quality`,
    )
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error fetching area air quality:', error)
    throw error
  }
}

export const getAreaNoise = async (
  areaId: number,
): Promise<NoiseFromAPI | null> => {
  try {
    return await apiClient.get<NoiseFromAPI>(
      `/areas/snapshots/${areaId}/noise`,
    )
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error fetching area noise:', error)
    throw error
  }
}

export const getAreaTraffic = async (
  areaId: number,
): Promise<TrafficFromAPI | null> => {
  try {
    return await apiClient.get<TrafficFromAPI>(
      `/areas/snapshots/${areaId}/traffic`,
    )
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error fetching area traffic:', error)
    throw error
  }
}
