import { AlertTriangle } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HotspotFrequencyPointFromAPI } from '@/types/dashboard'

interface HotspotsTrendChartProps {
  data: HotspotFrequencyPointFromAPI[]
}

export function HotspotsTrendChart({ data }: HotspotsTrendChartProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-xl bg-rose-50 p-2 text-rose-500">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-extrabold text-slate-800">
          Detected Hotspots
        </h2>
      </div>

      {data.length < 2 ? (
        <InsufficientHistory />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatAxisLabel(String(value))}
                minTickGap={24}
              />
              <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} />
              <Tooltip
                labelFormatter={(value) => formatTooltipLabel(String(value))}
                formatter={(value) => [String(value), 'Hotspots']}
              />
              <Area
                type="monotone"
                dataKey="hotspotCount"
                stroke="#0f766e"
                fill="#ccfbf1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
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
    <div className="flex h-72 items-center justify-center rounded-xl bg-slate-50 text-sm font-semibold text-slate-400">
      Not enough hotspot history
    </div>
  )
}
