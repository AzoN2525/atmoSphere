import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { AreaDetailsPopup } from '#/components/ui/map/AreaDetailsPopup'
import { AreaMapOverlay } from '#/components/ui/map/AreaMapOverlay'
import { AreaScoreMarker } from '#/components/ui/map/AreaScoreMarker'
import { useAreaSnapshots } from '@/hooks/useAreaSnapshots'
import {
  type AreaIndexKey,
  areaSnapshotsToPointCollection,
  areaSnapshotsToPolygonCollection,
  getFilteredScore,
} from '@/lib/area-map-data'
import type { AreaSnapshotFromAPI } from '@/types/area'

type MapViewMode = '3d' | '2d'
type MapboxGeoJsonData = Parameters<mapboxgl.GeoJSONSource['setData']>[0]

const AREA_POINTS_SOURCE_ID = 'area-points'                       // For heatmap layer
const AREA_POLYGONS_SOURCE_ID = 'area-polygons'                   // For polygon fill and outline layers
const AREA_POLYGON_FILL_LAYER_ID = 'area-polygons-fill'           // For polygon fill layer
const AREA_POLYGON_OUTLINE_LAYER_ID = 'area-polygons-outline'       // For polygon outline layer
const ALL_AREA_INDICES: AreaIndexKey[] = ['air', 'noise', 'traffic']
const MAP_FILTER_DATE_STORAGE_KEY = 'atmosphere.map.selectedDate'
const AREA_HEATMAP_LAYERS = [
  {
    id: 'area-heatmap-very-polluted',
    color: 'rgba(244,63,94,0.78)',
    transparentColor: 'rgba(244,63,94,0)',
    minScore: 0,
    maxScore: 30,
  },
  {
    id: 'area-heatmap-polluted',
    color: 'rgba(249,115,22,0.68)',
    transparentColor: 'rgba(249,115,22,0)',
    minScore: 30,
    maxScore: 50,
  },
  {
    id: 'area-heatmap-moderate',
    color: 'rgba(245,158,11,0.58)',
    transparentColor: 'rgba(245,158,11,0)',
    minScore: 50,
    maxScore: 70,
  },
  {
    id: 'area-heatmap-clean',
    color: 'rgba(16,185,129,0.5)',
    transparentColor: 'rgba(16,185,129,0)',
    minScore: 70,
  },
] as const

type ScoreMarkerEntry = {
  marker: mapboxgl.Marker
  root: Root
}

