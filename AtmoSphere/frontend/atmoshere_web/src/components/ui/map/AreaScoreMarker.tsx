import type { AreaSnapshotFromAPI } from '@/types/area'
import { getScoreColor } from '@/lib/area-map-data'

interface AreaScoreMarkerProps {
  snapshot: AreaSnapshotFromAPI
  score: number
  onSelect: (snapshot: AreaSnapshotFromAPI) => void
}

export function AreaScoreMarker({
  snapshot,
  score,
  onSelect,
}: AreaScoreMarkerProps) {
  const color = getScoreColor(score)

  return (
    <button
      type="button"
      onMouseEnter={() => onSelect(snapshot)}
      onFocus={() => onSelect(snapshot)}
      onClick={() => onSelect(snapshot)}
      className="group flex flex-col items-center border-0 bg-transparent p-0"
      aria-label={`Open ${snapshot.areaName} details`}
    >
      <span className="mb-1 rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-800 shadow-md ring-1 ring-slate-200">
        {score}
      </span>
      <span
        className="size-6 rounded-full border-[3px] border-white shadow-lg transition-transform group-hover:scale-110"
        style={{ backgroundColor: color }}
      />
    </button>
  )
}
