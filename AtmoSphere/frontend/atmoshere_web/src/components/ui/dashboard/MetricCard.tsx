import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  icon: LucideIcon
  value: string
  subtitle: string
  unit?: string
  status?: string
  chart?: ReactNode
}

export function MetricCard({
  title,
  icon: Icon,
  value,
  subtitle,
  unit,
  status,
  chart,
}: MetricCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[11rem] gap-4 p-5 md:grid-cols-[minmax(13rem,0.9fr)_1.1fr] md:items-end">
        <div>
          <div className="mb-4 flex items-center gap-3 text-slate-800">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-extrabold">{title}</h2>
          </div>

          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <span className="text-4xl font-extrabold leading-none text-slate-900">
              {value}
            </span>
            {unit ? (
              <span className="pb-1 text-lg font-bold text-slate-600">
                {unit}
              </span>
            ) : null}
            {status ? (
              <span className="pb-1 text-base font-bold text-slate-600">
                {status}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="h-32 min-w-0">{chart}</div>
      </div>
    </article>
  )
}
