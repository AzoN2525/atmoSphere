import type { DashboardRangePreset } from '@/types/dashboard'

export type TabId = 'trends' | 'comparison'
export type RangeMode = DashboardRangePreset | 'CUSTOM'

export const RANGE_OPTIONS: Array<{ value: RangeMode; label: string }> = [
  { value: 'LAST_24_HOURS', label: 'Last 24 hours' },
  { value: 'LAST_7_DAYS', label: 'Last 7 days' },
  { value: 'LAST_30_DAYS', label: 'Last 30 days' },
  { value: 'CUSTOM', label: 'Custom range' },
]

export function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function daysAgoString(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function buildRange(preset: DashboardRangePreset) {
  const to = new Date()
  const from = new Date(to)

  switch (preset) {
    case 'LAST_24_HOURS':
      from.setHours(from.getHours() - 24)
      break
    case 'LAST_7_DAYS':
      from.setDate(from.getDate() - 7)
      break
    case 'LAST_30_DAYS':
      from.setDate(from.getDate() - 30)
      break
    default:
      from.setDate(from.getDate() - 30)
  }

  return {
    from: toLocalDateTimeString(from),
    to: toLocalDateTimeString(to),
  }
}

export function toLocalDateTimeString(date: Date) {
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatAxisLabel(
  value: string,
  aggregation: 'HOURLY' | 'DAILY' | 'MONTHLY' = 'DAILY',
) {
  const date = new Date(value)
  if (aggregation === 'MONTHLY') {
    return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
}

export function formatTooltipLabel(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
