export type IndicatorStatus =
  | 'GOOD'
  | 'MODERATE'
  | 'BAD'
  | 'VERY_BAD'
  | 'STALE'

export type IndicatorType = 'AIR_QUALITY' | 'NOISE' | 'TRAFFIC'
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH'


export interface AreaFromAPI {
  id: number
  name: string
  geometryGeoJson: string
  latitude: number
  longitude: number
}

export interface AreaSnapshotFromAPI {
  areaId: number
  areaName: string
  geometryGeoJson: string
  latitude: number
  longitude: number
  airQualityIndex: number | null
  noiseIndex: number | null
  trafficIndex: number | null
  overallIndex: number | null
  airStatus: IndicatorStatus | null
  noiseStatus: IndicatorStatus | null
  trafficStatus: IndicatorStatus | null
  overallStatus: IndicatorStatus | null
  updatedAt: string | null
}

export interface HotspotIndicatorFromAPI {
  indicatorType: IndicatorType
  measuredValue: number | null
  thresholdValue: number | null
  exceedanceValue: number | null
  unit: string | null
  severity: AlertSeverity | null
  triggeredAt: string | null
}

export interface HotspotFromAPI {
  areaId: number
  areaName: string
  geometryGeoJson: string
  latitude: number
  longitude: number
  triggeredIndicatorCount: number
  alertCount: number
  maxSeverity: AlertSeverity | null
  lastTriggeredAt: string | null
  indicators: HotspotIndicatorFromAPI[]
}


export interface AirQualityFromAPI {
  id: number
  areaId: number
  sensorId: number
  timestamp: string
  europeanAqi: number | null
  pm10: number | null
  pm25: number | null
  co: number | null
  no2: number | null
  so2: number | null
  o3: number | null
}

export interface NoiseFromAPI {
  id: number
  areaId: number
  sensorId: number
  timestamp: string
  currentValue: number | null
  leq: number | null
  lmax: number | null
  lmin: number | null
  l10: number | null
  l90: number | null
}

export interface TrafficFromAPI {
  id: number
  areaId: number
  sensorId: number
  timestamp: string
  flowTotalCount: number | null
  flowRateH: number | null
  densityK: number | null
  avgSpeed: number | null
  speedPercentile85: number | null
  laneOccupancyPct: number | null
  avgGapSeconds: number | null
  passengerCarCount: number | null
  heavyTruckCount: number | null
  motorcycleCount: number | null
}

export interface FamilyIndicatorBreakdownFromAPI {
  airIndex: number | null
  noiseIndex: number | null
  trafficIndex: number | null
}

export interface FamilyAssessmentFromAPI {
  areaId: number
  areaName: string
  assessment: string
  overallIndex: number | null
  suitablePeriodsPercentage: number | null
  evaluatedPeriods: number | null
  aggregation: string
  from: string | null
  to: string | null
  indicatorBreakdown: FamilyIndicatorBreakdownFromAPI
}
