import { apiClient } from '@/lib/api-client'
import type { KpiResponseFromAPI } from '@/types/dashboard'

export interface KpiQueryParams {
  areaId?: number
  startDate?: string
  endDate?: string
}

export const getKpis = async (
  params: KpiQueryParams = {},
): Promise<KpiResponseFromAPI | null> => {
  const searchParams = new URLSearchParams()

  if (params.areaId !== undefined) {
    searchParams.set('areaId', String(params.areaId))
  }
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)

  const queryString = searchParams.toString()
  const endpoint = queryString ? `/kpis?${queryString}` : '/kpis'

  try {
    return await apiClient.get<KpiResponseFromAPI>(endpoint)
  } catch (error) {
    console.error('Error fetching KPI data:', error)
    throw error
  }
}
