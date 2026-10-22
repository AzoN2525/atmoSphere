import { apiClient } from '@/lib/api-client'
import type { FamilyAssessmentFromAPI } from '@/types/area'

const buildQueryString = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value)
  })
  const query = searchParams.toString()
  return query.length ? `?${query}` : ''
}

export const getAllFamilyAssessments = async (
  from?: string,
  to?: string,
): Promise<FamilyAssessmentFromAPI[]> => {
  const query = buildQueryString({ from, to })
  return (await apiClient.get<FamilyAssessmentFromAPI[]>(`/areas/family-assessment${query}`)) ?? []
}
