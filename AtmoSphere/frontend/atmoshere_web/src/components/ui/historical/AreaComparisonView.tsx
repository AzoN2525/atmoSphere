import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarDays, Car, MapPin, RefreshCw, Volume2, Wind } from 'lucide-react'
import { useAreaComparison, toggleArea } from '@/hooks/useAreaComparison'
import { useDateRange } from '@/hooks/useDateRange'
import { CustomDateRangePicker } from './CustomDateRangePicker'
import { RANGE_OPTIONS } from './historical-utils'
import type { RangeMode } from './historical-utils'
import type { AreaComparisonPoint } from '@/hooks/useAreaComparison'
import type { AggregationPeriod } from '@/types/dashboard'
import type { AreaFromAPI } from '@/types/area'

type ChartRow = Record<string, string | number | null>

const AREA_PALETTE = [
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

type IndicatorKey = 'air' | 'traffic' | 'noise'

interface IndicatorConfig {
  label: string
  unit: string
  color: string
  dataKey: keyof AreaComparisonPoint
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const INDICATOR_CONFIG: Record<IndicatorKey, IndicatorConfig> = {
  air: {
    label: 'Air Quality',
    unit: 'AQI',
    color: '#0f766e',
    dataKey: 'avgAirQuality',
    Icon: Wind,
  },
  traffic: {
    label: 'Traffic Density',
    unit: 'veh./km',
    color: '#334155',
    dataKey: 'avgTrafficDensity',
    Icon: Car,
  },
  noise: {
    label: 'Noise Level',
    unit: 'dB',
    color: '#e11d48',
    dataKey: 'avgNoiseLevel',
    Icon: Volume2,
  },
}

interface AreaComparisonViewProps {
  areas: AreaFromAPI[]
  areasLoading: boolean
}

export function AreaComparisonView({
  areas,
  areasLoading,
}: AreaComparisonViewProps) {
  const [selectedAreaIds, setSelectedAreaIds] = useState<number[]>([])
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorKey>('air')

  const {
    rangeMode,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    from,
    to,
    isCustomRangeValid,
    handleRangeChange,
    aggregation,
  } = useDateRange()

  const { comparisonData, isLoading, error, refresh } = useAreaComparison({
    selectedAreaIds,
    areas,
    from,
    to,
    isCustomRangeValid,
    aggregation,
  })

  const chartData = useMemo(
    () => buildChartData(comparisonData, selectedIndicator),
    [comparisonData, selectedIndicator],
  )

  const handleToggle = (id: number) =>
    setSelectedAreaIds((prev) => toggleArea(prev, id, AREA_PALETTE.length))

  const needsMoreAreas = selectedAreaIds.length < 2
  const showTable = !needsMoreAreas && comparisonData.length > 0 && !isLoading

  return (
    <div className="space-y-4">
      <AreaSelector
        areas={areas}
        areasLoading={areasLoading}
        selectedAreaIds={selectedAreaIds}
        onToggle={handleToggle}
      />
      <ComparisonFilters
        rangeMode={rangeMode}
        aggregation={aggregation}
        isLoading={isLoading}
        needsMoreAreas={needsMoreAreas}
        isCustomRangeValid={isCustomRangeValid}
        onRangeChange={handleRangeChange}
        onRefresh={() => void refresh()}
      />
      {rangeMode === 'CUSTOM' ? (
        <CustomDateRangePicker
          from={customFrom}
          to={customTo}
          onFromChange={setCustomFrom}
          onToChange={setCustomTo}
        />
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          Unable to load comparison data.
        </div>
      ) : null}
      <ComparisonChart
        chartData={chartData}
        comparisonData={comparisonData}
        isLoading={isLoading}
        needsMoreAreas={needsMoreAreas}
        selectedIndicator={selectedIndicator}
        onIndicatorChange={setSelectedIndicator}
      />
      {showTable ? <ComparisonTable comparisonData={comparisonData} /> : null}
    </div>
  )
}

// ─── AreaSelector ─────────────────────────────────────────────────────────────

interface AreaSelectorProps {
  areas: AreaFromAPI[]
  areasLoading: boolean
  selectedAreaIds: number[]
  onToggle: (id: number) => void
}

function AreaSelector({ areas, areasLoading, selectedAreaIds, onToggle }: AreaSelectorProps) {
  const needsMoreAreas = selectedAreaIds.length < 2
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Select areas to compare
      </p>
      {areasLoading ? (
        <div className="flex h-10 items-center gap-2 text-sm text-slate-400">
          <RefreshCw className="size-4 animate-spin" />
          Loading areas…
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => {
            const colorIdx = selectedAreaIds.indexOf(area.id)
            const isSelected = colorIdx !== -1
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => onToggle(area.id)}
                style={
                  isSelected
                    ? {
                        backgroundColor: AREA_PALETTE[colorIdx],
                        borderColor: AREA_PALETTE[colorIdx],
                      }
                    : {}
                }
                className={`inline-flex hover:cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  isSelected
                    ? 'text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                {area.name}
              </button>
            )
          })}
        </div>
      )}
      {needsMoreAreas && !areasLoading && areas.length >= 2 ? (
        <p className="mt-2 text-xs font-semibold text-slate-400">
          Select at least 2 areas to see the comparison.
        </p>
      ) : null}
    </div>
  )
}

// ─── ComparisonFilters ────────────────────────────────────────────────────────

interface ComparisonFiltersProps {
  rangeMode: RangeMode
  aggregation: AggregationPeriod
  isLoading: boolean
  needsMoreAreas: boolean
  isCustomRangeValid: boolean
  onRangeChange: (mode: RangeMode) => void
  onRefresh: () => void
}

function ComparisonFilters({
  rangeMode,
  aggregation,
  isLoading,
  needsMoreAreas,
  isCustomRangeValid,
  onRangeChange,
  onRefresh,
}: ComparisonFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Date Range</span>
        <select
          value={rangeMode}
          onChange={(e) => onRangeChange(e.target.value as RangeMode)}
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
        Aggregation: {aggregation === 'HOURLY' ? 'Hourly averages' : 'Daily averages'}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading || needsMoreAreas || !isCustomRangeValid}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        Refresh
      </button>
    </div>
  )
}

// ─── ComparisonChart ──────────────────────────────────────────────────────────

interface ComparisonChartProps {
  chartData: ChartRow[]
  comparisonData: AreaComparisonPoint[]
  isLoading: boolean
  needsMoreAreas: boolean
  selectedIndicator: IndicatorKey
  onIndicatorChange: (key: IndicatorKey) => void
}

function ComparisonChart({
  chartData,
  comparisonData,
  isLoading,
  needsMoreAreas,
  selectedIndicator,
  onIndicatorChange,
}: ComparisonChartProps) {
  const config = INDICATOR_CONFIG[selectedIndicator]
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-extrabold text-slate-800">
          Indicator Comparison
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(INDICATOR_CONFIG) as [IndicatorKey, IndicatorConfig][]).map(
            ([key, cfg]) => {
              const isActive = selectedIndicator === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onIndicatorChange(key)}
                  style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                  className={`inline-flex hover:cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                    isActive
                      ? 'text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <cfg.Icon className="size-3.5" aria-hidden="true" />
                  {cfg.label}
                </button>
              )
            },
          )}
        </div>
      </div>

      {isLoading ? (
        <ChartPlaceholder>
          <RefreshCw className="size-5 animate-spin text-slate-300" />
        </ChartPlaceholder>
      ) : needsMoreAreas ? (
        <ChartPlaceholder>
          <span className="text-sm font-semibold text-slate-400">
            Select at least 2 areas above to compare.
          </span>
        </ChartPlaceholder>
      ) : comparisonData.length === 0 ? (
        <ChartPlaceholder>
          <span className="text-sm font-semibold text-slate-400">
            No data available for this period.
          </span>
        </ChartPlaceholder>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="areaName" />
              <YAxis
                allowDecimals={false}
                label={{
                  value: config.unit,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 16,
                  style: { fontSize: 11, fill: '#94a3b8' },
                }}
              />
              <Tooltip
                formatter={(value) => [
                  value != null ? Number(value).toFixed(1) : '—',
                  config.label,
                ]}
              />
              <Bar
                dataKey="value"
                name={config.label}
                fill={config.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── ComparisonTable ──────────────────────────────────────────────────────────

function ComparisonTable({ comparisonData }: { comparisonData: AreaComparisonPoint[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Area
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
              Air Quality
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
              Traffic Density
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">
              Noise Level
            </th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((point, i) => (
            <tr
              key={point.areaId}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="px-4 py-3 font-bold text-slate-800">
                <span
                  className="mr-2 inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: AREA_PALETTE[i] }}
                />
                {point.areaName}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-600">
                {point.avgAirQuality != null ? point.avgAirQuality.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-600">
                {point.avgTrafficDensity != null ? point.avgTrafficDensity.toFixed(1) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-600">
                {point.avgNoiseLevel != null ? point.avgNoiseLevel.toFixed(1) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function ChartPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50">
      {children}
    </div>
  )
}

function buildChartData(data: AreaComparisonPoint[], indicator: IndicatorKey): ChartRow[] {
  if (data.length === 0) return []
  const { dataKey } = INDICATOR_CONFIG[indicator]
  const round = (v: number | null) =>
    v != null ? Math.round(v * 10) / 10 : null
  return data.map((d) => ({
    areaName: d.areaName,
    value: round(d[dataKey] as number | null),
  }))
}
