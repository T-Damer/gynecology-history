import { EChart } from '@kbox-labs/react-echarts'
import { colposcopyOptions, cytologyOptions } from 'config/formSchema'
import { LineChart } from 'echarts/charts'
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

const valueSymbols = [
  'circle',
  'rect',
  'roundRect',
  'triangle',
  'diamond',
  'pin',
  'arrow',
  'path://M0,-9 L2.2,-2.8 L8.6,-2.8 L3.4,1.1 L5.5,7.5 L0,3.8 L-5.5,7.5 L-3.4,1.1 L-8.6,-2.8 L-2.2,-2.8 Z',
] as const
const cytologyOffsetMs = -3 * 60 * 60 * 1000
const colposcopyOffsetMs = 3 * 60 * 60 * 1000

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

function getSymbolForValue(value: string, values: string[]) {
  const index = values.indexOf(value)
  return valueSymbols[(index >= 0 ? index : 0) % valueSymbols.length]
}

export default function ({ visits }: { visits: VisitStatusPoint[] }) {
  const datedVisits = visits
    .map((visit) => {
      const timestamp = toTimestamp(visit.visitDate)
      if (timestamp === null) return null

      return {
        visitNumber: visit.visitNumber,
        timestamp,
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

  const series = [
    {
      name: 'Цитология',
      type: 'line' as const,
      color: '#2563eb',
      lineStyle: { width: 3, color: '#2563eb' },
      itemStyle: { color: '#2563eb' },
      connectNulls: false,
      data: datedVisits.map((visit) =>
        visit.cytology
          ? {
              value: [visit.timestamp + cytologyOffsetMs, visit.cytology],
              symbol: getSymbolForValue(visit.cytology, cytologyOptions),
              symbolSize: 14,
            }
          : [visit.timestamp + cytologyOffsetMs, null]
      ),
    },
    {
      name: 'Кольпоскопия',
      type: 'line' as const,
      color: '#dc2626',
      lineStyle: { width: 3, color: '#dc2626' },
      itemStyle: { color: '#dc2626' },
      connectNulls: false,
      data: datedVisits.map((visit) =>
        visit.colposcopy
          ? {
              value: [visit.timestamp + colposcopyOffsetMs, visit.colposcopy],
              symbol: getSymbolForValue(visit.colposcopy, colposcopyOptions),
              symbolSize: 14,
            }
          : [visit.timestamp + colposcopyOffsetMs, null]
      ),
    },
  ]

  return (
    <section className="rounded-box border-2 border-neutral-content p-4">
      <div className="mb-4">
        <h2 className="m-0 text-lg font-semibold">
          Динамика цитологии и кольпоскопии
        </h2>
        <p className="m-0 text-sm opacity-70">
          Цвет показывает линию, фигура показывает значение на визите.
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
                LineChart,
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
                bottom: 52,
                containLabel: true,
              }}
              tooltip={{
                trigger: 'axis',
                formatter: (params) => {
                  const points = Array.isArray(params) ? params : [params]
                  const firstValue = points[0]?.value as [number, string | null]
                  const timestamp = firstValue?.[0]

                  return [
                    `<strong>${formatVisitDate(timestamp)}</strong>`,
                    ...points.map((point) => {
                      const [, value] = point.value as [number, string | null]

                      return `${point.marker}${point.seriesName}: ${value || '—'}`
                    }),
                  ].join('<br/>')
                },
              }}
              xAxis={{
                type: 'time',
                axisLabel: {
                  color: 'currentColor',
                  hideOverlap: true,
                  rotate: 30,
                  formatter: (value: number) =>
                    new Intl.DateTimeFormat('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                    }).format(value),
                },
                splitLine: { show: false },
              }}
              yAxis={{
                type: 'category',
                data: statusCategories,
                axisLabel: {
                  interval: 0,
                },
              }}
              series={series}
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
