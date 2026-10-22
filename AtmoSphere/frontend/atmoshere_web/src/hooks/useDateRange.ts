import { useMemo, useState } from 'react'
import {
  buildRange,
  daysAgoString,
  todayString,
} from '@/components/ui/historical/historical-utils'
import type { RangeMode } from '@/components/ui/historical/historical-utils'
import type { AggregationPeriod } from '@/types/dashboard'

export function useDateRange() {
  const [rangeMode, setRangeMode] = useState<RangeMode>('LAST_30_DAYS')
  const [customFrom, setCustomFrom] = useState<string>(() => daysAgoString(30))
  const [customTo, setCustomTo] = useState<string>(() => todayString())
  const [aggregation, setAggregation] = useState<AggregationPeriod>('DAILY')

  const { from, to } = useMemo(() => {
    if (rangeMode === 'CUSTOM') {
      return {
        from: customFrom ? `${customFrom}T00:00:00` : '',
        to: customTo ? `${customTo}T23:59:59` : '',
      }
    }
    return buildRange(rangeMode)
  }, [rangeMode, customFrom, customTo])

  const isCustomRangeValid =
    rangeMode !== 'CUSTOM' ||
    (customFrom !== '' && customTo !== '' && customFrom <= customTo)

  const handleRangeChange = (mode: RangeMode) => {
    setRangeMode(mode)
    if (mode !== 'CUSTOM') {
      setAggregation(mode === 'LAST_24_HOURS' ? 'HOURLY' : 'DAILY')
    }
  }

  return {
    rangeMode,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    from,
    to,
    isCustomRangeValid,
    handleRangeChange,
    aggregation,
    setAggregation,
  }
}
