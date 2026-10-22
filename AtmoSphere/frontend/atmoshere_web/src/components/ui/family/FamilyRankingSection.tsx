import { useMemo, useState, type ComponentType, type SVGProps } from 'react'
import {
  TreeDeciduous,
  Landmark,
  School,
  Hospital,
  ArrowRight,
  Wind,
  Volume2,
  Car,
  MapPin,
  Clock,
} from 'lucide-react'
import { useAreaSnapshots } from '@/hooks/useAreaSnapshots'
import { useFamilyAssessments } from '@/hooks/useFamilyAssessments'
import { useAmenityCounts } from '@/hooks/useAmenityCounts'
import type { FamilyAssessmentFromAPI } from '@/types/area'
import { getScoreColor } from '@/lib/area-map-data'
import { FamilyDetailsModal } from './FamilyDetailsModal'

const assessmentPriority: Record<string, number> = {
  Suitable: 3,
  Moderate: 2,
  'Not Recommended': 1,
}

interface RankedArea extends FamilyAssessmentFromAPI {
  latitude?: number
  longitude?: number
}

function AmenityIcon({
  label,
  value,
  Icon,
}: {
  label: string
  value: number | null
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="group relative inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50">
      <Icon className="h-3.5 w-3.5 text-emerald-600" />
      <span>{value ?? '--'}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-max -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-sm transition group-hover:block group-hover:opacity-100">
        {label}
      </span>
    </div>
  )
}

export function FamilyRankingSection() {
  const yearAgo = useMemo(() => {
    const now = new Date()
    const past = new Date(now)
    past.setFullYear(past.getFullYear() - 1)
    return past.toISOString().slice(0, 19)
  }, [])

  const nowIso = useMemo(() => new Date().toISOString().slice(0, 19), [])
  const { snapshots } = useAreaSnapshots()
  const { assessments, isLoading, error } = useFamilyAssessments(yearAgo, nowIso)
  const [showModal, setShowModal] = useState(false)

  const rankedAreas = useMemo<RankedArea[]>(() => {
    return assessments
      .map((assessment) => ({
        ...assessment,
        ...snapshots.find((snapshot) => snapshot.areaId === assessment.areaId),
      }))
      .sort((a, b) => {
        const rankA = assessmentPriority[a.assessment] ?? 0
        const rankB = assessmentPriority[b.assessment] ?? 0
        if (rankA !== rankB) return rankB - rankA
        return (b.overallIndex ?? 0) - (a.overallIndex ?? 0)
      })
  }, [assessments, snapshots])

  const topThree = rankedAreas.slice(0, 3)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-end md:justify-between">
        <div>
          {/* Eyebrow with pulse dot */}
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Family-friendly ranking
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Best areas for families
          </h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            Last 12 months, based on air, noise and traffic.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white transition-all duration-200 hover:cursor-pointer hover:bg-emerald-600 hover:-translate-y-px active:scale-95"
        >
          Full list
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Unable to load family ranking.
        </div>
      ) : null}

      <div className="grid gap-3">
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            Loading ranking…
          </div>
        ) : topThree.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No family-friendly areas available.
          </div>
        ) : (
          topThree.map((area, index) => (
            <RankingCard key={area.areaId} rank={index + 1} area={area} />
          ))
        )}
      </div>

      {showModal ? (
        <FamilyDetailsModal assessments={rankedAreas} onClose={() => setShowModal(false)} />
      ) : null}
    </section>
  )
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

const STRIPE_COLORS: Record<number, string> = {
  1: '#059669',
  2: '#334155',
  3: '#CD645F',
}

function RankingCard({
  rank,
  area,
}: {
  rank: number
  area: RankedArea
}) {
  const { counts, isLoading, error, refresh } = useAmenityCounts(area.latitude, area.longitude)
  const badgeColor = getScoreColor(area.overallIndex ?? 0)
  const stripeColor = STRIPE_COLORS[rank] ?? '#94a3b8'

  return (
    <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md">
      {/* Rank stripe accent */}
      <span
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: stripeColor }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base leading-none">{RANK_MEDALS[rank - 1] ?? null}</span>
            <span className="text-xs font-semibold text-slate-400">#{rank}</span>
            <h3 className="text-base font-semibold leading-tight text-slate-900">{area.areaName}</h3>
          </div>
          <AssessmentTag assessment={area.assessment} />
        </div>
        <span
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold text-white transition-transform duration-200 hover:scale-110"
          style={{ backgroundColor: badgeColor }}
        >
          {area.overallIndex?.toFixed(0) ?? '--'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <InfoBadge label="Air" value={area.indicatorBreakdown.airIndex} Icon={Wind} iconColor="text-sky-500" />
        <InfoBadge label="Noise" value={area.indicatorBreakdown.noiseIndex} Icon={Volume2} iconColor="text-rose-400" />
        <InfoBadge label="Traffic" value={area.indicatorBreakdown.trafficIndex} Icon={Car} iconColor="text-slate-500" />
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span>Amenities</span>
          {isLoading ? (
            <span className="font-normal text-slate-400">Loading…</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <AmenityIcon label="Schools"      value={counts?.schools  ?? null} Icon={School}        />
          <AmenityIcon label="Museums"      value={counts?.museums  ?? null} Icon={Landmark}      />
          <AmenityIcon label="Hospitals"    value={counts?.hospitals ?? null} Icon={Hospital}     />
          <AmenityIcon label="Green spaces" value={counts?.parks    ?? null} Icon={TreeDeciduous} />
        </div>
        {error && !isLoading ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-rose-600">
            <span>Amenity data could not be loaded.</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-rose-200 bg-white px-2 py-0.5 font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

function AssessmentTag({ assessment }: { assessment: string }) {
  const styles: Record<string, string> = {
    Suitable:         'bg-emerald-50 text-emerald-700',
    Moderate:         'bg-amber-50 text-amber-700',
    'Not Recommended':'bg-rose-50 text-rose-700',
  }
  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[assessment] ?? 'bg-slate-100 text-slate-600'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {assessment} zone
    </span>
  )
}

function InfoBadge({
  label,
  value,
  Icon,
  iconColor = 'text-slate-500',
}: {
  label: string
  value: number | null
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  iconColor?: string
}) {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 transition-all duration-150 hover:border-slate-300 hover:bg-white">
      <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">
        {value !== null && value !== undefined ? value.toFixed(0) : '--'}
      </span>
    </div>
  )
}
