import { CalendarDays } from 'lucide-react'
import { todayString } from './historical-utils'

interface CustomDateRangePickerProps {
  from: string
  to: string
  onFromChange: (date: string) => void
  onToChange: (date: string) => void
}

export function CustomDateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: CustomDateRangePickerProps) {
  const isInvalid = from !== '' && to !== '' && from > to

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <CalendarDays
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-slate-400">From</span>
        <input
          type="date"
          value={from}
          max={to || todayString()}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
        />
      </label>

      <label
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
          isInvalid ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
        }`}
      >
        <CalendarDays
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-slate-400">To</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={todayString()}
          onChange={(e) => onToChange(e.target.value)}
          className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
        />
      </label>

      {isInvalid ? (
        <p className="col-span-2 -mt-1 text-xs font-semibold text-rose-600">
          End date must be after start date.
        </p>
      ) : null}
    </div>
  )
}
