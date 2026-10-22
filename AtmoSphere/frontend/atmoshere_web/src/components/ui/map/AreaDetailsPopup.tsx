import type { ReactNode } from 'react'
import { Clock, MapPin, Star, TrafficCone, Volume2, Wind } from 'lucide-react'
import type { AreaSnapshotFromAPI } from '@/types/area'
import { getScoreColor, getScoreLabel } from '@/lib/area-map-data'

interface AreaDetailsPopupProps {
  snapshot: AreaSnapshotFromAPI
}

interface MetricRowProps {
  label: string
  value: number
  color: string
  bgColor: string
  borderColor: string
  icon: ReactNode
}

function MetricRow({ label, value, color, bgColor, borderColor, icon }: MetricRowProps) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2"
      style={{ backgroundColor: bgColor, borderLeft: `3px solid ${borderColor}` }}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: borderColor }}
      >
        {icon}
      </div>
      <dt className="flex-1 text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium" style={{ color }}>
        {value}
        <span className="text-[11px]">%</span>
      </dd>
    </div>
  )
}

export function AreaDetailsPopup({ snapshot }: AreaDetailsPopupProps) {
  const score = getScoreLabel(snapshot.overallIndex)
  const scoreColor = getScoreColor(score)

  return (
    <article className="w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

      {/* Header */}
      <div className="relative bg-emerald-600 px-4 pb-3 pt-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/75">
              Monitored area
            </p>
            <h3 className="text-[17px] font-medium leading-tight text-white">
              {snapshot.areaName}
            </h3>
          </div>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="text-xs text-white">Live</span>
        </div>
      </div>

      {/* Overall score */}
      <div className="border-b border-emerald-100 bg-emerald-50 px-4 pb-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
            Overall score
          </span>
          <div className="flex items-baseline gap-1">
            <Star className="h-4 w-4 text-emerald-600" />
            <span className="text-lg font-medium" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="mt-1 text-[11px] text-emerald-700">/ 100</span>
          </div>
        </div>
        <div className="mt-1.5 mb-1.5 h-1 rounded-full bg-emerald-200">
          <div
            className="h-1 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <dl className="flex flex-col gap-2 p-3.5">
        <MetricRow
          label="Air quality"
          value={getScoreLabel(snapshot.airQualityIndex)}
          color="#059669"
          bgColor="#e6f7f1"
          borderColor="#059669"
          icon={<Wind className="h-3.5 w-3.5 text-white" />}
        />
        <MetricRow
          label="Noise"
          value={getScoreLabel(snapshot.noiseIndex)}
          color="#ea580c"
          bgColor="#fef3eb"
          borderColor="#ea580c"
          icon={<Volume2 className="h-3.5 w-3.5 text-white" />}
        />
        <MetricRow
          label="Traffic"
          value={getScoreLabel(snapshot.trafficIndex)}
          color="#2563eb"
          bgColor="#eff4ff"
          borderColor="#2563eb"
          icon={<TrafficCone className="h-3.5 w-3.5 text-white" />}
        />
      </dl>
    </article>
  )
}
