import { apiClient, isApiRequestError } from '@/lib/api-client'
import type { AreaFromAPI } from '@/types/area'

export const getAllAreas = async (): Promise<AreaFromAPI[]> => {
  try {
    return (await apiClient.get<AreaFromAPI[]>('/areas')) ?? []
  } catch (error) {
    console.error('Error fetching areas:', error)
    throw error
  }
}

export const getAreaById = async (
  areaId: number,
): Promise<AreaFromAPI | null> => {
  try {
    return await apiClient.get<AreaFromAPI>(`/areas/${areaId}`)
  } catch (error) {
    if (isApiRequestError(error) && error.status === 404) return null
    console.error('Error fetching area:', error)
    throw error
  }
}
