import { Volume2 } from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CombinedHistoricalDataPointFromAPI } from '@/types/dashboard'

interface NoiseLevelCardProps {
  averageLeq: number | null
  areaName: string
  data: CombinedHistoricalDataPointFromAPI[]
}

export function NoiseLevelCard({
  averageLeq,
  areaName,
  data,
}: NoiseLevelCardProps) {
  const chartData = data.filter((point) => point.noiseLeq !== null)

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 text-slate-800">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Volume2 className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-extrabold">Average Noise Level</h2>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold leading-none text-slate-900">
              {formatMetric(averageLeq)}
            </span>
            <span className="pb-1 text-lg font-bold text-slate-600">dB</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {areaName}
          </p>
        </div>
      </div>

      {chartData.length < 2 ? (
        <InsufficientHistory />
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatAxisLabel(String(value))}
                minTickGap={24}
              />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                labelFormatter={(value) => formatTooltipLabel(String(value))}
                formatter={(value) => [formatMetric(Number(value)), 'dB']}
              />
              <Bar dataKey="noiseLeq" fill="#bae6fd" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="noiseLeq"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}

function formatMetric(value: number | null) {
  return value === null ? '—' : value.toFixed(1)
}

function formatAxisLabel(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
  })
}

function formatTooltipLabel(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function InsufficientHistory() {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
      Not enough history
    </div>
  )
}
