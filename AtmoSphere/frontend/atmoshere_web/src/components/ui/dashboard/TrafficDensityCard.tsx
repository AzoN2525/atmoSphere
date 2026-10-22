import { CarFront } from 'lucide-react'
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

interface TrafficDensityCardProps {
  averageDensity: number | null
  areaName: string
  data: CombinedHistoricalDataPointFromAPI[]
}

export function TrafficDensityCard({
  averageDensity,
  areaName,
  data,
}: TrafficDensityCardProps) {
  const chartData = data.filter((point) => point.trafficDensityK !== null)

  return (
    <MetricCard
      title="Average Traffic Density"
      icon={CarFront}
      value={formatMetric(averageDensity)}
      unit="veh./km"
      subtitle={areaName}
      chart={
        chartData.length < 2 ? (
          <InsufficientHistory />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="timestamp" hide />
              <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip
                labelFormatter={(value) => formatDateLabel(String(value))}
                formatter={(value) => [formatMetric(Number(value)), 'veh./km']}
              />
              <Area
                type="monotone"
                dataKey="trafficDensityK"
                stroke="#d97706"
                fill="#fef3c7"
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
