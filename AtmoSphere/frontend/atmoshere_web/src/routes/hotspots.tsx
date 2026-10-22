import { createFileRoute } from '@tanstack/react-router'
import { HotspotsDashboard } from '@/components/ui/hotspots/HotspotsDashboard'
import type { IndicatorType } from '@/types/area'

type HotspotsSearch = {
  mode?: 'REAL_TIME' | 'HISTORICAL'
  areaId?: number
  areaName?: string
  indicatorType?: IndicatorType
  from?: string
  to?: string
  alertSeverity?: 'LOW' | 'MEDIUM' | 'HIGH'
  measuredValue?: number
  thresholdValue?: number
  unit?: string
  triggeredAt?: string
  resolvedAt?: string
  status?: 'ACTIVE' | 'RESOLVED'
}

export const Route = createFileRoute('/hotspots')({
  validateSearch: (search): HotspotsSearch => {
    const parsedSearch = search as Record<string, unknown>

    return {
      mode: parsedSearch.mode === 'HISTORICAL' ? 'HISTORICAL' : 'REAL_TIME',
      areaId:
        typeof parsedSearch.areaId === 'number'
          ? parsedSearch.areaId
          : typeof parsedSearch.areaId === 'string' && parsedSearch.areaId.trim()
            ? Number(parsedSearch.areaId)
            : undefined,
      areaName: typeof parsedSearch.areaName === 'string' ? parsedSearch.areaName : undefined,
      indicatorType:
        parsedSearch.indicatorType === 'AIR_QUALITY' ||
        parsedSearch.indicatorType === 'NOISE' ||
        parsedSearch.indicatorType === 'TRAFFIC'
          ? parsedSearch.indicatorType
          : undefined,
      from: typeof parsedSearch.from === 'string' ? parsedSearch.from : undefined,
      to: typeof parsedSearch.to === 'string' ? parsedSearch.to : undefined,
      alertSeverity:
        parsedSearch.alertSeverity === 'LOW' ||
        parsedSearch.alertSeverity === 'MEDIUM' ||
        parsedSearch.alertSeverity === 'HIGH'
          ? parsedSearch.alertSeverity
          : undefined,
      measuredValue:
        typeof parsedSearch.measuredValue === 'number'
          ? parsedSearch.measuredValue
          : typeof parsedSearch.measuredValue === 'string' && parsedSearch.measuredValue.trim()
            ? Number(parsedSearch.measuredValue)
            : undefined,
      thresholdValue:
        typeof parsedSearch.thresholdValue === 'number'
          ? parsedSearch.thresholdValue
          : typeof parsedSearch.thresholdValue === 'string' && parsedSearch.thresholdValue.trim()
            ? Number(parsedSearch.thresholdValue)
            : undefined,
      unit: typeof parsedSearch.unit === 'string' ? parsedSearch.unit : undefined,
      triggeredAt: typeof parsedSearch.triggeredAt === 'string' ? parsedSearch.triggeredAt : undefined,
      resolvedAt: typeof parsedSearch.resolvedAt === 'string' ? parsedSearch.resolvedAt : undefined,
      status: parsedSearch.status === 'ACTIVE' || parsedSearch.status === 'RESOLVED' ? parsedSearch.status : undefined,
    }
  },
  component: HotspotsPage,
})

function HotspotsPage() {
  const search = Route.useSearch()

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="space-y-4">
        <div className="overflow-hidden rounded-lg border-2 border-primary/30 bg-surface-container-lowest shadow-ambient ring-1 ring-primary/10">
          <div className="flex flex-col gap-2 border-b border-primary/15 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-2 inline-flex rounded-full bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                Hotspots
              </span>
              <h1 className="text-xl font-semibold text-slate-900">
                Environmental hotspot map
              </h1>
              <p className="text-sm text-slate-600">
                Explore areas where indicators exceed configured safety
                thresholds.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Live & historical view
            </div>
          </div>

          <HotspotsDashboard initialFilters={search} />
        </div>
      </section>
    </main>
  )
}
