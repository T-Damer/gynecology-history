import { EChart } from '@kbox-labs/react-echarts'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import useTheme from 'hooks/useTheme'

interface VisitChartPoint {
  visitNumber: number
  visitDate: string | undefined
  hpvTypes: string | number | undefined
  hpvLogs: string | number | undefined
}

interface HpvPoint {
  type: string
  log: number
}

const chartColors = [
  '#2b7fff',
  '#ef4444',
  '#16a34a',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
  '#14b8a6',
]
const chartSideSpacePx = 120

function scrollToVisit(visitNumber: number) {
  const element =
    document.getElementById(`visit-hpv-${visitNumber}`) ||
    document.getElementById(`visit-${visitNumber}`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function parseViralLoad(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (!value) return null

  const normalized = value.replace(',', '.').trim()
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function splitCommaSeparatedValues(value: string | number | undefined) {
  if (typeof value === 'number') return [String(value)]
  if (!value) return []

  return value.split(',').map((item) => item.trim())
}

function getHpvPoints(visit: VisitChartPoint): HpvPoint[] {
  const typeValues = splitCommaSeparatedValues(visit.hpvTypes).filter(Boolean)
  const logValues = splitCommaSeparatedValues(visit.hpvLogs)

  return typeValues.map((type, index) => ({
    type,
    log: parseViralLoad(logValues[index]) ?? 0,
  }))
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

export default function ({ visits }: { visits: VisitChartPoint[] }) {
  const theme = useTheme()
  const chartTextColor = theme === 'dark' ? '#f3f4f6' : '#111827'
  const chartAxisColor =
    theme === 'dark' ? 'rgba(243, 244, 246, 0.28)' : 'rgba(17, 24, 39, 0.18)'
  const datedVisits = visits
    .map((visit) => {
      const timestamp = toTimestamp(visit.visitDate)
      if (timestamp === null) return null

      return {
        visitNumber: visit.visitNumber,
        timestamp,
        label: formatVisitDate(timestamp),
        hpvPoints: getHpvPoints(visit),
      }
    })
    .filter(
      (
        point
      ): point is {
        visitNumber: number
        timestamp: number
        label: string
        hpvPoints: HpvPoint[]
      } => Boolean(point)
    )
    .sort((left, right) => left.timestamp - right.timestamp)

  const uniqueTypes = Array.from(
    new Set(
      datedVisits.flatMap((visit) => visit.hpvPoints.map((point) => point.type))
    )
  )
  const hasAllVisitDates = visits.every(
    (visit) => toTimestamp(visit.visitDate) !== null
  )
  const isComplete = hasAllVisitDates && uniqueTypes.length > 0
  const chartWidth = datedVisits.length * 72 + chartSideSpacePx

  const series = uniqueTypes.map((type, index) => ({
    name: `ВПЧ ${type}`,
    type: 'line' as const,
    smooth: true,
    symbol: 'circle' as const,
    symbolSize: 10,
    data: datedVisits.map((visit) => {
      const matchingPoint = visit.hpvPoints.find((point) => point.type === type)

      return matchingPoint?.log ?? 0
    }),
    lineStyle: {
      width: 3,
      color: chartColors[index % chartColors.length],
    },
    itemStyle: {
      color: chartColors[index % chartColors.length],
    },
  }))

  return (
    <section className="rounded-box border-2 border-neutral-content p-4">
      <div className="mb-4">
        <h2 className="m-0 text-lg font-semibold">График вирусной нагрузки</h2>
        <p className="m-0 text-sm opacity-70">
          Для каждого ВПЧ типа строится отдельная линия. Если на визите логарифм
          не указан, используется 0.
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
              width: `max(100%, ${chartWidth}px)`,
              background:
                'radial-gradient(color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 0)',
              backgroundSize: '12px 12px',
            }}
          >
            <EChart
              className="h-[32rem] w-full"
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
                textStyle: {
                  color: chartTextColor,
                },
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
                valueFormatter: (value) =>
                  typeof value === 'number' ? value.toFixed(2) : String(value),
                formatter: (params) => {
                  const points = Array.isArray(params) ? params : [params]
                  const pointIndex = points[0]?.dataIndex ?? 0
                  const visit = datedVisits[pointIndex]

                  return [
                    `<strong>${visit.label}</strong>`,
                    `Визит ${visit.visitNumber}`,
                    ...points.map((point) => {
                      const viralLoad = Number(point.value)

                      return `${point.marker}${point.seriesName}: ${viralLoad.toFixed(2)}`
                    }),
                  ].join('<br/>')
                },
              }}
              xAxis={{
                type: 'category',
                data: datedVisits.map((visit) => visit.label),
                axisLabel: {
                  color: chartTextColor,
                  interval: 0,
                  hideOverlap: true,
                  rotate: 30,
                },
                axisLine: {
                  lineStyle: {
                    color: chartAxisColor,
                  },
                },
                splitLine: { show: false },
              }}
              yAxis={{
                type: 'value',
                name: 'ВПЧ логарифм',
                nameTextStyle: {
                  color: chartTextColor,
                },
                axisLabel: {
                  color: chartTextColor,
                  formatter: (value: number) => value.toFixed(1),
                },
                axisLine: {
                  lineStyle: {
                    color: chartAxisColor,
                  },
                },
                splitLine: {
                  lineStyle: {
                    color: chartAxisColor,
                  },
                },
              }}
              series={series}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-72 items-center justify-center rounded-box border border-dashed border-base-300 bg-base-200/30 px-6 text-center text-sm font-medium">
          Заполните дату визита для каждого визита и укажите хотя бы один ВПЧ
          тип
        </div>
      )}
    </section>
  )
}
