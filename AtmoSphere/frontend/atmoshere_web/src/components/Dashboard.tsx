import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getAllAreas } from '@/services/AreaService'
import { useDashboardData } from '@/hooks/useDashboardData'
import { AirQualityCard } from '@/components/ui/dashboard/AirQualityCard'
import { DashboardFilters } from '@/components/ui/dashboard/DashboardFilters'
import { HotspotFrequencyChart } from '@/components/ui/dashboard/HotspotFrequencyChart'
import { HotspotsTrendChart } from '@/components/ui/dashboard/HotspotsTrendChart'
import { NoiseLevelCard } from '@/components/ui/dashboard/NoiseLevelCard'
import { TrafficDensityCard } from '@/components/ui/dashboard/TrafficDensityCard'
import type { AreaFromAPI } from '@/types/area'
import type { AggregationPeriod, DashboardRangePreset } from '@/types/dashboard'

interface DashboardFiltersState {
  areaId: number | null
  from: string
  to: string
  aggregation: AggregationPeriod
}

export function Dashboard() {
  const [areas, setAreas] = useState<AreaFromAPI[]>([])
  const [areasLoading, setAreasLoading] = useState(true)
  const [areasError, setAreasError] = useState<Error | null>(null)

  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [rangePreset, setRangePreset] =
    useState<DashboardRangePreset>('LAST_30_DAYS')
  const [aggregation, setAggregation] = useState<AggregationPeriod>('DAILY')
  const [filters, setFilters] = useState<DashboardFiltersState>(() => {
    const range = buildRange('LAST_30_DAYS')

    return {
      areaId: null,
      from: range.from,
      to: range.to,
      aggregation: 'DAILY',
    }
  })

  useEffect(() => {
    const loadAreas = async () => {
      setAreasLoading(true)

      try {
        const fetchedAreas = await getAllAreas()
        setAreas(fetchedAreas)
        setAreasError(null)

        if (fetchedAreas.length > 0) {
          const firstAreaId = fetchedAreas[0].id
          setSelectedAreaId((currentAreaId) => currentAreaId ?? firstAreaId)
        }
      } catch (caughtError) {
        setAreasError(
          caughtError instanceof Error
            ? caughtError
            : new Error('Failed to load areas'),
        )
      } finally {
        setAreasLoading(false)
      }
    }

    void loadAreas()
  }, [])

  useEffect(() => {
    if (selectedAreaId === null) return

    const range = buildRange(rangePreset)

    setFilters({
      areaId: selectedAreaId,
      from: range.from,
      to: range.to,
      aggregation,
    })
  }, [aggregation, rangePreset, selectedAreaId])

  const { kpis, history, hotspotFrequency, isLoading, error, refresh } =
    useDashboardData(filters)

  const selectedAreaName =
    areas.find((area) => area.id === filters.areaId)?.name ?? 'Selected area'

  const averageAqi = kpis?.averageAirQualityByArea[0]?.averageAqi ?? null
  const averageDensity =
    kpis?.averageTrafficDensityByArea[0]?.averageDensity ?? null
  const averageLeq = kpis?.averageNoiseLevelByArea[0]?.averageLeq ?? null

  const historicalData = history?.data ?? []
  const hotspotFrequencyData = hotspotFrequency?.data ?? []

  const summaryText = useMemo(() => {
    if (!kpis) return 'No data loaded yet'

    const hotspotCount = kpis.hotspotsDetected.length
    return `${hotspotCount} hotspot${hotspotCount === 1 ? '' : 's'} detected in the selected period`
  }, [kpis])

  const handleRangeChange = (nextRangePreset: DashboardRangePreset) => {
    setRangePreset(nextRangePreset)
    setAggregation(getRecommendedAggregation(nextRangePreset))
  }

  return (
    <main className="bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            Sustainability Dashboard
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {summaryText}
          </p>
        </header>

        <DashboardFilters
          areas={areas}
          selectedAreaId={selectedAreaId}
          rangePreset={rangePreset}
          aggregation={aggregation}
          onAreaChange={setSelectedAreaId}
          onRangeChange={handleRangeChange}
          onAggregationChange={setAggregation}
        />

        {areasError ? (
          <ErrorBanner message="Unable to load the available areas." />
        ) : null}

        {error ? (
          <ErrorBanner message="Unable to load dashboard data." />
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <AirQualityCard
            averageAqi={averageAqi}
            areaName={selectedAreaName}
            data={historicalData}
          />
          <TrafficDensityCard
            averageDensity={averageDensity}
            areaName={selectedAreaName}
            data={historicalData}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <HotspotsTrendChart data={hotspotFrequencyData} />
          <NoiseLevelCard
            averageLeq={averageLeq}
            areaName={selectedAreaName}
            data={historicalData}
          />
        </section>

        <HotspotFrequencyChart data={hotspotFrequencyData} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading || filters.areaId === null || areasLoading}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh data
          </button>
        </div>
      </div>
    </main>
  )
}

function getRecommendedAggregation(
  preset: DashboardRangePreset,
): AggregationPeriod {
  switch (preset) {
    case 'CURRENT':
    case 'LAST_24_HOURS':
      return 'HOURLY'
    case 'LAST_7_DAYS':
    case 'LAST_30_DAYS':
      return 'DAILY'
  }
}

function buildRange(preset: DashboardRangePreset) {
  const to = new Date()
  const from = new Date(to)

  switch (preset) {
    case 'CURRENT':
      from.setHours(from.getHours() - 1)
      break
    case 'LAST_24_HOURS':
      from.setHours(from.getHours() - 24)
      break
    case 'LAST_7_DAYS':
      from.setDate(from.getDate() - 7)
      break
    case 'LAST_30_DAYS':
      from.setDate(from.getDate() - 30)
      break
  }

  return {
    from: toLocalDateTimeString(from),
    to: toLocalDateTimeString(to),
  }
}

function toLocalDateTimeString(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
      {message}
    </div>
  )
}
