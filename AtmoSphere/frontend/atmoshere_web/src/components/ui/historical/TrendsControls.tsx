import { CalendarDays, FileText, MapPin, RefreshCw } from 'lucide-react'
import { RANGE_OPTIONS } from './historical-utils'
import type { RangeMode } from './historical-utils'
import type { AreaFromAPI } from '@/types/area'

interface TrendsControlsProps {
  areas: AreaFromAPI[]
  areasLoading: boolean
  selectedAreaId: number | null
  onAreaChange: (id: number) => void
  rangeMode: RangeMode
  onRangeChange: (mode: RangeMode) => void
  isLoading: boolean
  isCustomRangeValid: boolean
  onRefresh: () => void
  hasData: boolean
  onOpenReport: () => void
}

export function TrendsControls({
  areas,
  areasLoading,
  selectedAreaId,
  onAreaChange,
  rangeMode,
  onRangeChange,
  isLoading,
  isCustomRangeValid,
  onRefresh,
  hasData,
  onOpenReport,
}: TrendsControlsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Geographic Area</span>
        <select
          value={selectedAreaId ?? ''}
          onChange={(e) => onAreaChange(Number(e.target.value))}
          className="w-full bg-transparent text-sm hover:cursor-pointer font-bold text-slate-700 outline-none"
          disabled={areasLoading || areas.length === 0}
        >
          {areas.length === 0 ? (
            <option value="">No areas available</option>
          ) : null}
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="sr-only">Date Range</span>
        <select
          value={rangeMode}
          onChange={(e) => onRangeChange(e.target.value as RangeMode)}
          className="w-full bg-transparent text-sm hover:cursor-pointer font-bold text-slate-700 outline-none"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading || selectedAreaId === null || !isCustomRangeValid}
        className="inline-flex hover:cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw
          className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        Refresh
      </button>

      <button
        type="button"
        onClick={onOpenReport}
        disabled={!hasData || isLoading}
        className="inline-flex items-center gap-2 hover:cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileText className="size-4" aria-hidden="true" />
        Report
      </button>
    </div>
  )
}
