import { useState } from 'react'
import { useHistoricalAnalysis } from '@/hooks/useHistoricalAnalysis'
import { useDateRange } from '@/hooks/useDateRange'
import { TrendsControls } from './TrendsControls'
import { HistoricalChart } from './HistoricalChart'
import { CustomDateRangePicker } from './CustomDateRangePicker'
import { ReportModal } from './ReportModal'
import type { AreaFromAPI } from '@/types/area'

interface HistoricalTrendsViewProps {
  areas: AreaFromAPI[]
  areasLoading: boolean
  selectedAreaId: number | null
  onAreaChange: (id: number) => void
}

export function HistoricalTrendsView({ areas, areasLoading, selectedAreaId, onAreaChange }: HistoricalTrendsViewProps) {
  const [showReport, setShowReport] = useState(false)

  const {
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
  } = useDateRange()

  const { history, isLoading, error, refresh } = useHistoricalAnalysis({
    areaId: selectedAreaId,
    from: isCustomRangeValid ? from : '',
    to: isCustomRangeValid ? to : '',
    aggregation,
  })

  const data = history?.data ?? []
  const selectedAreaName = areas.find((a) => a.id === selectedAreaId)?.name ?? '…'

  return (
    <div className="space-y-4">
      <TrendsControls
        areas={areas}
        areasLoading={areasLoading}
        selectedAreaId={selectedAreaId}
        onAreaChange={onAreaChange}
        rangeMode={rangeMode}
        onRangeChange={handleRangeChange}
        isLoading={isLoading}
        isCustomRangeValid={isCustomRangeValid}
        onRefresh={() => void refresh()}
        hasData={data.length > 0}
        onOpenReport={() => setShowReport(true)}
      />

      {rangeMode === 'CUSTOM' ? (
        <CustomDateRangePicker
          from={customFrom}
          to={customTo}
          onFromChange={setCustomFrom}
          onToChange={setCustomTo}
        />
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          Unable to load historical data.
        </div>
      ) : null}

      <HistoricalChart
        data={data}
        areaName={selectedAreaName}
        aggregation={aggregation}
        onAggregationChange={setAggregation}
        isLoading={isLoading}
      />

      {showReport ? (
        <ReportModal
          areaId={selectedAreaId}
          areaName={selectedAreaName}
          from={from}
          to={to}
          aggregation={aggregation}
          data={data}
          onClose={() => setShowReport(false)}
        />
      ) : null}
    </div>
  )
}
