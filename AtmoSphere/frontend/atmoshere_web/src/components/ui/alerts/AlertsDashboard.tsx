import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  Filter,
  MapPin,
  X,
  Save,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import useAlerts from '@/hooks/useAlerts'
import { getAllAreas } from '@/services/AreaService'
import { getThresholdsByArea, saveThreshold } from '@/services/AlertService'
import type { AlertFromAPI, AlertThresholdFromAPI } from '@/types/alerts'
import type { AreaFromAPI, IndicatorType } from '@/types/area'

type RangePreset = 'CURRENT' | 'LAST_24_HOURS' | 'LAST_7_DAYS' | 'LAST_30_DAYS'

const INDICATOR_CONFIG: Array<{
  type: IndicatorType
  label: string
  shortLabel: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
}> = [
  {
    type: 'AIR_QUALITY',
    label: 'Qualidade do Ar',
    shortLabel: 'Ar',
    unit: 'ppm',
    min: 0,
    max: 1000,
    step: 10,
    defaultValue: 800,
  },
  {
    type: 'NOISE',
    label: 'Ruído',
    shortLabel: 'Ruído',
    unit: 'dB',
    min: 30,
    max: 120,
    step: 1,
    defaultValue: 65,
  },
  {
    type: 'TRAFFIC',
    label: 'Tráfego',
    shortLabel: 'Tráfego',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 40,
  },
]

const RANGE_OPTIONS: Array<{ value: RangePreset; label: string }> = [
  { value: 'CURRENT', label: 'Última hora' },
  { value: 'LAST_24_HOURS', label: 'Últimas 24 horas' },
  { value: 'LAST_7_DAYS', label: 'Últimos 7 dias' },
  { value: 'LAST_30_DAYS', label: 'Últimos 30 dias' },
]

const SEVERITY_OPTIONS: Array<'ALL' | NonNullable<AlertFromAPI['severity']>> = [
  'ALL',
  'HIGH',
  'MEDIUM',
  'LOW',
]