export function Map() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const popupRootRef = useRef<Root | null>(null)
  const scoreMarkersRef = useRef<globalThis.Map<number, ScoreMarkerEntry>>(
    new globalThis.Map(),
  )
  const [viewMode, setViewMode] = useState<MapViewMode>('3d')
  const [selectedIndices, setSelectedIndices] =
    useState<AreaIndexKey[]>(ALL_AREA_INDICES)
  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(MAP_FILTER_DATE_STORAGE_KEY) ?? ''
  })
  const isHistoricalMode = selectedDate !== ''
  const historicalFrom = isHistoricalMode ? `${selectedDate}T00:00:00` : undefined
  const historicalTo = isHistoricalMode ? nextDateString(selectedDate) : undefined
  const { snapshots, isLoading, error, refresh } = useAreaSnapshots({
    liveEnabled: !isHistoricalMode,
    from: historicalFrom,
    to: historicalTo ? `${historicalTo}T00:00:00` : undefined,
    aggregation: 'DAILY',
  })

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date)
    if (date) {
      window.localStorage.setItem(MAP_FILTER_DATE_STORAGE_KEY, date)
      return
    }
    window.localStorage.removeItem(MAP_FILTER_DATE_STORAGE_KEY)
  }, [])

  const toggleSelectedIndex = useCallback((index: AreaIndexKey) => {
    setSelectedIndices((currentIndices) => {
      const isSelected = currentIndices.includes(index)

      if (isSelected && currentIndices.length === 1) return currentIndices

      return isSelected
        ? currentIndices.filter((currentIndex) => currentIndex !== index)
        : [...currentIndices, index]
    })
  }, [])


  // Cleanup function to remove popups and markers when component unmounts or updates
  const openAreaPopup = useCallback((snapshot: AreaSnapshotFromAPI) => {
    const map = mapRef.current
    if (!map) return

    popupRef.current?.remove()

    const popupNode = document.createElement('div')
    const popupRoot = createRoot(popupNode)

    popupRoot.render(<AreaDetailsPopup snapshot={snapshot} />)

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      className: 'atmosphere-area-popup',
      offset: 18,
    })
      .setLngLat([snapshot.longitude, snapshot.latitude])
      .setDOMContent(popupNode)
      .addTo(map)

    popup.on('close', () => {
      deferRootUnmount(popupRoot)
      if (popupRootRef.current === popupRoot) {
        popupRootRef.current = null
      }
      if (popupRef.current === popup) {
        popupRef.current = null
      }
    })

    popupRootRef.current = popupRoot
    popupRef.current = popup
  }, [])


  // Initialize Mapbox map on component mount
  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN

    if (!token) {
      console.error('Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your .env file.')
      return
    }

    mapboxgl.accessToken = token

    if (!mapContainerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-8.6291, 40.6405],                       // Centered on Aveiro (Esgueira), Portugal
      zoom: 13.5,
      pitch: 68,
      bearing: -25,
      antialias: true,
    })

    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }))
    map.addControl(new mapboxgl.FullscreenControl())

    map.on('style.load', () => {
      map.setConfigProperty('basemap', 'lightPreset', 'day')      // Map view styling

      // Add DEM source and set terrain for 3D effect
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        })
      }

      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
      map.setFog({
        color: 'rgb(228, 238, 245)',
        'high-color': 'rgb(190, 215, 230)',
        'horizon-blend': 0.25,
      })

      addAreaSourcesAndLayers(map)
    })

    return () => {
      clearScoreMarkers(scoreMarkersRef.current)
      scoreMarkersRef.current.clear()
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])


  // Update area data and markers when snapshots change or map style loads
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const updateAreaData = () => {
      addAreaSourcesAndLayers(map)
      syncAreaSources(map, snapshots, selectedIndices)
      syncScoreMarkers(
        map,
        snapshots,
        selectedIndices,
        scoreMarkersRef,
        openAreaPopup,
      )
    }

    if (map.isStyleLoaded()) {
      updateAreaData()
      return
    }

    map.once('style.load', updateAreaData)
    return () => {
      map.off('style.load', updateAreaData)
    }
  }, [snapshots, selectedIndices, openAreaPopup])


  // Animate map view when switching between 2D and 3D modes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    map.easeTo({
      pitch: viewMode === '3d' ? 68 : 0,
      bearing: viewMode === '3d' ? -25 : 0,
      duration: 650,
    })
  }, [viewMode])

  return (
    <div className="relative h-[calc(100vh-13rem)] min-h-[420px] w-full">
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        aria-label="3D City Map"
      />

      <div className="pointer-events-none absolute inset-0">
        <AreaMapOverlay
          viewMode={viewMode}
          isLoading={isLoading}
          error={error}
          selectedIndices={selectedIndices}
          selectedDate={selectedDate}
          isHistoricalMode={isHistoricalMode}
          onRefresh={() => void refresh()}
          onSelectedDateChange={setSelectedDate}
          onSelectedIndexToggle={toggleSelectedIndex}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  )
}

function nextDateString(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  parsedDate.setUTCDate(parsedDate.getUTCDate() + 1)
  return parsedDate.toISOString().slice(0, 10)
}


// ------------------------------| Helper functions for managing Mapbox sources, layers, and markers |---------------------------------------

// Adds necessary sources and layers for area polygons and heatmap visualization
function addAreaSourcesAndLayers(map: mapboxgl.Map) {

  // Add sources if they don't exist yet (initially with empty data)
  if (!map.getSource(AREA_POINTS_SOURCE_ID)) {
    map.addSource(AREA_POINTS_SOURCE_ID, {
      type: 'geojson',
      data: toMapboxGeoJsonData(areaSnapshotsToPointCollection([])),
    })
  }

  // Add polygon fill layer for area coloring based on scores
  if (!map.getSource(AREA_POLYGONS_SOURCE_ID)) {
    map.addSource(AREA_POLYGONS_SOURCE_ID, {
      type: 'geojson',
      data: toMapboxGeoJsonData(areaSnapshotsToPolygonCollection([])),
    })
  }

  // Add fill layer for area polygons with color based on score
  if (!map.getLayer(AREA_POLYGON_FILL_LAYER_ID)) {
    map.addLayer({
      id: AREA_POLYGON_FILL_LAYER_ID,
      type: 'fill',
      source: AREA_POLYGONS_SOURCE_ID,
      paint: {
        'fill-color': [
          'step',
          ['get', 'score'],
          '#f43f5e',
          30,
          '#f97316',
          50,
          '#f59e0b',
          70,
          '#10b981',
        ],
        'fill-opacity': 0.18,
      },
    })
  }

  // Add outline layer for area polygons
  if (!map.getLayer(AREA_POLYGON_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: AREA_POLYGON_OUTLINE_LAYER_ID,
      type: 'line',
      source: AREA_POLYGONS_SOURCE_ID,
      paint: {
        'line-color': '#ffffff',
        'line-opacity': 0.75,
        'line-width': 2,
      },
    })
  }

  // Add heatmap layers for area points using the same score ranges as markers
  AREA_HEATMAP_LAYERS.forEach((layer) => {
    if (map.getLayer(layer.id)) return

    map.addLayer({
      id: layer.id,
      type: 'heatmap',
      source: AREA_POINTS_SOURCE_ID,
      filter: getHeatmapScoreFilter(layer.minScore, layer.maxScore),
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': 1.2,
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          45,
          14,
          110,
        ],
        'heatmap-opacity': 0.65,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          layer.transparentColor,
          1,
          layer.color,
        ],
      },
    })
  })
}

