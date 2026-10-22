import { createFileRoute } from '@tanstack/react-router'
import { Map } from '../components/ui/map/Map'
import { FamilyRankingSection } from '../components/ui/family/FamilyRankingSection'
import { HistoricalAnalysisSection } from '../components/ui/historical/HistoricalAnalysisSection'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-5 pt-4">
      <section className="space-y-2">
        {/* Map card */}
        <div className="overflow-hidden rounded-lg border-2 border-primary/30 bg-surface-container-lowest shadow-ambient ring-1 ring-primary/10">
          {/* Header strip */}
          <div className="flex items-center gap-2 border-b border-primary/15 bg-primary/5 px-4 py-2.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              3D Map View
            </span>
          </div>
          <Map />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
          <FamilyRankingSection />
          <HistoricalAnalysisSection />
        </div>
      </section>
    </main>
  )
}