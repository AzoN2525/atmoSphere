import type { AlertSeverity, IndicatorType } from '@/types/area'

export type AlertStatus = 'ACTIVE' | 'RESOLVED'

export interface AlertFromAPI {
  id: number
  areaId: number
  areaName: string
  indicatorType: IndicatorType
  measuredValue: number | null
  thresholdValue: number | null
  unit: string | null
  severity: AlertSeverity | null
  status: AlertStatus
  triggeredAt: string | null
  resolvedAt: string | null
}

export interface AlertThresholdFromAPI {
  id: number
  areaId: number
  areaName: string
  indicatorType: IndicatorType
  thresholdValue: number
  unit: string | null
}
