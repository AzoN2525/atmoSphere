import { apiClient } from '@/lib/api-client'
import type { AlertFromAPI, AlertThresholdFromAPI } from '@/types/alerts'
import type { IndicatorType } from '@/types/area'

export interface AlertQueryParams {
  areaId?: number
  indicatorType?: IndicatorType
  from?: string
  to?: string
}

export interface SaveAlertThresholdPayload {
  areaId: number
  indicatorType: IndicatorType
  thresholdValue: number
  unit?: string | null
}

export const getAlerts = async (
  params: AlertQueryParams = {},
): Promise<AlertFromAPI[]> => {
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
  const endpoint = queryString ? `/alerts?${queryString}` : '/alerts'

  return (await apiClient.get<AlertFromAPI[]>(endpoint)) ?? []
}

export const getAllThresholds = async (): Promise<AlertThresholdFromAPI[]> =>
  (await apiClient.get<AlertThresholdFromAPI[]>('/alerts/thresholds')) ?? []

export const getThresholdsByArea = async (
  areaId: number,
): Promise<AlertThresholdFromAPI[]> =>
  (await apiClient.get<AlertThresholdFromAPI[]>(`/alerts/thresholds/area/${areaId}`)) ?? []

export const saveThreshold = async (
  payload: SaveAlertThresholdPayload,
): Promise<AlertThresholdFromAPI> =>
  (await apiClient.put<AlertThresholdFromAPI>('/alerts/thresholds', payload)) as AlertThresholdFromAPI
