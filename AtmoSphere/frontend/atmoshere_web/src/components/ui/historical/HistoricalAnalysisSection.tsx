import { useState } from 'react'
import { useAreas } from '@/hooks/useAreas'
import { HistoricalTrendsView } from './HistoricalTrendsView'
import { AreaComparisonView } from './AreaComparisonView'
import type { TabId } from './historical-utils'

const TABS: TabId[] = ['trends', 'comparison']

export function HistoricalAnalysisSection() {
  const [activeTab, setActiveTab] = useState<TabId>('trends')
  const { areas, areasLoading, selectedAreaId, setSelectedAreaId } = useAreas()

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
          Environmental Data Analysis
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Analyze historical environmental data to identify long-term{' '}
          <strong className="font-bold text-slate-700">trends</strong>
        </p>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm hover:cursor-pointer font-bold transition ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'trends' ? 'Historical Trends' : 'Area Comparison'}
          </button>
        ))}
      </div>

      {activeTab === 'trends' ? (
        <HistoricalTrendsView
          areas={areas}
          areasLoading={areasLoading}
          selectedAreaId={selectedAreaId}
          onAreaChange={setSelectedAreaId}
        />
      ) : (
        <AreaComparisonView areas={areas} areasLoading={areasLoading} />
      )}
    </article>
  )
}
