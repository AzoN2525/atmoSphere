import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { useAreaSnapshots } from '@/hooks/useAreaSnapshots'
import { useHotspots } from '@/hooks/useHotspots'
import type {
  AlertSeverity,
  AreaSnapshotFromAPI,
  HotspotFromAPI,
  HotspotIndicatorFromAPI,
  IndicatorType,
} from '@/types/area'

type HotspotMode = 'REAL_TIME' | 'HISTORICAL'
type MapboxGeoJsonData = Parameters<mapboxgl.GeoJSONSource['setData']>[0]

interface HotspotsInitialFilters {
  mode?: HotspotMode
  areaId?: number
  areaName?: string
  indicatorType?: IndicatorType
  from?: string
  to?: string
  alertSeverity?: AlertSeverity
  measuredValue?: number
  thresholdValue?: number
  unit?: string
  triggeredAt?: string
  resolvedAt?: string
  status?: 'ACTIVE' | 'RESOLVED'
}

interface HotspotsDashboardProps {
  initialFilters?: HotspotsInitialFilters
}

const INDICATORS: Array<{ type: IndicatorType; label: string }> = [
  { type: 'AIR_QUALITY', label: 'Air' },
  { type: 'NOISE', label: 'Noise' },
  { type: 'TRAFFIC', label: 'Traffic' },
]

const AREA_POINTS_SOURCE_ID = 'hotspot-area-points'
const HOTSPOT_POINTS_SOURCE_ID = 'hotspot-points'
const HOTSPOT_HEATMAP_LAYER_ID = 'hotspot-heatmap'
const AREA_DOTS_LAYER_ID = 'hotspot-area-dots'

interface MarkerEntry {
  marker: mapboxgl.Marker
  root: Root
}

