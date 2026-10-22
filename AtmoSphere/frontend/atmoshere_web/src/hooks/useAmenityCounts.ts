import { useCallback, useEffect, useState } from 'react'
import { fetchAmenityCounts, type AmenityCounts } from '@/services/AmenityService'

const MAX_RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 800

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export function useAmenityCounts(latitude?: number, longitude?: number) {
  const [counts, setCounts] = useState<AmenityCounts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (latitude === undefined || longitude === undefined) return
    setIsLoading(true)
    setError(null)

    try {
      let lastError: Error | null = null

      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        if (signal?.aborted) return

        try {
          const response = await fetchAmenityCounts(latitude, longitude)
          if (signal?.aborted) return

          setCounts(response)
          setError(null)
          return
        } catch (caughtError) {
          lastError =
            caughtError instanceof Error
              ? caughtError
              : new Error('Unable to load amenities')

          if (attempt < MAX_RETRY_ATTEMPTS - 1) {
            await wait(BASE_RETRY_DELAY_MS * 2 ** attempt)
          }
        }
      }

      if (!signal?.aborted) {
        setError(lastError ?? new Error('Unable to load amenities'))
      }
    } catch (caughtError) {
      if (!signal?.aborted) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error('Unable to load amenities'),
        )
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [latitude, longitude])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)

    return () => controller.abort()
  }, [refresh])

  return { counts, isLoading, error, refresh }
}
