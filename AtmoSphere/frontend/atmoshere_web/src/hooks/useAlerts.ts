import { useCallback, useEffect, useState } from 'react'
import { getAlerts } from '@/services/AlertService'
import type { AlertFromAPI } from '@/types/alerts'
import type { IndicatorType } from '@/types/area'

type RangePreset = 'CURRENT' | 'LAST_24_HOURS' | 'LAST_7_DAYS' | 'LAST_30_DAYS'

function buildDateRange(range: RangePreset) {
  const to = new Date()
  const from = new Date(to)

  switch (range) {
    case 'CURRENT':
      from.setHours(from.getHours() - 1)
      break
    case 'LAST_24_HOURS':
      from.setDate(from.getDate() - 1)
      break
    case 'LAST_7_DAYS':
      from.setDate(from.getDate() - 7)
      break
    case 'LAST_30_DAYS':
      from.setDate(from.getDate() - 30)
      break
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}

function dedupeAlerts(alerts: AlertFromAPI[]) {
  const seen = new Map<number, AlertFromAPI>()
  alerts.forEach((a) => seen.set(a.id, a))
  return Array.from(seen.values())
}

export function useAlerts(
  areaId: number | null,
  indicatorTypes: IndicatorType[],
  range: RangePreset,
) {
  const [alerts, setAlerts] = useState<AlertFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastAlert, setLastAlert] = useState<AlertFromAPI | null>(null)

  const refreshAlerts = useCallback(async () => {
    if (areaId === null) {
      setAlerts([])
      return
    }

    setIsLoading(true)
    try {
      const rangeObj = buildDateRange(range)
      const types = indicatorTypes.length > 0 ? indicatorTypes : undefined

      const requestList = (types ?? ['AIR_QUALITY', 'NOISE', 'TRAFFIC']).map((t) =>
        // t may already be an IndicatorType; cast to any to satisfy service signature
        getAlerts({ areaId, indicatorType: t as any, from: rangeObj.from, to: rangeObj.to }),
      )

      const groups = await Promise.all(requestList)
      const merged = dedupeAlerts(groups.flat())
      merged.sort((l, r) => {
        const ld = l.triggeredAt ? new Date(l.triggeredAt).getTime() : 0
        const rd = r.triggeredAt ? new Date(r.triggeredAt).getTime() : 0
        return rd - ld
      })

      setAlerts(merged)
    } catch (err) {
      console.error('Failed to load alerts', err)
    } finally {
      setIsLoading(false)
    }
  }, [areaId, indicatorTypes, range])

  useEffect(() => {
    void refreshAlerts()
  }, [refreshAlerts])

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
    const normalized = String(apiUrl).replace(/\/$/, '')
    const base = normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
    const sseUrl = `${base}/sse/alerts`

    const es = new EventSource(sseUrl)

    const handleCreated = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as AlertFromAPI
        // Always set lastAlert for toast
        setLastAlert(payload)
        // Only add to alerts list if from selected area
        if (areaId !== null && payload.areaId === areaId) {
          setAlerts((current) => {
            if (current.some((a) => a.id === payload.id)) return current
            return dedupeAlerts([payload, ...current])
          })
        }
      } catch (err) {
        console.error('Failed to parse alert SSE payload', err)
      }
    }

    es.addEventListener('alert.created', handleCreated as EventListener)
    es.onopen = () => console.info('Connected to alerts SSE')
    es.onerror = (e) => console.warn('Alerts SSE error', e)

    return () => {
      try {
        es.removeEventListener('alert.created', handleCreated as EventListener)
        es.close()
      } catch {
        /* ignore */
      }
    }
  }, [areaId])

  return { alerts, setAlerts, isLoading, refreshAlerts, lastAlert }
}

export default useAlerts
