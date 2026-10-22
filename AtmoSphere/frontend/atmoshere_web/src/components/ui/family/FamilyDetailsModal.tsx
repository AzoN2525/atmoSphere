import type { FamilyAssessmentFromAPI } from '@/types/area'
import { Trophy, X, Wind, Volume2, Car, CalendarDays } from 'lucide-react'
import { getScoreColor } from '@/lib/area-map-data'

interface FamilyDetailsModalProps {
  assessments: FamilyAssessmentFromAPI[]
  onClose: () => void
}

const assessmentPriority: Record<string, number> = {
  Suitable: 3,
  Moderate: 2,
  'Not Recommended': 1,
}

const assessmentStyles: Record<string, { pill: string; dot: string }> = {
  Suitable:          { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  Moderate:          { pill: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400'   },
  'Not Recommended': { pill: 'bg-rose-50 text-rose-700',       dot: 'bg-rose-500'    },
}

export function FamilyDetailsModal({ assessments, onClose }: FamilyDetailsModalProps) {
  const sorted = assessments.slice().sort((a, b) => {
    const rankA = assessmentPriority[a.assessment] ?? 0
    const rankB = assessmentPriority[b.assessment] ?? 0
    if (rankA !== rankB) return rankB - rankA
    return (b.overallIndex ?? 0) - (a.overallIndex ?? 0)
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 px-4 py-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Trophy className="h-4 w-4 text-emerald-600" />
              Family-friendly ranking
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
              <CalendarDays className="h-3 w-3" />
              Past 12 months · sorted by overall score
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-all duration-200 hover:cursor-pointer hover:rotate-90 hover:bg-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="max-h-[72vh] overflow-auto px-5 pb-5 pt-3">
          <table className="min-w-full border-collapse text-left text-sm text-slate-600">
            <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <Trophy className="h-3.5 w-3.5" />
                </th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Area</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Assessment</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Score</th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span className="flex items-center gap-1"><Wind className="h-3 w-3 text-sky-400" />Air</span>
                </th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span className="flex items-center gap-1"><Volume2 className="h-3 w-3 text-rose-400" />Noise</span>
                </th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span className="flex items-center gap-1"><Car className="h-3 w-3 text-slate-400" />Traffic</span>
                </th>
                <th className="px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Periods</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((assessment, index) => {
                const color = getScoreColor(assessment.overallIndex ?? 0)
                const style = assessmentStyles[assessment.assessment]
                return (
                  <tr
                    key={assessment.areaId}
                    className="border-b border-slate-100 transition-colors duration-100 last:border-none hover:bg-emerald-50/50"
                  >
                    <td className="px-2 py-2.5 text-left text-xs font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-slate-900">{assessment.areaName}</td>
                    <td className="px-2 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style?.pill ?? 'bg-slate-100 text-slate-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${style?.dot ?? 'bg-slate-400'}`} />
                        {assessment.assessment}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="font-semibold" style={{ color }}>
                        {assessment.overallIndex?.toFixed(1) ?? '--'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-slate-500">{assessment.indicatorBreakdown.airIndex?.toFixed(1) ?? '--'}</td>
                    <td className="px-2 py-2.5 text-slate-500">{assessment.indicatorBreakdown.noiseIndex?.toFixed(1) ?? '--'}</td>
                    <td className="px-2 py-2.5 text-slate-500">{assessment.indicatorBreakdown.trafficIndex?.toFixed(1) ?? '--'}</td>
                    <td className="px-2 py-2.5 text-slate-500">{assessment.evaluatedPeriods ?? '--'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}