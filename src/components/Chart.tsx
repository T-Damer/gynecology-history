import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { EChart } from '@kbox-labs/react-echarts'

interface VisitChartPoint {
  visitNumber: number
  visitDate: string | undefined
  viralLoad: string | number | undefined
}

function parseViralLoad(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (!value) return null

  const normalized = value.replace(',', '.').trim()
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
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
  const chartData = visits
    .map((visit) => {
      const timestamp = toTimestamp(visit.visitDate)
      const viralLoad = parseViralLoad(visit.viralLoad)

      if (timestamp === null || viralLoad === null) return null

      return {
        name: `Визит ${visit.visitNumber}`,
        value: [timestamp, viralLoad],
      }
    })
    .filter((point): point is { name: string; value: [number, number] } => Boolean(point))
    .sort((left, right) => left.value[0] - right.value[0])

  if (chartData.length < 2) return null

  return (
    <section className="rounded-box border-2 border-neutral-content p-4">
      <div className="mb-4">
        <h2 className="m-0 text-lg font-semibold">График вирусной нагрузки</h2>
        <p className="m-0 text-sm opacity-70">
          Построен по полю «ВПЧ логарифм» на визитах с заполненной датой.
        </p>
      </div>

      <div
        className="relative w-full min-h-72"
        style={{
          background:
            'radial-gradient(color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}
      >
        <EChart
          className="h-72 w-full"
          use={[GridComponent, TooltipComponent, LineChart, CanvasRenderer]}
          renderer="canvas"
          grid={{
            left: 12,
            right: 18,
            top: 18,
            bottom: 28,
            containLabel: true,
          }}
          tooltip={{
            trigger: 'axis',
            valueFormatter: (value) =>
              typeof value === 'number' ? value.toFixed(2) : String(value),
            formatter: (params) => {
              const point = Array.isArray(params) ? params[0] : params
              const [timestamp, viralLoad] = point.value as [number, number]

              return [
                `<strong>${point.seriesName}</strong>`,
                formatVisitDate(timestamp),
                `ВПЧ логарифм: ${viralLoad.toFixed(2)}`,
              ].join('<br/>')
            },
          }}
          xAxis={{
            type: 'time',
            axisLabel: {
              color: 'currentColor',
              formatter: (value: number) =>
                new Intl.DateTimeFormat('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                }).format(value),
            },
            splitLine: { show: false },
          }}
          yAxis={{
            type: 'value',
            name: 'ВПЧ логарифм',
            nameTextStyle: {
              color: 'currentColor',
            },
            axisLabel: {
              formatter: (value: number) => value.toFixed(1),
            },
          }}
          series={[
            {
              name: 'Вирусная нагрузка',
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 10,
              data: chartData,
              lineStyle: {
                width: 4,
                color: '#2b7fff',
              },
              itemStyle: {
                color: '#2b7fff',
              },
              areaStyle: {
                color: 'rgba(43,127,255,0.12)',
              },
            },
          ]}
        />
      </div>
    </section>
  )
}
