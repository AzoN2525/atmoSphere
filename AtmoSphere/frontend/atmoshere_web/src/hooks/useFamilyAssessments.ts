import { useCallback, useEffect, useState } from 'react'
import { getAllFamilyAssessments } from '@/services/FamilyAssessmentService'
import type { FamilyAssessmentFromAPI } from '@/types/area'

export function useFamilyAssessments(from?: string, to?: string) {
  const [assessments, setAssessments] = useState<FamilyAssessmentFromAPI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAllFamilyAssessments(from, to)
      setAssessments(data)
      setError(null)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('Failed to load family assessments'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [from, to])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    assessments,
    isLoading,
    error,
    refresh,
  }
}