export function AlertsDashboard() {
  const [areas, setAreas] = useState<AreaFromAPI[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>(
    INDICATOR_CONFIG.map((config) => config.type),
  )
  const [selectedRange, setSelectedRange] = useState<RangePreset>('LAST_7_DAYS')
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | NonNullable<AlertFromAPI['severity']>>(
    'ALL',
  )
  const [, setThresholds] = useState<AlertThresholdFromAPI[]>([])
  const { alerts, isLoading: isLoadingAlerts, refreshAlerts, lastAlert } = useAlerts(
    selectedAreaId,
    selectedIndicators,
    selectedRange,
  )

  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    if (!lastAlert) return
    setToastVisible(true)
    const t = setTimeout(() => setToastVisible(false), 6000)
    return () => clearTimeout(t)
  }, [lastAlert])
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<IndicatorType, number>>(
    buildDefaultThresholdDrafts(),
  )
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertFromAPI | null>(null)
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(false)
  const [isSavingThresholds, setIsSavingThresholds] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadAreas = async () => {
      setIsLoadingAreas(true)
      try {
        const data = await getAllAreas()
        setAreas(data)
        setSelectedAreaId((currentSelectedAreaId) => currentSelectedAreaId ?? data[0]?.id ?? null)
      } catch (caughtError) {
        console.error('Error loading areas:', caughtError)
        setError('Não foi possível carregar as áreas.')
      } finally {
        setIsLoadingAreas(false)
      }
    }

    void loadAreas()
  }, [])

  useEffect(() => {
    const loadThresholds = async () => {
      if (selectedAreaId === null) {
        setThresholds([])
        setThresholdDrafts(buildDefaultThresholdDrafts())
        return
      }

      setIsLoadingThresholds(true)
      try {
        const data = await getThresholdsByArea(selectedAreaId)
        setThresholds(data)
        setThresholdDrafts(buildThresholdDrafts(data))
      } catch (caughtError) {
        console.error('Error loading thresholds:', caughtError)
        setError('Não foi possível carregar os limites da área selecionada.')
      } finally {
        setIsLoadingThresholds(false)
      }
    }

    void loadThresholds()
  }, [selectedAreaId])

  const selectedArea = useMemo(
    () => areas.find((area) => area.id === selectedAreaId) ?? null,
    [areas, selectedAreaId],
  )

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status === 'ACTIVE'),
    [alerts],
  )

  const visibleAlerts = useMemo(
    () =>
      activeAlerts.filter((alert) => {
        if (selectedSeverity !== 'ALL' && alert.severity !== selectedSeverity) {
          return false
        }

        // Apply indicator-type filter when one or more indicators are selected
        if (selectedIndicators.length > 0 && !selectedIndicators.includes(alert.indicatorType)) {
          return false
        }

        return true
      }),
    [activeAlerts, selectedSeverity, selectedIndicators],
  )

  

  useEffect(() => {
    // keep selectedAlertId in sync after a refresh
    if (!alerts) return
    const mergedActiveAlerts = alerts.filter((alert) => alert.status === 'ACTIVE')
    setSelectedAlertId((currentSelectedAlertId) =>
      currentSelectedAlertId !== null &&
      mergedActiveAlerts.some((alert) => alert.id === currentSelectedAlertId)
        ? currentSelectedAlertId
        : mergedActiveAlerts[0]?.id ?? null,
    )
  }, [alerts])

  // SSE + fetching moved to `useAlerts` hook

  async function handleSaveThresholds() {
    if (selectedAreaId === null) return

    setIsSavingThresholds(true)
    setStatusMessage(null)
    try {
      const updates = await Promise.all(
        INDICATOR_CONFIG.map((config) =>
          saveThreshold({
            areaId: selectedAreaId,
            indicatorType: config.type,
            thresholdValue: thresholdDrafts[config.type],
            unit: config.unit,
          }),
        ),
      )

      setThresholds(updates)
      setThresholdDrafts(buildThresholdDrafts(updates))
      setStatusMessage('Limites guardados com sucesso.')
      setError(null)
    } catch (caughtError) {
      console.error('Error saving thresholds:', caughtError)
      setError('Não foi possível guardar os limites.')
    } finally {
      setIsSavingThresholds(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {toastVisible && lastAlert ? (
        <div className="fixed right-6 top-6 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Novo alerta — {getIndicatorLabel(lastAlert.indicatorType)}</div>
              <div className="mt-1 text-xs text-slate-500">{lastAlert.areaName} • {formatMeasuredValue(lastAlert.measuredValue, lastAlert.unit)}</div>
            </div>
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAlertForModal(lastAlert)
                  setSelectedAlertId(lastAlert.id)
                  setToastVisible(false)
                }}
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
              >
                Ver
              </button>
              <button
                type="button"
                onClick={() => setToastVisible(false)}
                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="mb-5 space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-2 inline-flex rounded-full bg-primary px-2 py-1 text-xs font-semibold uppercase tracking-widest text-white">
              Alerts
            </span>
            <h1 className="text-xl font-semibold text-slate-900">
              Painel de Alertas Ambientais
            </h1>
            <p className="text-sm text-slate-600">
              Gere e acompanhe alertas críticos, thresholds e condições ambientais em tempo real.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {activeAlerts.length} alertas ativos
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border-2 border-primary/25 bg-linear-to-br from-primary/5 via-white to-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex rounded-full bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
              Área selecionada
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Escolha a área geográfica</h2>
            <p className="text-sm text-slate-600">
              Este filtro controla os alertas, thresholds e o detalhe mostrado mais abaixo.
            </p>
          </div>

          <label className="grid w-full gap-2 lg:max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Área geográfica
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-white px-4 py-4 shadow-sm">
              <MapPin className="size-5 shrink-0 text-primary" />
              <select
                value={selectedAreaId ?? ''}
                onChange={(event) =>
                  setSelectedAreaId(event.target.value ? Number(event.target.value) : null)
                }
                className="w-full bg-transparent text-base font-semibold text-slate-800 outline-none"
                disabled={isLoadingAreas || areas.length === 0}
              >
                {areas.length === 0 ? <option value="">Sem áreas</option> : null}
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_1.2fr_1fr_auto]">
          <div className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tipo de indicador
            </span>
            <div className="grid grid-cols-3 gap-2">
              {INDICATOR_CONFIG.map((config) => {
                const selected = selectedIndicators.includes(config.type)
                return (
                  <button
                    key={config.type}
                    type="button"
                    onClick={() =>
                      setSelectedIndicators((current) =>
                        selected
                          ? current.filter((type) => type !== config.type)
                          : [...current, config.type],
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {config.shortLabel}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Intervalo de datas
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <CalendarDays className="size-4 shrink-0 text-primary" />
              <select
                value={selectedRange}
                onChange={(event) => setSelectedRange(event.target.value as RangePreset)}
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="button"
            onClick={() => void refreshAlerts()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoadingAlerts}
          >
            <Filter className="size-4" />
            {isLoadingAlerts ? 'A filtrar...' : 'Filtrar'}
          </button>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-primary/15 bg-primary/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Configuração de Limites</h2>
            <p className="text-sm text-slate-600">
              Ajuste os thresholds por área para qualidade do ar, ruído e tráfego.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
            {selectedArea?.name ?? 'Selecione uma área'}
          </div>
        </div>

        <div className="space-y-4 p-4 lg:p-5">
          {isLoadingThresholds ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
              A carregar thresholds...
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            {INDICATOR_CONFIG.map((config) => (
              <ThresholdCard
                key={config.type}
                config={config}
                value={thresholdDrafts[config.type]}
                onChange={(nextValue) =>
                  setThresholdDrafts((current) => ({
                    ...current,
                    [config.type]: nextValue,
                  }))
                }
                disabled={selectedAreaId === null}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleSaveThresholds()}
              disabled={selectedAreaId === null || isSavingThresholds}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="size-4" />
              {isSavingThresholds ? 'A guardar...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Alertas Ativos</h2>
            <p className="text-sm text-slate-600">
              {selectedArea
                ? `Alertas mais recentes de ${selectedArea.name}`
                : 'Selecione uma área para ver os alertas.'}
            </p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {visibleAlerts.length} resultados
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Severidade
            </span>
            <select
              value={selectedSeverity}
              onChange={(event) =>
                setSelectedSeverity(
                  event.target.value as 'ALL' | NonNullable<AlertFromAPI['severity']>,
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none"
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === 'ALL' ? 'Todas' : option}
                </option>
              ))}
            </select>
          </label>

         
        </div>

        {/* {filteredAlerts.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Alertas selecionados
              </span>
              <span className="font-semibold">{selectedArea?.name ?? 'Sem área'}</span>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-amber-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      {getIndicatorLabel(alert.indicatorType)}
                    </span>
                    <span className="font-semibold text-slate-900">{alert.areaName}</span>
                  </div>

                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                    <InfoPill
                      label="Valor medido"
                      value={formatMeasuredValue(alert.measuredValue, alert.unit)}
                    />
                    <InfoPill
                      label="Limite"
                      value={formatThresholdValue(alert.thresholdValue, alert.unit)}
                    />
                    <InfoPill
                      label="Severidade"
                      value={alert.severity ?? 'Sem severidade'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null} */}

        {isLoadingAlerts ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-500 shadow-sm">
            A carregar alertas...
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              selected={selectedAlertId === alert.id}
              onViewDetails={() => {
                setSelectedAlertId(alert.id)
                setSelectedAlertForModal(alert)
              }}
            />
          ))}

          {!isLoadingAlerts && visibleAlerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm font-medium text-slate-500 shadow-sm lg:col-span-3">
              Não existem alertas ativos para os filtros atuais.
            </div>
          ) : null}
        </div>
      </section>

      {selectedAlertForModal ? (
        <AlertDetailsModal
          alert={selectedAlertForModal}
          mapSearch={buildHotspotSearchFromAlert(selectedAlertForModal)}
          onClose={() => setSelectedAlertForModal(null)}
        />
      ) : null}
    </main>
  )
}

function AlertCard({
  alert,
  selected,
  onViewDetails,
}: {
  alert: AlertFromAPI
  selected: boolean
  onViewDetails: () => void
}) {
  const severityStyles = getSeverityStyles(alert.severity)
  const mapSearch = buildHotspotSearchFromAlert(alert)

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected ? 'border-primary ring-2 ring-primary/15' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${severityStyles.iconBg}`}
          >
            <TriangleAlert className={`size-5 ${severityStyles.iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{alert.areaName}</h3>
            <p className="text-xs text-slate-500">{getIndicatorLabel(alert.indicatorType)}</p>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${severityStyles.badge}`}
        >
          {alert.severity ?? 'N/A'}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-slate-700">
        <InfoRow label="Valor medido" value={formatMeasuredValue(alert.measuredValue, alert.unit)} />
        <InfoRow label="Limite" value={formatThresholdValue(alert.thresholdValue, alert.unit)} />
        <InfoRow label="Data/Hora" value={formatDateTime(alert.triggeredAt)} />
      </dl>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Ver detalhes
        </button>
        <Link
          to="/hotspots"
          search={mapSearch}
          className="flex-1 rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-white transition hover:brightness-95"
        >
          Ver no Mapa
        </Link>
      </div>
    </article>
  )
}

function AlertDetailsModal({
  alert,
  mapSearch,
  onClose,
}: {
  alert: AlertFromAPI
  mapSearch: ReturnType<typeof buildHotspotSearchFromAlert>
  onClose: () => void
}) {
  const severityStyles = getSeverityStyles(alert.severity)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
        role="presentation"
      />

      <article className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Detalhes do alerta</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900">{alert.areaName}</h3>
            <p className="text-sm text-slate-600">{getIndicatorLabel(alert.indicatorType)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar detalhes"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityStyles.badge}`}>
              {alert.severity ?? 'N/A'}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {alert.status}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Área" value={alert.areaName} />
            <DetailItem label="Indicador" value={getIndicatorLabel(alert.indicatorType)} />
            <DetailItem label="Valor medido" value={formatMeasuredValue(alert.measuredValue, alert.unit)} />
            <DetailItem label="Limite" value={formatThresholdValue(alert.thresholdValue, alert.unit)} />
            <DetailItem label="Triggered at" value={formatDateTime(alert.triggeredAt)} />
            <DetailItem label="Resolved at" value={formatDateTime(alert.resolvedAt)} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-800">Resumo</div>
            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
              <InfoPill label="Area ID" value={String(alert.areaId)} />
              <InfoPill label="Severity" value={alert.severity ?? 'Sem severidade'} />
              <InfoPill label="Unit" value={alert.unit ?? '—'} />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Fechar
            </button>
            <Link
              to="/hotspots"
              search={mapSearch}
              className="rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition hover:brightness-95"
            >
              Ver no Mapa
            </Link>
          </div>
        </div>
      </article>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function ThresholdCard({
  config,
  value,
  onChange,
  disabled,
}: {
  config: (typeof INDICATOR_CONFIG)[number]
  value: number
  onChange: (value: number) => void
  disabled: boolean
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-800">{config.label}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
          {formatThresholdValue(value, config.unit)}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          type="number"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Limite recomendado para {config.shortLabel.toLowerCase()} em {config.unit}.
      </p>
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-700">{value}</dd>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-amber-100">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">{label}</div>
      <div className="mt-1 text-sm font-semibold text-amber-950">{value}</div>
    </div>
  )
}

function buildDefaultThresholdDrafts(): Record<IndicatorType, number> {
  return INDICATOR_CONFIG.reduce((drafts, config) => {
    drafts[config.type] = config.defaultValue
    return drafts
  }, {} as Record<IndicatorType, number>)
}

function buildThresholdDrafts(thresholds: AlertThresholdFromAPI[]) {
  const drafts = buildDefaultThresholdDrafts()

  thresholds.forEach((threshold) => {
    drafts[threshold.indicatorType] = threshold.thresholdValue
  })

  return drafts
}


function buildHotspotSearchFromAlert(alert: AlertFromAPI) {
  const triggeredAt = alert.triggeredAt ? new Date(alert.triggeredAt) : new Date()
  const from = new Date(triggeredAt)
  const to = new Date(triggeredAt)

  from.setHours(from.getHours() - 6)
  to.setHours(to.getHours() + 6)

  return {
    mode: 'HISTORICAL' as const,
    areaId: alert.areaId,
    areaName: alert.areaName,
    indicatorType: alert.indicatorType,
    from: from.toISOString(),
    to: to.toISOString(),
    alertSeverity: alert.severity ?? undefined,
    measuredValue: alert.measuredValue ?? undefined,
    thresholdValue: alert.thresholdValue ?? undefined,
    unit: alert.unit ?? undefined,
    triggeredAt: alert.triggeredAt ?? undefined,
    resolvedAt: alert.resolvedAt ?? undefined,
    status: alert.status,
  }
}

function getIndicatorLabel(indicatorType: IndicatorType) {
  return INDICATOR_CONFIG.find((config) => config.type === indicatorType)?.label ?? indicatorType
}

function formatThresholdValue(value: number | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
}

function formatMeasuredValue(value: number | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) return '—'
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function getSeverityStyles(severity: AlertFromAPI['severity']) {
  switch (severity) {
    case 'HIGH':
      return {
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        badge: 'bg-rose-100 text-rose-700',
      }
    case 'MEDIUM':
      return {
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700',
      }
    case 'LOW':
      return {
        iconBg: 'bg-sky-100',
        iconColor: 'text-sky-600',
        badge: 'bg-sky-100 text-sky-700',
      }
    default:
      return {
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-600',
      }
  }
}

// dedupe implemented in `useAlerts`
