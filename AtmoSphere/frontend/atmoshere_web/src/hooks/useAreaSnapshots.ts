import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getAllAreaSnapshots,
  getHistoricalAreaSnapshots,
} from '@/services/AreaSnapshotService'
import type { AreaSnapshotFromAPI } from '@/types/area'

type UseAreaSnapshotsOptions = {
  liveEnabled?: boolean
  from?: string
  to?: string
  aggregation?: 'HOURLY' | 'DAILY' | 'MONTHLY'
  refreshIntervalMs?: number
}

function buildSseUrl() {
  const apiUrl =
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    'http://localhost:8080/api'
  const normalizedApiUrl = String(apiUrl).replace(/\/$/, '')
  const baseUrl = normalizedApiUrl.endsWith('/v1')
    ? normalizedApiUrl
    : `${normalizedApiUrl}/v1`

  return `${baseUrl}/realtimedata`
}

export function useAreaSnapshots(
  optionsOrRefreshInterval: UseAreaSnapshotsOptions | number = {},
) {
  const {
    liveEnabled = true,
    from,
    to,
    aggregation = 'DAILY',
    refreshIntervalMs = 0,
  } =
    typeof optionsOrRefreshInterval === 'number'
      ? { refreshIntervalMs: optionsOrRefreshInterval }
      : optionsOrRefreshInterval
  const [snapshots, setSnapshots] = useState<AreaSnapshotFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const data =
        liveEnabled || !from || !to
          ? await getAllAreaSnapshots()
          : await getHistoricalAreaSnapshots({ from, to, aggregation })
      setSnapshots(data)
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load area snapshots'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [aggregation, from, liveEnabled, to])

  useEffect(() => {
    void refresh()

    if (!liveEnabled) {
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      return
    }

    const eventSource = new EventSource(buildSseUrl(), {
      withCredentials: true,
    })
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setError(null)
    }

    const handleSnapshotUpdate = (event: Event) => {
      try {
        const messageEvent = event as MessageEvent<string>
       
        const updatedSnapshot = JSON.parse(
          messageEvent.data,
        ) as AreaSnapshotFromAPI
        setSnapshots((currentSnapshots) => {
          const exists = currentSnapshots.some(
            (snapshot) => snapshot.areaId === updatedSnapshot.areaId,
          )
          const newSnapshots = exists
            ? currentSnapshots.map((snapshot) =>
                snapshot.areaId === updatedSnapshot.areaId ? updatedSnapshot : snapshot,
              )
            : [...currentSnapshots, updatedSnapshot]

          // console.log(
          //   'Received snapshot update via SSE:',
          //   updatedSnapshot,
          //   'last snapshots:',
          //   currentSnapshots,
          //   'new snapshots:',
          //   newSnapshots,
          // )

          return newSnapshots
        })
      } catch {
        void refresh()
      }
    }

    eventSource.addEventListener('snapshot-update', handleSnapshotUpdate)

    eventSource.onerror = () => {
      setError(new Error('SSE connection lost'))
    }

    let intervalId: number | undefined
    if (refreshIntervalMs > 0) {
      intervalId = window.setInterval(() => {
        void refresh()
      }, refreshIntervalMs)
    }

    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId)
      eventSource.removeEventListener('snapshot-update', handleSnapshotUpdate)
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [refresh, refreshIntervalMs])

  return {
    snapshots,
    isLoading,
    error,
    refresh,
  }
}
