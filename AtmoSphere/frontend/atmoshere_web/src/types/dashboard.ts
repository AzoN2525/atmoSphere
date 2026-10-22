import type { HotspotFromAPI } from '@/types/area'

export type AggregationPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY'
export type DashboardRangePreset =
  | 'CURRENT'
  | 'LAST_24_HOURS'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'

export interface AreaAirQualityKpiFromAPI {
  areaId: number
  areaName: string
  averageAqi: number
}

export interface AreaTrafficDensityKpiFromAPI {
  areaId: number
  areaName: string
  averageDensity: number
}

export interface AreaNoiseLevelKpiFromAPI {
  areaId: number
  areaName: string
  averageLeq: number
}

export interface KpiResponseFromAPI {
  startDate: string
  endDate: string
  averageAirQualityByArea: AreaAirQualityKpiFromAPI[]
  averageTrafficDensityByArea: AreaTrafficDensityKpiFromAPI[]
  averageNoiseLevelByArea: AreaNoiseLevelKpiFromAPI[]
  hotspotsDetected: HotspotFromAPI[]
}

export interface CombinedHistoricalDataPointFromAPI {
  timestamp: string
  airQualityIndex: number | null
  noiseLeq: number | null
  trafficDensityK: number | null
}

export interface CombinedHistoricalResponseFromAPI {
  areaId: number
  areaName: string
  aggregation: AggregationPeriod
  from: string
  to: string
  data: CombinedHistoricalDataPointFromAPI[]
}

export interface TrafficDataPointFromAPI {
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

export interface ExpandedTrafficHistoryFromAPI {
  areaId: number
  areaName: string
  from: string
  to: string
  data: TrafficDataPointFromAPI[]
}

export interface NoiseDataPointFromAPI {
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

export interface ExpandedNoiseHistoryFromAPI {
  areaId: number
  areaName: string
  from: string
  to: string
  data: NoiseDataPointFromAPI[]
}

export interface AirQualityDataPointFromAPI {
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

export interface ExpandedAirQualityHistoryFromAPI {
  areaId: number
  areaName: string
  from: string
  to: string
  data: AirQualityDataPointFromAPI[]
}

export interface HotspotFrequencyPointFromAPI {
  timestamp: string
  hotspotCount: number
  airQualityCount: number
  noiseCount: number
  trafficCount: number
}

export interface HotspotFrequencyResponseFromAPI {
  areaId: number | null
  aggregation: AggregationPeriod
  from: string
  to: string
  data: HotspotFrequencyPointFromAPI[]
}
