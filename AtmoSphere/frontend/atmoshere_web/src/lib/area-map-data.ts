import type { AreaSnapshotFromAPI } from '@/types/area'

export type AreaIndexKey = 'air' | 'noise' | 'traffic'

export const AREA_INDEX_WEIGHTS: Record<AreaIndexKey, number> = {
  air: 0.4,
  noise: 0.35,
  traffic: 0.25,
}

type AreaPointFeature = {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: AreaMapProperties
}

type AreaPolygonFeature = {
  type: 'Feature'
  geometry: Record<string, unknown>
  properties: AreaMapProperties
}

type FeatureCollection<TFeature> = {
  type: 'FeatureCollection'
  features: TFeature[]
}

type AreaMapProperties = {
  score: number
}

export function areaSnapshotsToPointCollection(
  snapshots: AreaSnapshotFromAPI[],
  selectedIndices: AreaIndexKey[] = ['air', 'noise', 'traffic'],
): FeatureCollection<AreaPointFeature> {
  return {
    type: 'FeatureCollection',
    features: snapshots
      .filter(hasValidCoordinates)
      .map((snapshot) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [snapshot.longitude, snapshot.latitude],
        },
        properties: snapshotToProperties(snapshot, selectedIndices),
      })),
  }
}

export function areaSnapshotsToPolygonCollection(
  snapshots: AreaSnapshotFromAPI[],
  selectedIndices: AreaIndexKey[] = ['air', 'noise', 'traffic'],
): FeatureCollection<AreaPolygonFeature> {
  return {
    type: 'FeatureCollection',
    features: snapshots.flatMap((snapshot) => {
      const geometry = parseGeometry(snapshot.geometryGeoJson)

      if (!geometry) return []

      return [
        {
          type: 'Feature' as const,
          geometry,
          properties: snapshotToProperties(snapshot, selectedIndices),
        },
      ]
    }),
  }
}

export function getScoreColor(score: number) {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  if (score >= 30) return '#f97316'
  return '#f43f5e'
}

export function getScoreLabel(score: number | null) {
  return Math.round(score ?? 0)
}

export function getFilteredScore(
  snapshot: AreaSnapshotFromAPI,
  selectedIndices: AreaIndexKey[],
) {
  if (selectedIndices.length === 3) {
    return getScoreLabel(snapshot.overallIndex)
  }

  const selectedValues = selectedIndices
    .map((index) => ({
      value: getSnapshotIndexValue(snapshot, index),
      weight: AREA_INDEX_WEIGHTS[index],
    }))
    .filter(({ value }) => value !== null)

  if (selectedValues.length === 0) return 0

  const weightedScore = selectedValues.reduce(
    (total, { value, weight }) => total + value * weight,
    0,
  )
  const selectedWeight = selectedValues.reduce(
    (total, { weight }) => total + weight,
    0,
  )

  return getScoreLabel(weightedScore / selectedWeight)
}

function hasValidCoordinates(snapshot: AreaSnapshotFromAPI) {
  return Number.isFinite(snapshot.latitude) && Number.isFinite(snapshot.longitude)
}

function snapshotToProperties(
  snapshot: AreaSnapshotFromAPI,
  selectedIndices: AreaIndexKey[],
): AreaMapProperties {
  return {
    score: getFilteredScore(snapshot, selectedIndices),
  }
}

function getSnapshotIndexValue(
  snapshot: AreaSnapshotFromAPI,
  index: AreaIndexKey,
) {
  if (index === 'air') return snapshot.airQualityIndex
  if (index === 'noise') return snapshot.noiseIndex
  return snapshot.trafficIndex
}

function parseGeometry(geometryGeoJson: string) {
  try {
    const parsed = JSON.parse(geometryGeoJson) as Record<string, unknown>
    const type = parsed.type

    if (type === 'Polygon' || type === 'MultiPolygon') return parsed

    if (type === 'Feature') {
      const geometry = parsed.geometry
      if (isPolygonGeometry(geometry)) return geometry
    }

    return null
  } catch {
    return null
  }
}

function isPolygonGeometry(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false

  const type = (value as { type?: unknown }).type
  return type === 'Polygon' || type === 'MultiPolygon'
}
