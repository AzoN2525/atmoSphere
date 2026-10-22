import { CalendarDays, Layers3, MapPin } from 'lucide-react'
import type { AreaFromAPI } from '@/types/area'
import type { AggregationPeriod, DashboardRangePreset } from '@/types/dashboard'

const RANGE_OPTIONS: Array<{
  value: DashboardRangePreset
  label: string
}> = [
  { value: 'CURRENT', label: 'Current · last hour' },
  { value: 'LAST_24_HOURS', label: 'Last 24 hours' },
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
]

const AGGREGATION_OPTIONS: Array<{
  value: AggregationPeriod
  label: string
}> = [
  { value: 'HOURLY', label: 'Hourly aggregation' },
  { value: 'DAILY', label: 'Daily aggregation' },
  { value: 'MONTHLY', label: 'Monthly aggregation' },
]

interface DashboardFiltersProps {
  areas: AreaFromAPI[]
  selectedAreaId: number | null
  rangePreset: DashboardRangePreset
  aggregation: AggregationPeriod
  onAreaChange: (areaId: number) => void
  onRangeChange: (rangePreset: DashboardRangePreset) => void
  onAggregationChange: (aggregation: AggregationPeriod) => void
}

export function DashboardFilters({
  areas,
  selectedAreaId,
  rangePreset,
  aggregation,
  onAreaChange,
  onRangeChange,
  onAggregationChange,
}: DashboardFiltersProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Area</span>
        <select
          value={selectedAreaId ?? ''}
          onChange={(event) => onAreaChange(Number(event.target.value))}
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
          disabled={areas.length === 0}
        >
          {areas.length === 0 ? <option value="">No areas</option> : null}
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <CalendarDays
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="sr-only">Period</span>
        <select
          value={rangePreset}
          onChange={(event) =>
            onRangeChange(event.target.value as DashboardRangePreset)
          }
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
        >
          {RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Layers3 className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Aggregation</span>
        <select
          value={aggregation}
          onChange={(event) =>
            onAggregationChange(event.target.value as AggregationPeriod)
          }
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
        >
          {AGGREGATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
