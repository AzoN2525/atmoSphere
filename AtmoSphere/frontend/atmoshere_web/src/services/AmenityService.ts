import { apiClient } from '@/lib/api-client'

export interface AmenityCounts {
  schools: number
  museums: number
  hospitals: number
  parks: number
}

export const fetchAmenityCounts = async (
  latitude: number,
  longitude: number,
): Promise<AmenityCounts> => {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  })

  return (
    (await apiClient.get<AmenityCounts>(`/areas/amenities?${query}`)) ?? {
      schools: 0,
      museums: 0,
      hospitals: 0,
      parks: 0,
    }
  )
}
