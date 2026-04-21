import { EChart } from '@kbox-labs/react-echarts'
import { colposcopyOptions, cytologyOptions } from 'config/formSchema'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

interface VisitStatusPoint {
  visitNumber: number
  visitDate: string | undefined
  cytology: string | number | undefined
  colposcopy: string | number | undefined
}

function scrollToVisit(visitNumber: number) {
  const element = document.getElementById(`visit-${visitNumber}`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toTimestamp(visitDate?: string) {
  if (!visitDate) return null

  const parsed = new Date(`${visitDate}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

function formatVisitDate(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}

function normalizeStatusValue(value: string | number | undefined) {
  if (typeof value === 'number') return String(value)
  if (!value) return undefined

  const normalized = value.trim()
  return normalized || undefined
}

function getStatusIndex(
  value: string | undefined,
  categories: string[]
): number | null {
  if (!value) return null

  const index = categories.indexOf(value)
  return index >= 0 ? index : null
}

export default function ({ visits }: { visits: VisitStatusPoint[] }) {
  const datedVisits = visits
    .map((visit) => {
      const timestamp = toTimestamp(visit.visitDate)
      if (timestamp === null) return null

      return {
        visitNumber: visit.visitNumber,
        timestamp,
        label: formatVisitDate(timestamp),
        cytology: normalizeStatusValue(visit.cytology),
        colposcopy: normalizeStatusValue(visit.colposcopy),
      }
    })
    .filter(
      (
        visit
      ): visit is {
        visitNumber: number
        timestamp: number
        label: string
        cytology: string | undefined
        colposcopy: string | undefined
      } => Boolean(visit)
    )
    .sort((left, right) => left.timestamp - right.timestamp)

  const hasAllVisitDates = visits.every(
    (visit) => toTimestamp(visit.visitDate) !== null
  )
  const hasAnyStatuses = datedVisits.some(
    (visit) => visit.cytology || visit.colposcopy
  )
  const statusCategories = Array.from(
    new Set([...cytologyOptions, ...colposcopyOptions])
  )
  const isComplete = hasAllVisitDates && hasAnyStatuses
  const chartMinWidth = Math.max(720, datedVisits.length * 120)

  const cytologySeries = datedVisits.map((visit) => {
    const statusIndex = getStatusIndex(visit.cytology, statusCategories)

    return statusIndex === null ? null : statusIndex
  })

  const colposcopySeries = datedVisits.map((visit) => {
    const statusIndex = getStatusIndex(visit.colposcopy, statusCategories)

    return statusIndex === null ? null : statusIndex
  })

  return (
    <section className="rounded-box border-2 border-neutral-content p-4">
      <div className="mb-4">
        <h2 className="m-0 text-lg font-semibold">
          Динамика цитологии и кольпоскопии
        </h2>
        <p className="m-0 text-sm opacity-70">
          Для каждой даты показываются отдельные столбцы цитологии и
          кольпоскопии.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {visits.map((visit) => (
            <button
              key={visit.visitNumber}
              className="btn btn-sm"
              onClick={() => scrollToVisit(visit.visitNumber)}
              type="button"
            >
              Визит {visit.visitNumber}
            </button>
          ))}
        </div>
      </div>

      {isComplete ? (
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div
            className="relative min-h-72"
            style={{
              minWidth: `${chartMinWidth}px`,
              background:
                'radial-gradient(color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 0)',
              backgroundSize: '12px 12px',
            }}
          >
            <EChart
              className="h-80 w-full"
              use={[
                GridComponent,
                LegendComponent,
                TooltipComponent,
                BarChart,
                CanvasRenderer,
              ]}
              renderer="canvas"
              legend={{
                top: 0,
                left: 0,
                right: 0,
                type: 'scroll',
              }}
              grid={{
                left: 12,
                right: 18,
                top: 88,
                bottom: 64,
                containLabel: true,
              }}
              tooltip={{
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow',
                },
                formatter: (params) => {
                  const points = Array.isArray(params) ? params : [params]
                  const pointIndex = points[0]?.dataIndex ?? 0
                  const visit = datedVisits[pointIndex]

                  return [
                    `<strong>${visit.label}</strong>`,
                    `Визит ${visit.visitNumber}`,
                    ...points.map((point) => {
                      const statusIndex = Number(point.value)
                      const value =
                        Number.isFinite(statusIndex) &&
                        statusCategories[statusIndex]
                          ? statusCategories[statusIndex]
                          : '—'

                      return `${point.marker}${point.seriesName}: ${value}`
                    }),
                  ].join('<br/>')
                },
              }}
              xAxis={{
                type: 'category',
                data: datedVisits.map((visit) => visit.label),
                axisLabel: {
                  color: 'currentColor',
                  interval: 0,
                  hideOverlap: true,
                  rotate: 30,
                },
                splitLine: { show: false },
              }}
              yAxis={{
                type: 'value',
                min: 0,
                max: Math.max(statusCategories.length - 1, 0),
                interval: 1,
                axisLabel: {
                  formatter: (value: number) => statusCategories[value] ?? '',
                },
              }}
              series={[
                {
                  name: 'Цитология',
                  type: 'bar',
                  data: cytologySeries,
                  itemStyle: { color: '#2563eb' },
                  barMaxWidth: 28,
                },
                {
                  name: 'Кольпоскопия',
                  type: 'bar',
                  data: colposcopySeries,
                  itemStyle: { color: '#dc2626' },
                  barMaxWidth: 28,
                },
              ]}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200/30 px-6 text-center text-sm font-medium">
          Заполните дату визита для каждого визита и укажите хотя бы одно
          значение цитологии или кольпоскопии
        </div>
      )}
    </section>
  )
}
