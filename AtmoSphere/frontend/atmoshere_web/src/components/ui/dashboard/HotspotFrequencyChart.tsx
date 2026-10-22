import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HotspotFrequencyPointFromAPI } from '@/types/dashboard'

interface HotspotFrequencyChartProps {
  data: HotspotFrequencyPointFromAPI[]
}

export function HotspotFrequencyChart({ data }: HotspotFrequencyChartProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-extrabold text-slate-800">
          Detected Hotspot Frequency
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Areas in hotspot by indicator type
        </p>
      </div>

      {data.length < 2 ? (
        <InsufficientHistory />
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatAxisLabel(String(value))}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} />
              <Tooltip
                labelFormatter={(value) => formatTooltipLabel(String(value))}
              />
              <Legend />
              <Bar
                dataKey="airQualityCount"
                name="Air quality"
                fill="#0f766e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="noiseCount"
                name="Noise"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="trafficCount"
                name="Traffic"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
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
    <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
      Not enough hotspot history
    </div>
  )
}