function getHeatmapScoreFilter(
  minScore: number,
  maxScore?: number,
): mapboxgl.FilterSpecification {
  if (maxScore === undefined) {
    return ['>=', ['get', 'score'], minScore] as mapboxgl.FilterSpecification
  }

  return [
    'all',
    ['>=', ['get', 'score'], minScore],
    ['<', ['get', 'score'], maxScore],
  ] as mapboxgl.FilterSpecification
}

// Updates the GeoJSON data for area points and polygons based on the latest snapshots
function syncAreaSources(
  map: mapboxgl.Map,
  snapshots: AreaSnapshotFromAPI[],
  selectedIndices: AreaIndexKey[],
) {
  const pointsSource = map.getSource(AREA_POINTS_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined
  const polygonsSource = map.getSource(AREA_POLYGONS_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined

  if (pointsSource) {
    pointsSource.setData(
      toMapboxGeoJsonData(
        areaSnapshotsToPointCollection(snapshots, selectedIndices),
      ),
    )
  }

  if (polygonsSource) {
    polygonsSource.setData(
      toMapboxGeoJsonData(
        areaSnapshotsToPolygonCollection(snapshots, selectedIndices),
      ),
    )
  }
}

// Type assertion helper to ensure data is treated as Mapbox GeoJSON format
function toMapboxGeoJsonData(data: unknown): MapboxGeoJsonData {
  return data as MapboxGeoJsonData
}

// Synchronizes the area score markers on the map with the latest snapshots, creating new markers and removing old ones as needed
function syncScoreMarkers(
  map: mapboxgl.Map,
  snapshots: AreaSnapshotFromAPI[],
  selectedIndices: AreaIndexKey[],
  markersRef: MutableRefObject<globalThis.Map<number, ScoreMarkerEntry>>,
  onSelect: (snapshot: AreaSnapshotFromAPI) => void,
) {
  const visibleAreaIds = new Set<number>()

  snapshots
    .filter(
      (snapshot) =>
        Number.isFinite(snapshot.latitude) &&
        Number.isFinite(snapshot.longitude),
    )
    .forEach((snapshot) => {
      visibleAreaIds.add(snapshot.areaId)

      const existingEntry = markersRef.current.get(snapshot.areaId)
      const score = getFilteredScore(snapshot, selectedIndices)

      if (existingEntry) {
        existingEntry.marker.setLngLat([snapshot.longitude, snapshot.latitude])
        existingEntry.root.render(
          <AreaScoreMarker
            snapshot={snapshot}
            score={score}
            onSelect={onSelect}
          />,
        )
        return
      }

      const markerNode = document.createElement('div')
      const root = createRoot(markerNode)

      root.render(
        <AreaScoreMarker
          snapshot={snapshot}
          score={score}
          onSelect={onSelect}
        />,
      )

      const marker = new mapboxgl.Marker({
        element: markerNode,
        anchor: 'bottom',
        offset: [0, 12],
      })
        .setLngLat([snapshot.longitude, snapshot.latitude])
        .addTo(map)

      markersRef.current.set(snapshot.areaId, { marker, root })
    })

  markersRef.current.forEach((entry, areaId) => {
    if (visibleAreaIds.has(areaId)) return

    disposeScoreMarker(entry)
    markersRef.current.delete(areaId)
  })
}

// Removes all existing score markers from the map and unmounts their React roots to free up resources
function clearScoreMarkers(markers: globalThis.Map<number, ScoreMarkerEntry>) {
  markers.forEach(disposeScoreMarker)
}

function disposeScoreMarker({ marker, root }: ScoreMarkerEntry) {
  marker.remove()
  deferRootUnmount(root)
}

function deferRootUnmount(root: Root) {
  window.setTimeout(() => root.unmount(), 0)
}
