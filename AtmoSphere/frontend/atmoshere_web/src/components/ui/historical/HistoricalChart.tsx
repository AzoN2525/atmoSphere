import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Car, Layers3, RefreshCw, Volume2, Wind } from 'lucide-react'
import { formatAxisLabel, formatTooltipLabel } from './historical-utils'
import type { AggregationPeriod } from '@/types/dashboard'
import type { CombinedHistoricalDataPointFromAPI } from '@/types/dashboard'
import type { ComponentType, SVGProps } from 'react'

type IndicatorKey = 'air' | 'traffic' | 'noise'

interface IndicatorConfig {
  label: string
  dataKey: keyof CombinedHistoricalDataPointFromAPI
  stroke: string
  fill: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

const INDICATORS: Record<IndicatorKey, IndicatorConfig> = {
  air: {
    label: 'Air Quality',
    dataKey: 'airQualityIndex',
    stroke: '#0f766e',
    fill: '#ccfbf1',
    Icon: Wind,
  },
  traffic: {
    label: 'Traffic Density',
    dataKey: 'trafficDensityK',
    stroke: '#334155',
    fill: '#f1f5f9',
    Icon: Car,
  },
  noise: {
    label: 'Noise Level',
    dataKey: 'noiseLeq',
    stroke: '#e11d48',
    fill: '#fff1f2',
    Icon: Volume2,
  },
}

const INDICATOR_ENTRIES = Object.entries(INDICATORS) as [IndicatorKey, IndicatorConfig][]

function toggleIndicator(prev: Set<IndicatorKey>, key: IndicatorKey): Set<IndicatorKey> {
  const next = new Set(prev)
  if (next.has(key) && next.size > 1) next.delete(key)
  else next.add(key)
  return next
}

interface ChartHeaderProps {
  areaName: string
  aggregation: AggregationPeriod
  onAggregationChange: (agg: AggregationPeriod) => void
}

function ChartHeader({ areaName, aggregation, onAggregationChange }: ChartHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="min-w-0 truncate text-base font-extrabold text-slate-800">
        Environmental Indicators in {areaName}
      </h3>
      <label className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <Layers3 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Granularity</span>
        <select
          value={aggregation}
          onChange={(e) => onAggregationChange(e.target.value as AggregationPeriod)}
          className="bg-transparent hover:cursor-pointer text-xs font-bold text-slate-700 outline-none"
        >
          <option value="HOURLY">Hourly</option>
          <option value="DAILY">Daily</option>
          <option value="MONTHLY">Monthly</option>
        </select>
      </label>
    </div>
  )
}

interface IndicatorToggleProps {
  config: IndicatorConfig
  isActive: boolean
  onToggle: () => void
}

function IndicatorToggle({ config, isActive, onToggle }: IndicatorToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={isActive ? { backgroundColor: config.stroke, borderColor: config.stroke } : {}}
      className={`inline-flex hover:cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition active:scale-95 ${
        isActive
          ? 'text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <config.Icon className="size-4" aria-hidden="true" />
      {config.label}
    </button>
  )
}

interface HistoricalChartProps {
  data: CombinedHistoricalDataPointFromAPI[]
  areaName: string
  aggregation: AggregationPeriod
  onAggregationChange: (agg: AggregationPeriod) => void
  isLoading: boolean
}

export function HistoricalChart({
  data,
  areaName,
  aggregation,
  onAggregationChange,
  isLoading,
}: HistoricalChartProps) {
  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(
    () => new Set<IndicatorKey>(['air', 'traffic', 'noise']),
  )

  const handleToggle = (key: IndicatorKey) =>
    setActiveIndicators((prev) => toggleIndicator(prev, key))

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <ChartHeader
        areaName={areaName}
        aggregation={aggregation}
        onAggregationChange={onAggregationChange}
      />

      {isLoading ? (
        <ChartPlaceholder>
          <RefreshCw className="size-5 animate-spin text-slate-300" />
        </ChartPlaceholder>
      ) : data.length < 2 ? (
        <ChartPlaceholder>
          <span className="text-sm font-semibold text-slate-400">
            No historical data for this period
          </span>
        </ChartPlaceholder>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(v) => formatAxisLabel(String(v), aggregation)}
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
              {INDICATOR_ENTRIES.map(([key, config]) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.label}
                  stroke={config.stroke}
                  fill={config.fill}
                  strokeWidth={2.5}
                  hide={!activeIndicators.has(key)}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {INDICATOR_ENTRIES.map(([key, config]) => (
          <IndicatorToggle
            key={key}
            config={config}
            isActive={activeIndicators.has(key)}
            onToggle={() => handleToggle(key)}
          />
        ))}
      </div>
    </div>
  )
}

function ChartPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50">
      {children}
    </div>
  )
}
