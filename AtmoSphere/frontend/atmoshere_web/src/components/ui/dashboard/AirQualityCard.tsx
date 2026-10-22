import { Cloud } from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MetricCard } from './MetricCard'
import type { CombinedHistoricalDataPointFromAPI } from '@/types/dashboard'

interface AirQualityCardProps {
  averageAqi: number | null
  areaName: string
  data: CombinedHistoricalDataPointFromAPI[]
}

export function AirQualityCard({
  averageAqi,
  areaName,
  data,
}: AirQualityCardProps) {
  const chartData = data.filter((point) => point.airQualityIndex !== null)

  return (
    <MetricCard
      title="Average Air Quality by Area"
      icon={Cloud}
      value={formatMetric(averageAqi)}
      status={getAqiLabel(averageAqi)}
      subtitle={areaName}
      chart={
        chartData.length < 2 ? (
          <InsufficientHistory />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                labelFormatter={(value) => formatDateLabel(String(value))}
                formatter={(value) => [formatMetric(Number(value)), 'AQI']}
              />
              <Area
                type="monotone"
                dataKey="airQualityIndex"
                stroke="#0f766e"
                fill="#ccfbf1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      }
    />
  )
}

function formatMetric(value: number | null) {
  return value === null ? '—' : value.toFixed(1)
}

function getAqiLabel(value: number | null) {
  if (value === null) return undefined
  if (value <= 20) return 'Good'
  if (value <= 40) return 'Fair'
  if (value <= 60) return 'Moderate'
  if (value <= 80) return 'Poor'
  return 'Very poor'
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function InsufficientHistory() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
      Not enough history
    </div>
  )
}
