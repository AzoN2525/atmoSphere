import { useEffect, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  Car,
  Download,
  Printer,
  Volume2,
  Wind,
  X,
} from 'lucide-react'
import { useReportData } from '@/hooks/useReportData'
import { exportHistoricalCsv } from './exportCsv'
import { formatAxisLabel, formatTooltipLabel } from './historical-utils'
import type {
  AggregationPeriod,
  AirQualityDataPointFromAPI,
  CombinedHistoricalDataPointFromAPI,
  NoiseDataPointFromAPI,
  TrafficDataPointFromAPI,
} from '@/types/dashboard'

// ─── stats helpers ────────────────────────────────────────────────────────────

function nums(arr: (number | null | undefined)[]): number[] {
  return arr.filter((v): v is number => v != null)
}

function stat(values: number[]): { avg: number; min: number; max: number } | null {
  if (values.length === 0) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return {
    avg: Math.round(avg * 10) / 10,
    min: Math.round(Math.min(...values) * 10) / 10,
    max: Math.round(Math.max(...values) * 10) / 10,
  }
}

function fmt(v: number | null | undefined, decimals = 1): string {
  return v != null ? v.toFixed(decimals) : '—'
}

// ─── types ────────────────────────────────────────────────────────────────────

interface IndicatorMeta {
  label: string
  unit: string
  dataKey: keyof CombinedHistoricalDataPointFromAPI
  stroke: string
  fill: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const INDICATORS: IndicatorMeta[] = [
  {
    label: 'Air Quality',
    unit: 'AQI',
    dataKey: 'airQualityIndex',
    stroke: '#0f766e',
    fill: '#ccfbf1',
    Icon: Wind,
  },
  {
    label: 'Traffic Density',
    unit: '',
    dataKey: 'trafficDensityK',
    stroke: '#334155',
    fill: '#f1f5f9',
    Icon: Car,
  },
  {
    label: 'Noise Level',
    unit: 'dB',
    dataKey: 'noiseLeq',
    stroke: '#e11d48',
    fill: '#fff1f2',
    Icon: Volume2,
  },
]

interface ReportModalProps {
  areaId: number | null
  areaName: string
  from: string
  to: string
  aggregation: AggregationPeriod
  data: CombinedHistoricalDataPointFromAPI[]
  onClose: () => void
}

// ─── main component ───────────────────────────────────────────────────────────

export function ReportModal({
  areaId,
  areaName,
  from,
  to,
  aggregation,
  data,
  onClose,
}: ReportModalProps) {
  const { kpisLoading, avgAqi, avgDensity, avgLeq, hotspotCount, expandedAir, expandedTraffic, expandedNoise, expandedLoading } =
    useReportData({ areaId, from, to })

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'report-print-style'
    style.textContent = `
      @media print {
        body > * { visibility: hidden; }
        #report-print-root, #report-print-root * { visibility: visible; }

        /* position: fixed repete o elemento em cada página — usar absolute evita isso */
        .report-modal-outer {
          position: absolute !important;
          inset: 0 !important;
          overflow: visible !important;
          background: white !important;
        }
        .report-modal-scroll {
          overflow: visible !important;
          flex: none !important;
          padding: 0 !important;
        }
        #report-print-root {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          overflow: visible;
          background: white;
          padding: 2rem;
          box-shadow: none;
          border-radius: 0;
          max-width: 100%;
        }
        .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.getElementById('report-print-style')?.remove()
    }
  }, [])

  const generatedAt = useMemo(
    () =>
      new Date().toLocaleString('en-GB', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
    [],
  )

  return (
    <div className="report-modal-outer fixed inset-0 z-50 flex flex-col bg-slate-100">
      {/* Action bar */}
      <div className="no-print flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <span className="text-sm font-semibold text-slate-700">
          Environmental Report —{' '}
          <span className="text-primary">{areaName}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportHistoricalCsv({
                areaName,
                from,
                to,
                aggregation,
                data,
                expandedAir: expandedAir?.data,
                expandedNoise: expandedNoise?.data,
                expandedTraffic: expandedTraffic?.data,
              })
            }
            disabled={data.length === 0 || expandedLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
          >
            <Printer className="size-4" aria-hidden="true" />
            Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <X className="size-4" aria-hidden="true" />
            Close
          </button>
        </div>
      </div>

      {/* Scrollable report body */}
      <div className="report-modal-scroll flex-1 overflow-y-auto px-4 py-8">
        <div
          id="report-print-root"
          className="mx-auto max-w-4xl space-y-8 rounded-2xl bg-white p-8 shadow-sm"
        >
          {/* ── Header ── */}
          <div className="border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Environmental Report
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              {areaName}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
              <span>
                Period:{' '}
                <strong className="text-slate-700">
                  {from} — {to}
                </strong>
              </span>
              <span>
                Aggregation:{' '}
                <strong className="text-slate-700">{aggregation}</strong>
              </span>
              <span>
                Generated:{' '}
                <strong className="text-slate-700">{generatedAt}</strong>
              </span>
              <span>
                Records:{' '}
                <strong className="text-slate-700">{data.length}</strong>
              </span>
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div>
            <SectionTitle>Summary Metrics</SectionTitle>
            {kpisLoading ? (
              <LoadingPlaceholder />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={<Wind className="size-5 text-teal-600" />}
                  iconBg="bg-teal-50"
                  label="Avg Air Quality"
                  value={avgAqi}
                  unit="AQI"
                  area={areaName}
                />
                <KpiCard
                  icon={<Car className="size-5 text-slate-600" />}
                  iconBg="bg-slate-100"
                  label="Avg Traffic Density"
                  value={avgDensity}
                  unit="veh./km"
                  area={areaName}
                />
                <KpiCard
                  icon={<Volume2 className="size-5 text-rose-500" />}
                  iconBg="bg-rose-50"
                  label="Avg Noise Level"
                  value={avgLeq}
                  unit="dB"
                  area={areaName}
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center rounded-xl bg-amber-50 p-2">
                      <AlertTriangle className="size-5 text-amber-500" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      Hotspots Detected
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold text-slate-900">
                    {hotspotCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{areaName}</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Historical trend chart ── */}
          <div>
            <SectionTitle>Historical Trend</SectionTitle>
            {data.length < 2 ? (
              <div className="flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
                Not enough data to render the chart.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) =>
                        formatAxisLabel(String(v), aggregation)
                      }
                      minTickGap={24}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(v) => formatTooltipLabel(String(v))}
                      formatter={(value, name) => [
                        value != null ? Number(value).toFixed(1) : '—',
                        String(name),
                      ]}
                    />
                    {INDICATORS.map((ind) => (
                      <Area
                        key={ind.dataKey}
                        type="monotone"
                        dataKey={ind.dataKey}
                        name={ind.label}
                        stroke={ind.stroke}
                        fill={ind.fill}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── Air Quality breakdown ── */}
          <div>
            <SectionTitle icon={<Wind className="size-4 text-teal-600" />}>
              Air Quality — Indicator Breakdown
            </SectionTitle>
            {expandedLoading ? (
              <LoadingPlaceholder />
            ) : (
              <AirQualityBreakdown data={expandedAir?.data ?? []} />
            )}
          </div>

          {/* ── Traffic breakdown ── */}
          <div>
            <SectionTitle icon={<Car className="size-4 text-slate-600" />}>
              Traffic — Indicator Breakdown
            </SectionTitle>
            {expandedLoading ? (
              <LoadingPlaceholder />
            ) : (
              <TrafficBreakdown data={expandedTraffic?.data ?? []} />
            )}
          </div>

          {/* ── Noise breakdown ── */}
          <div>
            <SectionTitle icon={<Volume2 className="size-4 text-rose-500" />}>
              Noise — Indicator Breakdown
            </SectionTitle>
            {expandedLoading ? (
              <LoadingPlaceholder />
            ) : (
              <NoiseBreakdown data={expandedNoise?.data ?? []} />
            )}
          </div>

          {/* ── Raw aggregated data table ── */}
          <div>
            <SectionTitle>Aggregated Data ({aggregation.toLowerCase()})</SectionTitle>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Timestamp
                    </th>
                    {INDICATORS.map((ind) => (
                      <th
                        key={ind.dataKey}
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400"
                      >
                        {ind.label}
                        {ind.unit ? ` (${ind.unit})` : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((point) => (
                    <tr
                      key={point.timestamp}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {new Date(point.timestamp).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      {INDICATORS.map((ind) => {
                        const val = point[ind.dataKey]
                        return (
                          <td
                            key={ind.dataKey}
                            className="px-4 py-2.5 text-right text-slate-600"
                          >
                            {typeof val === 'number' ? val.toFixed(1) : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-200 pt-4 text-xs text-slate-400">
            Generated on {generatedAt} · AtmoSphere Environmental Monitoring Platform
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Air Quality breakdown ────────────────────────────────────────────────────

function AirQualityBreakdown({ data }: { data: AirQualityDataPointFromAPI[] }) {
  if (data.length === 0) return <NoDataPlaceholder />

  const aqiStats = stat(nums(data.map((d) => d.europeanAqi)))

  const pollutants: { label: string; key: keyof AirQualityDataPointFromAPI; unit: string }[] = [
    { label: 'PM10', key: 'pm10', unit: 'µg/m³' },
    { label: 'PM2.5', key: 'pm25', unit: 'µg/m³' },
    { label: 'NO₂', key: 'no2', unit: 'µg/m³' },
    { label: 'SO₂', key: 'so2', unit: 'µg/m³' },
    { label: 'O₃', key: 'o3', unit: 'µg/m³' },
    { label: 'CO', key: 'co', unit: 'ppm' },
  ]

  return (
    <div className="space-y-4">
      {/* AQI headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg AQI" value={fmt(aqiStats?.avg, 0)} unit="AQI" color="teal" />
        <StatCard label="Max AQI" value={fmt(aqiStats?.max, 0)} unit="AQI" color="amber" />
        <StatCard label="Min AQI" value={fmt(aqiStats?.min, 0)} unit="AQI" color="slate" />
      </div>

      {/* Pollutant breakdown table */}
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
        Pollutant statistics ({data.length} readings)
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Pollutant</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Unit</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Avg</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Min</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Max</th>
            </tr>
          </thead>
          <tbody>
            {pollutants.map((p) => {
              const s = stat(nums(data.map((d) => d[p.key] as number | null)))
              return (
                <tr key={p.key} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{p.label}</td>
                  <td className="px-4 py-2.5 text-right text-slate-400">{p.unit}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{fmt(s?.avg)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmt(s?.min)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmt(s?.max)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Traffic breakdown ────────────────────────────────────────────────────────

function TrafficBreakdown({ data }: { data: TrafficDataPointFromAPI[] }) {
  if (data.length === 0) return <NoDataPlaceholder />

  const speedStats = stat(nums(data.map((d) => d.avgSpeed)))
  const densityStats = stat(nums(data.map((d) => d.densityK)))

  const totalPassenger = data.reduce((s, d) => s + (d.passengerCarCount ?? 0), 0)
  const totalTrucks = data.reduce((s, d) => s + (d.heavyTruckCount ?? 0), 0)
  const totalMoto = data.reduce((s, d) => s + (d.motorcycleCount ?? 0), 0)
  const totalVehicles = totalPassenger + totalTrucks + totalMoto
  const pct = (n: number) =>
    totalVehicles > 0 ? ((n / totalVehicles) * 100).toFixed(1) + '%' : '—'

  const metrics: { label: string; key: keyof TrafficDataPointFromAPI; unit: string }[] = [
    { label: 'Flow Rate', key: 'flowRateH', unit: 'veh./h' },
    { label: 'Density', key: 'densityK', unit: 'veh./km' },
    { label: 'Avg Speed', key: 'avgSpeed', unit: 'km/h' },
    { label: '85th-pct Speed', key: 'speedPercentile85', unit: 'km/h' },
    { label: 'Lane Occupancy', key: 'laneOccupancyPct', unit: '%' },
    { label: 'Avg Gap', key: 'avgGapSeconds', unit: 's' },
  ]

  return (
    <div className="space-y-4">
      {/* Headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Speed" value={fmt(speedStats?.avg)} unit="km/h" color="slate" />
        <StatCard label="Avg Density" value={fmt(densityStats?.avg)} unit="veh./km" color="slate" />
        <StatCard label="Total Vehicles" value={totalVehicles.toLocaleString()} unit="obs." color="slate" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Metrics stats table */}
        <div>
          <p className="mb-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
            Traffic metrics ({data.length} readings)
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Metric</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Unit</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Avg</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Min</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Max</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const s = stat(nums(data.map((d) => d[m.key] as number | null)))
                  return (
                    <tr key={m.key} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 font-semibold text-slate-700">{m.label}</td>
                      <td className="px-3 py-2 text-right text-slate-400">{m.unit}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{fmt(s?.avg)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{fmt(s?.min)}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{fmt(s?.max)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle distribution */}
        <div>
          <p className="mb-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
            Vehicle classification
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Count</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Share</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-700">Passenger Cars</td>
                  <td className="px-3 py-2 text-right text-slate-700">{totalPassenger.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{pct(totalPassenger)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-700">Heavy Trucks</td>
                  <td className="px-3 py-2 text-right text-slate-700">{totalTrucks.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{pct(totalTrucks)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold text-slate-700">Motorcycles</td>
                  <td className="px-3 py-2 text-right text-slate-700">{totalMoto.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{pct(totalMoto)}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-3 py-2 font-bold text-slate-900">Total</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">{totalVehicles.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Simple visual bar */}
          {totalVehicles > 0 && (
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
              <div
                className="bg-slate-400"
                style={{ width: pct(totalPassenger) }}
                title={`Passenger Cars: ${pct(totalPassenger)}`}
              />
              <div
                className="bg-slate-600"
                style={{ width: pct(totalTrucks) }}
                title={`Heavy Trucks: ${pct(totalTrucks)}`}
              />
              <div
                className="bg-slate-300"
                style={{ width: pct(totalMoto) }}
                title={`Motorcycles: ${pct(totalMoto)}`}
              />
            </div>
          )}
          <div className="mt-1.5 flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-slate-400" /> Cars</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-slate-600" /> Trucks</span>
            <span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-slate-300" /> Moto</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Noise breakdown ──────────────────────────────────────────────────────────

function NoiseBreakdown({ data }: { data: NoiseDataPointFromAPI[] }) {
  if (data.length === 0) return <NoDataPlaceholder />

  const leqStats = stat(nums(data.map((d) => d.leq)))
  const lmaxStats = stat(nums(data.map((d) => d.lmax)))
  const l90Stats = stat(nums(data.map((d) => d.l90)))

  const metrics: { label: string; description: string; key: keyof NoiseDataPointFromAPI }[] = [
    { label: 'Leq', description: 'Equivalent noise level', key: 'leq' },
    { label: 'Lmax', description: 'Peak noise level', key: 'lmax' },
    { label: 'Lmin', description: 'Minimum noise level', key: 'lmin' },
    { label: 'L10', description: 'Exceeded 10% of the time', key: 'l10' },
    { label: 'L90', description: 'Background noise (exceeded 90%)', key: 'l90' },
  ]

  return (
    <div className="space-y-4">
      {/* Headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Leq" value={fmt(leqStats?.avg)} unit="dB" color="rose" />
        <StatCard label="Max Lmax" value={fmt(lmaxStats?.max)} unit="dB" color="amber" />
        <StatCard label="Avg Background (L90)" value={fmt(l90Stats?.avg)} unit="dB" color="slate" />
      </div>

      {/* Percentile stats table */}
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
        Noise level statistics ({data.length} readings)
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Metric</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Avg (dB)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Min (dB)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">Max (dB)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const s = stat(nums(data.map((d) => d[m.key] as number | null)))
              return (
                <tr key={m.key} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{m.label}</td>
                  <td className="px-4 py-2.5 text-slate-400">{m.description}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{fmt(s?.avg)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmt(s?.min)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{fmt(s?.max)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Noise range note */}
      {leqStats && lmaxStats && l90Stats && (
        <p className="text-xs text-slate-400">
          Dynamic range:{' '}
          <strong className="text-slate-600">
            {fmt(l90Stats.avg)} dB (background)
          </strong>{' '}
          to{' '}
          <strong className="text-slate-600">
            {fmt(lmaxStats.max)} dB (peak)
          </strong>
          {' '}· Spread: {fmt((lmaxStats.max ?? 0) - (l90Stats.avg ?? 0))} dB
        </p>
      )}
    </div>
  )
}

// ─── shared primitives ────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-700',
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-50 text-slate-700',
}

function StatCard({
  label,
  value,
  unit,
  color = 'slate',
}: {
  label: string
  value: string
  unit: string
  color?: string
}) {
  const cls = COLOR_MAP[color] ?? COLOR_MAP.slate
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">
        {value}
        <span className="ml-1 text-sm font-semibold opacity-60">{unit}</span>
      </p>
    </div>
  )
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
      {icon}
      {children}
    </h2>
  )
}

function LoadingPlaceholder() {
  return (
    <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
      Loading…
    </div>
  )
}

function NoDataPlaceholder() {
  return (
    <div className="flex h-16 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
      No data available for this period.
    </div>
  )
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  unit,
  area,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number | null
  unit: string
  area: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className={`flex items-center justify-center rounded-xl p-2 ${iconBg}`}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-slate-900">
        {value != null ? value.toFixed(1) : '—'}
        {value != null && unit ? (
          <span className="ml-1 text-sm font-semibold text-slate-400">{unit}</span>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-slate-400">{area}</p>
    </div>
  )
}
