import { useEffect, useState } from 'react'
import { getAllAreas } from '@/services/AreaService'
import type { AreaFromAPI } from '@/types/area'

export function useAreas() {
  const [areas, setAreas] = useState<AreaFromAPI[]>([])
  const [areasLoading, setAreasLoading] = useState(true)
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)

  useEffect(() => {
    const loadAreas = async () => {
      setAreasLoading(true)
      try {
        const fetchedAreas = await getAllAreas()
        setAreas(fetchedAreas)
        if (fetchedAreas.length > 0) {
          setSelectedAreaId(fetchedAreas[0].id)
        }
      } catch (caughtError) {
        console.error('Failed to load areas:', caughtError)
      } finally {
        setAreasLoading(false)
      }
    }
    loadAreas().catch(console.error)
  }, [])

  return { areas, areasLoading, selectedAreaId, setSelectedAreaId }
}
