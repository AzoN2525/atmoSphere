import { AlertCircle, CalendarDays, Car, Radio, RefreshCw, Volume2, Wind } from 'lucide-react'
import type { AreaIndexKey } from '@/lib/area-map-data'

type MapViewMode = '3d' | '2d'

interface AreaMapOverlayProps {
  viewMode: MapViewMode
  isLoading: boolean
  error: Error | null
  selectedIndices: AreaIndexKey[]
  selectedDate: string
  isHistoricalMode: boolean
  onRefresh: () => void
  onSelectedDateChange: (date: string) => void
  onSelectedIndexToggle: (index: AreaIndexKey) => void
  onViewModeChange: (mode: MapViewMode) => void
}

const indexFilterItems: Array<{
  key: AreaIndexKey
  label: string
  Icon: typeof Wind
}> = [
  { key: 'air', label: 'Air', Icon: Wind },
  { key: 'noise', label: 'Noise', Icon: Volume2 },
  { key: 'traffic', label: 'Traffic', Icon: Car },
]

const legendItems = [
  { label: 'Good (70-100)', color: '#10b981' },
  { label: 'Moderate (50-69)', color: '#f59e0b' },
  { label: 'Bad (30-49)', color: '#f97316' },
  { label: 'Very Bad (0-29)', color: '#f43f5e' },
]

export function AreaMapOverlay({
  viewMode,
  isLoading,
  error,
  selectedIndices,
  selectedDate,
  isHistoricalMode,
  onRefresh,
  onSelectedDateChange,
  onSelectedIndexToggle,
  onViewModeChange,
}: AreaMapOverlayProps) {
  return (
    <>
      <div className="pointer-events-auto absolute left-4 top-4 rounded-lg bg-white/95 p-3 text-xs text-slate-700 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <div className="mb-2 font-bold text-slate-700">3D Visualization</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onViewModeChange('3d')}
            className={`rounded-md px-3 py-1.5 font-bold transition hover:cursor-pointer  ${
              viewMode === '3d'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            3D View
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('2d')}
            className={`rounded-md px-3 py-1.5 font-bold transition hover:cursor-pointer ${
              viewMode === '2d'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2D View
          </button>
        </div>

        <div className="my-3 h-px bg-slate-200" />

        <div className="mb-2 font-bold text-slate-700">Data mode</div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1.5 font-bold text-slate-600">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Historical date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onSelectedDateChange(event.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => onSelectedDateChange('')}
            aria-pressed={!isHistoricalMode}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold transition ${
              isHistoricalMode
                ? 'bg-slate-100 text-slate-600 hover:cursor-pointer hover:bg-slate-200'
                : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 hover:cursor-default'
            }`}
          >
            <Radio
              className={`size-3.5 ${isHistoricalMode ? '' : 'animate-pulse'}`}
              aria-hidden="true"
            />
            {isHistoricalMode ? 'Back to live' : 'Live'}
          </button>
        </div>

        <div className="my-3 h-px bg-slate-200" />

        <div className="mb-2 font-bold text-slate-700">Visible indices</div>
        <div className="flex flex-wrap gap-2">
          {indexFilterItems.map(({ key, label, Icon }) => {
            const isSelected = selectedIndices.includes(key)
            const isLastSelected = isSelected && selectedIndices.length === 1

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectedIndexToggle(key)}
                aria-pressed={isSelected}
                title={isLastSelected ? 'At least one index must stay visible' : label}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold transition hover:cursor-pointer ${
                  isSelected
                    ? 'bg-sky-100 text-sky-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 w-[min(20rem,calc(100%-2rem))] rounded-lg bg-white/95 p-4 text-xs text-slate-600 shadow-lg ring-1 ring-slate-200 backdrop-blur">
        <div className="mb-3 font-bold text-slate-700">Score Heatmap</div>

        <div className="space-y-2">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="size-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="my-3 h-px bg-slate-200" />

        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <span>
            Drag to rotate the map. Heatmap colors follow the selected indices.
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700 transition hover:bg-slate-200 hover:cursor-pointer "
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh data
        </button>

        {error ? (
          <p className="mt-2 text-xs font-semibold text-rose-600">
            Unable to load {isHistoricalMode ? 'historical' : 'live'} data.
          </p>
        ) : null}
      </div>

    </>
  )
}
