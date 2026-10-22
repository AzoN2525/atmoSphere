import type {
  AirQualityDataPointFromAPI,
  CombinedHistoricalDataPointFromAPI,
  NoiseDataPointFromAPI,
  TrafficDataPointFromAPI,
} from '@/types/dashboard'

interface ExportOptions {
  areaName: string
  from: string
  to: string
  aggregation: string
  data: CombinedHistoricalDataPointFromAPI[]
  expandedAir?: AirQualityDataPointFromAPI[]
  expandedNoise?: NoiseDataPointFromAPI[]
  expandedTraffic?: TrafficDataPointFromAPI[]
}

export function exportHistoricalCsv({
  areaName,
  from,
  to,
  aggregation,
  data,
  expandedAir = [],
  expandedNoise = [],
  expandedTraffic = [],
}: ExportOptions) {
  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })

  const sections: string[] = []

  // ── File header ──────────────────────────────────────────────────────────────
  sections.push(
    [
      '# Environmental Report',
      `# Area: ${areaName}`,
      `# Period: ${from} — ${to}`,
      `# Aggregation: ${aggregation}`,
      `# Generated: ${generatedAt}`,
    ].join('\n'),
  )

  // ── Section 1: Aggregated combined data ──────────────────────────────────────
  sections.push(
    buildSection(
      'AGGREGATED COMBINED DATA',
      'Timestamp,Air Quality (AQI),Traffic Density (veh/km),Noise Level (dB)',
      data.map((p) =>
        row([p.timestamp, p.airQualityIndex, p.trafficDensityK, p.noiseLeq]),
      ),
    ),
  )

  // ── Section 2: Air quality detail ─────────────────────────────────────────
  if (expandedAir.length > 0) {
    sections.push(
      buildSection(
        'AIR QUALITY — DETAIL',
        'Timestamp,Sensor ID,AQI (European),PM10 (µg/m³),PM2.5 (µg/m³),NO2 (µg/m³),SO2 (µg/m³),O3 (µg/m³),CO (ppm)',
        expandedAir.map((p) =>
          row([
            p.timestamp,
            p.sensorId,
            p.europeanAqi,
            p.pm10,
            p.pm25,
            p.no2,
            p.so2,
            p.o3,
            p.co,
          ]),
        ),
      ),
    )
  }

  // ── Section 3: Traffic detail ──────────────────────────────────────────────
  if (expandedTraffic.length > 0) {
    sections.push(
      buildSection(
        'TRAFFIC — DETAIL',
        'Timestamp,Sensor ID,Flow Rate (veh/h),Density (veh/km),Avg Speed (km/h),Speed 85th pct (km/h),Lane Occupancy (%),Avg Gap (s),Passenger Cars,Heavy Trucks,Motorcycles',
        expandedTraffic.map((p) =>
          row([
            p.timestamp,
            p.sensorId,
            p.flowRateH,
            p.densityK,
            p.avgSpeed,
            p.speedPercentile85,
            p.laneOccupancyPct,
            p.avgGapSeconds,
            p.passengerCarCount,
            p.heavyTruckCount,
            p.motorcycleCount,
          ]),
        ),
      ),
    )
  }

  // ── Section 4: Noise detail ────────────────────────────────────────────────
  if (expandedNoise.length > 0) {
    sections.push(
      buildSection(
        'NOISE — DETAIL',
        'Timestamp,Sensor ID,Leq (dB),Lmax (dB),Lmin (dB),L10 (dB),L90 (dB)',
        expandedNoise.map((p) =>
          row([
            p.timestamp,
            p.sensorId,
            p.leq,
            p.lmax,
            p.lmin,
            p.l10,
            p.l90,
          ]),
        ),
      ),
    )
  }

  const csv = sections.join('\n\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = buildFilename(areaName)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function buildSection(title: string, headers: string, rows: string[]): string {
  return [`# --- ${title} ---`, headers, ...rows].join('\n')
}

function row(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v == null) return ''
      const s = String(v)
      // quote fields that contain commas, quotes, or newlines
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s
    })
    .join(',')
}

function buildFilename(areaName: string) {
  const slug = areaName.toLowerCase().replace(/\s+/g, '-')
  const date = new Date().toISOString().slice(0, 10)
  return `environmental-report-${slug}-${date}.csv`
}