export function HotspotsDashboard({ initialFilters }: HotspotsDashboardProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const hotspotMarkersRef = useRef<MarkerEntry[]>([])
  const [mode, setMode] = useState<HotspotMode>(
    initialFilters?.mode ??
      (initialFilters?.from || initialFilters?.to ? 'HISTORICAL' : 'REAL_TIME'),
  )
  const [enabledIndicators, setEnabledIndicators] = useState<IndicatorType[]>(
    initialFilters?.indicatorType
      ? [initialFilters.indicatorType]
      : INDICATORS.map((indicator) => indicator.type),
  )
  const [historicalFrom, setHistoricalFrom] = useState(() =>
    initialFilters?.from ??
      toDateTimeLocalValue(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  )
  const [historicalTo, setHistoricalTo] = useState(() =>
    initialFilters?.to ?? toDateTimeLocalValue(new Date()),
  )
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotFromAPI | null>(
    null,
  )
  const initialAlertContext = initialFilters
    ? {
        areaName: initialFilters.areaName,
        alertSeverity: initialFilters.alertSeverity,
        measuredValue: initialFilters.measuredValue,
        thresholdValue: initialFilters.thresholdValue,
        unit: initialFilters.unit,
        triggeredAt: initialFilters.triggeredAt,
        resolvedAt: initialFilters.resolvedAt,
        status: initialFilters.status,
      }
    : null

  const handleSelectHotspot = useCallback((hotspot: HotspotFromAPI) => {
    setSelectedHotspot(hotspot)
    focusMapOnHotspot(mapRef.current, hotspot)
  }, [])

  const { snapshots, isLoading: snapshotsLoading } = useAreaSnapshots(30000)

  const queryFrom = mode === 'HISTORICAL' ? historicalFrom : undefined
  const queryTo = mode === 'HISTORICAL' ? historicalTo : undefined

  const {
    hotspots,
    isLoading: hotspotsLoading,
    error: hotspotsError,
    refresh: refreshHotspots,
  } = useHotspots({
    enabledIndicators,
    from: queryFrom,
    to: queryTo,
    refreshIntervalMs: mode === 'REAL_TIME' ? 15000 : 0,
  })

  const visibleHotspots = useMemo(
    () => mergeHotspotsWithSnapshots(hotspots, snapshots),
    [hotspots, snapshots],
  )

  const summary = useMemo(() => buildSummary(visibleHotspots), [visibleHotspots])

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN

    if (!token) {
      console.error(
        'Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your .env file.',
      )
      return
    }

    mapboxgl.accessToken = token

    if (!mapContainerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-8.6291, 40.6405],
      zoom: 12,
      pitch: 0,
      antialias: true,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
    map.addControl(new mapboxgl.FullscreenControl())

    map.on('load', () => {
      addHotspotSourcesAndLayers(map)
    })

    return () => {
      clearMarkers(hotspotMarkersRef.current)
      hotspotMarkersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateMapData = () => {
      addHotspotSourcesAndLayers(map)
      syncAreaPointSource(map, snapshots)
      syncHotspotSource(map, visibleHotspots)
      syncHotspotMarkers(
        map,
        visibleHotspots,
        hotspotMarkersRef,
        handleSelectHotspot,
      )
      fitMapToData(map, snapshots, visibleHotspots)
    }

    if (map.isStyleLoaded()) {
      updateMapData()
      return
    }

    map.once('load', updateMapData)
    return () => {
      map.off('load', updateMapData)
    }
  }, [handleSelectHotspot, snapshots, visibleHotspots])

  useEffect(() => {
    setSelectedHotspot((currentSelectedHotspot) => {
      if (!currentSelectedHotspot) {
        if (initialFilters?.areaId !== undefined) {
          return (
            visibleHotspots.find((hotspot) => hotspot.areaId === initialFilters.areaId) ??
            visibleHotspots[0] ??
            null
          )
        }

        return visibleHotspots[0] ?? null
      }

      const updatedSelection = visibleHotspots.find(
        (hotspot) => hotspot.areaId === currentSelectedHotspot.areaId,
      )

      return updatedSelection ?? visibleHotspots[0] ?? null
    })
  }, [initialFilters?.areaId, visibleHotspots])

  useEffect(() => {
    if (selectedHotspot) {
      focusMapOnHotspot(mapRef.current, selectedHotspot)
    }
  }, [selectedHotspot])

  return (
    <div className="grid h-[90vh] min-h-130 max-h-187.5 grid-cols-1 bg-slate-100 lg:grid-cols-[1fr_23rem]">
      <div className="relative min-h-130 overflow-hidden">
        <div
          ref={mapContainerRef}
          className="h-full min-h-130 w-full"
          aria-label="Environmental hotspots map"
        />

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-3">
          <div className="pointer-events-auto rounded-xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Indicators
            </div>
            <div className="flex flex-wrap gap-2">
              {INDICATORS.map((indicator) => {
                const enabled = enabledIndicators.includes(indicator.type)

                return (
                  <button
                    key={indicator.type}
                    type="button"
                    onClick={() =>
                      setEnabledIndicators((current) =>
                        enabled
                          ? current.filter((type) => type !== indicator.type)
                          : [...current, indicator.type],
                      )
                    }
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                      enabled
                        ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded ${
                        enabled ? 'bg-emerald-500 text-white' : 'bg-white'
                      }`}
                    >
                      {enabled ? '✓' : ''}
                    </span>
                    {indicator.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 border-t border-slate-100 pt-3">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('REAL_TIME')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    mode === 'REAL_TIME'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Real-time
                </button>
                <button
                  type="button"
                  onClick={() => setMode('HISTORICAL')}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                    mode === 'HISTORICAL'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Historical
                </button>
              </div>
            </div>
          </div>
        </div>

        {mode === 'HISTORICAL' ? (
          <div className="pointer-events-auto absolute left-4 top-44 z-10 rounded-xl bg-white/95 p-3 text-xs shadow-lg ring-1 ring-slate-200 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 font-bold text-slate-700">
              <Clock className="size-4" /> Historical range
            </div>
            <div className="grid gap-2">
              <label className="grid gap-1 text-slate-600">
                From
                <input
                  type="datetime-local"
                  value={historicalFrom}
                  onChange={(event) => setHistoricalFrom(event.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-slate-700"
                />
              </label>
              <label className="grid gap-1 text-slate-600">
                To
                <input
                  type="datetime-local"
                  value={historicalTo}
                  onChange={(event) => setHistoricalTo(event.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-slate-700"
                />
              </label>
            </div>
          </div>
        ) : null}

        {selectedHotspot ? (
          <SelectedHotspotSummaryCard hotspot={selectedHotspot} />
        ) : null}

        <div className="pointer-events-auto absolute bottom-20 left-4 rounded-xl bg-white/95 p-3 text-xs text-slate-600 shadow-lg ring-1 ring-slate-200 backdrop-blur">
          <button
            type="button"
            onClick={() => void refreshHotspots()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-700 transition hover:bg-slate-200"
          >
            <RefreshCw
              className={`size-4 ${
                hotspotsLoading || snapshotsLoading ? 'animate-spin' : ''
              }`}
            />
            Refresh hotspots
          </button>
          {hotspotsError ? (
            <p className="mt-2 font-semibold text-rose-600">
              Unable to load hotspot data.
            </p>
          ) : null}
        </div>
      </div>

      <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white shadow-xl">
        <div className="bg-slate-700 p-5 text-white">
          <div className="text-sm font-bold uppercase tracking-wide text-slate-200">
            Total Active Hotspots
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-extrabold leading-none">
              {visibleHotspots.length}
            </span>
            <span className="pb-1 text-lg font-bold text-rose-300">
              {summary.highSeverityCount > 0 ? 'Critical' : 'Monitored'}
            </span>
          </div>
        </div>

        <div className="space-y-6 p-5">
          {initialAlertContext ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-slate-900 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                Alert context
              </div>
              <h2 className="mt-2 text-lg font-extrabold text-slate-900">
                {initialAlertContext.areaName ?? 'Selected alert'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {initialFilters?.indicatorType ? formatIndicator(initialFilters.indicatorType) : 'Alert'}
                {initialAlertContext.alertSeverity ? ` · ${initialAlertContext.alertSeverity}` : ''}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <InfoTile
                  label="Measured"
                  value={formatNumber(initialAlertContext.measuredValue)}
                />
                <InfoTile
                  label="Limit"
                  value={formatNumber(initialAlertContext.thresholdValue)}
                />
                <InfoTile label="Unit" value={initialAlertContext.unit ?? '—'} />
                <InfoTile label="Status" value={initialAlertContext.status ?? '—'} />
              </div>
              <div className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                Triggered: {formatDateTime(initialAlertContext.triggeredAt)}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-800">
              Critical Indicators
            </h2>
            <div className="space-y-3">
              {INDICATORS.map((indicator) => {
                const count = summary.indicatorCounts[indicator.type] ?? 0
                const maxCount = Math.max(...Object.values(summary.indicatorCounts), 1)
                const width = `${Math.max(8, (count / maxCount) * 100)}%`

                return (
                  <div key={indicator.type}>
                    <div className="mb-1 flex justify-between text-sm text-slate-600">
                      <span>{indicator.label}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-rose-500"
                        style={{ width }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-800">
              Selected Hotspot Details
            </h2>
            {selectedHotspot ? (
              <HotspotDetails hotspot={selectedHotspot} />
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Select a hotspot on the map or list to inspect triggered
                indicators.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-extrabold text-slate-800">
              Priority Intervention List
            </h2>
            <div className="space-y-2">
              {visibleHotspots.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  No hotspots found for the selected filters.
                </p>
              ) : null}

              {visibleHotspots.map((hotspot) => (
                <button
                  key={hotspot.areaId}
                  type="button"
                  onClick={() => handleSelectHotspot(hotspot)}
                  className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition ${
                    selectedHotspot?.areaId === hotspot.areaId
                      ? 'bg-rose-50 ring-1 ring-rose-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span>
                    <span className="block font-bold text-slate-800">
                      {hotspot.areaName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatSeverity(hotspot.maxSeverity)} ·{' '}
                      {hotspot.triggeredIndicatorCount} indicator(s)
                    </span>
                  </span>
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-extrabold text-rose-700">
                    {hotspot.triggeredIndicatorCount}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

function SelectedHotspotSummaryCard({
  hotspot,
}: {
  hotspot: HotspotFromAPI
}) {
  return (
    <article className="pointer-events-auto absolute bottom-4 right-4 z-10 w-[min(22rem,calc(100%-2rem))] rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        Selected hotspot
      </p>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {hotspot.areaName}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Last trigger: {formatDateTime(hotspot.lastTriggeredAt)}
          </p>
        </div>

        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-700">
          {formatSeverity(hotspot.maxSeverity)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-extrabold text-slate-900">
            {hotspot.triggeredIndicatorCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            indicators
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-extrabold text-slate-900">
            {hotspot.alertCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500">alerts</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-extrabold text-slate-900">
            {hotspot.indicators.length}
          </div>
          <div className="text-[11px] font-medium text-slate-500">types</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hotspot.indicators.map((indicator) => (
          <span
            key={indicator.indicatorType}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
          >
            {formatIndicator(indicator.indicatorType)}
          </span>
        ))}
      </div>
    </article>
  )
}

function HotspotDetails({ hotspot }: { hotspot: HotspotFromAPI }) {
  return (
    <article className="space-y-4 rounded-xl bg-slate-50 p-4">
      <div>
        <h3 className="text-base font-extrabold text-slate-800">
          {hotspot.areaName}
        </h3>
        <p className="text-xs text-slate-500">
          Last trigger: {formatDateTime(hotspot.lastTriggeredAt)}
        </p>
      </div>

      <div className="space-y-3">
        {hotspot.indicators.map((indicator) => (
          <div key={indicator.indicatorType}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="font-bold text-slate-700">
                {formatIndicator(indicator.indicatorType)}
              </span>
              <span className="font-bold text-rose-700">
                {formatNumber(indicator.measuredValue)} {indicator.unit ?? ''}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-rose-500"
                style={{ width: indicatorProgress(indicator) }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Limit: {formatNumber(indicator.thresholdValue)}{' '}
              {indicator.unit ?? ''} · {formatSeverity(indicator.severity)}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-100">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function addHotspotSourcesAndLayers(map: mapboxgl.Map) {
  if (!map.getSource(AREA_POINTS_SOURCE_ID)) {
    map.addSource(AREA_POINTS_SOURCE_ID, {
      type: 'geojson',
      data: toMapboxGeoJsonData(emptyFeatureCollection()),
    })
  }

  if (!map.getSource(HOTSPOT_POINTS_SOURCE_ID)) {
    map.addSource(HOTSPOT_POINTS_SOURCE_ID, {
      type: 'geojson',
      data: toMapboxGeoJsonData(emptyFeatureCollection()),
    })
  }

  if (!map.getLayer(AREA_DOTS_LAYER_ID)) {
    map.addLayer({
      id: AREA_DOTS_LAYER_ID,
      type: 'circle',
      source: AREA_POINTS_SOURCE_ID,
      paint: {
        'circle-radius': 5,
        'circle-color': '#0f766e',
        'circle-opacity': 0.35,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    })
  }

  if (!map.getLayer(HOTSPOT_HEATMAP_LAYER_ID)) {
    map.addLayer({
      id: HOTSPOT_HEATMAP_LAYER_ID,
      type: 'heatmap',
      source: HOTSPOT_POINTS_SOURCE_ID,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'severityRank'],
          1,
          0.35,
          3,
          1,
        ],
        'heatmap-intensity': 1.4,
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          35,
          14,
          90,
        ],
        'heatmap-opacity': 0.55,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(254,226,226,0)',
          0.35,
          'rgba(251,113,133,0.35)',
          0.7,
          'rgba(239,68,68,0.55)',
          1,
          'rgba(127,29,29,0.75)',
        ],
      },
    })
  }
}

function syncAreaPointSource(
  map: mapboxgl.Map,
  snapshots: AreaSnapshotFromAPI[],
) {
  const source = map.getSource(AREA_POINTS_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined

  if (!source) return

  source.setData(
    toMapboxGeoJsonData({
      type: 'FeatureCollection',
      features: snapshots.filter(hasCoordinates).map((snapshot) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [snapshot.longitude, snapshot.latitude],
        },
        properties: {},
      })),
    }),
  )
}

function syncHotspotSource(map: mapboxgl.Map, hotspots: HotspotFromAPI[]) {
  const source = map.getSource(HOTSPOT_POINTS_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined

  if (!source) return

  source.setData(
    toMapboxGeoJsonData({
      type: 'FeatureCollection',
      features: hotspots.filter(hasCoordinates).map((hotspot) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [hotspot.longitude, hotspot.latitude],
        },
        properties: {
          severityRank: severityRank(hotspot.maxSeverity),
          indicatorCount: hotspot.triggeredIndicatorCount,
        },
      })),
    }),
  )
}

function syncHotspotMarkers(
  map: mapboxgl.Map,
  hotspots: HotspotFromAPI[],
  markersRef: MutableRefObject<MarkerEntry[]>,
  onSelect: (hotspot: HotspotFromAPI) => void,
) {
  clearMarkers(markersRef.current)

  markersRef.current = hotspots.filter(hasCoordinates).map((hotspot) => {
    const markerNode = document.createElement('div')
    const root = createRoot(markerNode)

    root.render(<HotspotMarker hotspot={hotspot} onSelect={onSelect} />)

    const marker = new mapboxgl.Marker({
      element: markerNode,
      anchor: 'center',
    })
      .setLngLat([hotspot.longitude, hotspot.latitude])
      .addTo(map)

    return { marker, root }
  })
}

function HotspotMarker({
  hotspot,
  onSelect,
}: {
  hotspot: HotspotFromAPI
  onSelect: (hotspot: HotspotFromAPI) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hotspot)}
      className="group relative flex size-14 items-center justify-center rounded-full border-2 border-rose-200 bg-rose-500/25 text-rose-700 shadow-lg shadow-rose-900/20 backdrop-blur transition hover:scale-110"
      aria-label={`Open ${hotspot.areaName} hotspot details`}
    >
      <span className="absolute inset-1 rounded-full bg-rose-500/20" />
      <AlertTriangle className="relative z-10 size-6 fill-rose-100" />
      <span className="absolute -right-1 -top-1 rounded-full bg-rose-700 px-1.5 py-0.5 text-xs font-extrabold text-white ring-2 ring-white">
        {hotspot.triggeredIndicatorCount}
      </span>
    </button>
  )
}

function clearMarkers(markers: MarkerEntry[]) {
  markers.forEach(({ marker, root }) => {
    marker.remove()

    window.setTimeout(() => {
      root.unmount()
    }, 0)
  })
}

function focusMapOnHotspot(
  map: mapboxgl.Map | null,
  hotspot: HotspotFromAPI,
) {
  if (!map || !hasCoordinates(hotspot)) return

  map.flyTo({
    center: [hotspot.longitude, hotspot.latitude],
    zoom: 11,
    duration: 750,
    essential: true,
  })
}

function getGeometryBounds(geometryGeoJson: string | null | undefined) {
  if (!geometryGeoJson) return null

  try {
    const parsed = JSON.parse(geometryGeoJson) as Record<string, unknown>
    const geometry = parsed.type === 'Feature' ? parsed.geometry : parsed
    const coordinates = getGeometryCoordinates(geometry)

    if (coordinates.length === 0) return null

    const bounds = new mapboxgl.LngLatBounds()
    coordinates.forEach(([longitude, latitude]) => {
      bounds.extend([longitude, latitude])
    })

    return bounds
  } catch {
    return null
  }
}

function getGeometryCoordinates(value: unknown): Array<[number, number]> {
  if (!value || typeof value !== 'object') return []

  const coordinates = (value as { coordinates?: unknown }).coordinates
  return flattenCoordinates(coordinates)
}

function flattenCoordinates(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) return []

  if (
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  ) {
    return [[value[0], value[1]]]
  }

  return value.flatMap((entry) => flattenCoordinates(entry))
}

function fitMapToData(
  map: mapboxgl.Map,
  snapshots: AreaSnapshotFromAPI[],
  hotspots: HotspotFromAPI[],
) {
  const points = [...hotspots, ...snapshots].filter(hasCoordinates)
  if (points.length === 0) return

  const bounds = new mapboxgl.LngLatBounds()
  points.forEach((point) => bounds.extend([point.longitude, point.latitude]))

  if (bounds.isEmpty()) return

  map.fitBounds(bounds, {
    padding: { top: 120, right: 80, bottom: 80, left: 80 },
    maxZoom: 13,
    duration: 650,
  })
}

function mergeHotspotsWithSnapshots(
  hotspots: HotspotFromAPI[],
  snapshots: AreaSnapshotFromAPI[],
) {
  const snapshotsByAreaId = new Map(
    snapshots.map((snapshot) => [snapshot.areaId, snapshot]),
  )

  return hotspots.map((hotspot) => {
    const snapshot = snapshotsByAreaId.get(hotspot.areaId)

    return {
      ...hotspot,
      latitude: hotspot.latitude ?? snapshot?.latitude,
      longitude: hotspot.longitude ?? snapshot?.longitude,
      geometryGeoJson: hotspot.geometryGeoJson ?? snapshot?.geometryGeoJson ?? null,
    }
  })
}

function buildSummary(hotspots: HotspotFromAPI[]) {
  const indicatorCounts: Record<IndicatorType, number> = {
    AIR_QUALITY: 0,
    NOISE: 0,
    TRAFFIC: 0,
  }

  let highSeverityCount = 0

  hotspots.forEach((hotspot) => {
    if (hotspot.maxSeverity === 'HIGH') highSeverityCount += 1

    hotspot.indicators.forEach((indicator) => {
      indicatorCounts[indicator.indicatorType] += 1
    })
  })

  return { indicatorCounts, highSeverityCount }
}

function emptyFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

function hasCoordinates(
  value: Pick<AreaSnapshotFromAPI | HotspotFromAPI, 'latitude' | 'longitude'>,
) {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
}

function toMapboxGeoJsonData(data: unknown): MapboxGeoJsonData {
  return data as MapboxGeoJsonData
}

function indicatorProgress(indicator: HotspotIndicatorFromAPI) {
  const measuredValue = indicator.measuredValue ?? 0
  const thresholdValue = indicator.thresholdValue ?? measuredValue
  const ratio = thresholdValue > 0 ? measuredValue / thresholdValue : 1
  return `${Math.min(100, Math.max(8, ratio * 66))}%`
}

function severityRank(severity: AlertSeverity | null) {
  if (severity === 'HIGH') return 3
  if (severity === 'MEDIUM') return 2
  if (severity === 'LOW') return 1
  return 0
}

function formatSeverity(severity: AlertSeverity | null) {
  if (!severity) return 'Unknown'
  return severity.charAt(0) + severity.slice(1).toLowerCase()
}

function formatIndicator(indicator: IndicatorType) {
  return {
    AIR_QUALITY: 'Air quality',
    NOISE: 'Noise',
    TRAFFIC: 'Traffic',
  }[indicator]
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value)
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toDateTimeLocalValue(date: Date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}
