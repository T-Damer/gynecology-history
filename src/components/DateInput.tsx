import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import CalendarIcon from 'components/Icons/CalendarIcon'
import { OnChange } from 'types/FormEvent'

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
})
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function isMobileDevice() {
  if (typeof window === 'undefined') return true

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const touchCapable = navigator.maxTouchPoints > 0
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  return coarsePointer || (touchCapable && mobileUa)
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string | number | undefined) {
  if (typeof value !== 'string') return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const [, year, month, day] = match
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))

  if (Number.isNaN(parsedDate.getTime())) return null

  return parsedDate
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, diff: number) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1)
}

function buildCalendarDays(displayMonth: Date) {
  const monthStart = startOfMonth(displayMonth)
  const startDayOffset = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - startDayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    return {
      date,
      iso: formatIsoDate(date),
      isCurrentMonth: date.getMonth() === displayMonth.getMonth(),
    }
  })
}

function emitDateChange(onChange: OnChange, nextValue: string | undefined) {
  onChange({
    currentTarget: {
      value: nextValue || '',
    },
  })
}

export default function ({
  value,
  onChange,
  required,
}: {
  value: string | number | undefined
  onChange: OnChange
  required: boolean | undefined
}) {
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const selectedDate = parseIsoDate(value)
  const [useNativePicker] = useState(() => isMobileDevice())
  const [isOpen, setIsOpen] = useState(false)
  const [displayMonth, setDisplayMonth] = useState<Date>(
    () => selectedDate || startOfMonth(new Date())
  )

  useEffect(() => {
    if (!selectedDate) return
    setDisplayMonth(startOfMonth(selectedDate))
  }, [value])

  useEffect(() => {
    if (!isOpen || useNativePicker) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, useNativePicker])

  const calendarDays = useMemo(
    () => buildCalendarDays(displayMonth),
    [displayMonth]
  )
  const selectedIso = typeof value === 'string' ? value : ''

  if (useNativePicker)
    return (
      <label className="input input-bordered flex items-center gap-2">
        <input
          className="grow"
          value={value}
          onInput={onChange}
          type="date"
          ref={dateInputRef}
          required={required}
        />
        <CalendarIcon onPress={() => dateInputRef.current?.showPicker()} />
      </label>
    )

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        className="input input-bordered flex w-full items-center gap-2 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`grow ${selectedDate ? '' : 'text-slate-500 opacity-70'}`}>
          {selectedDate ? dateFormatter.format(selectedDate) : 'Выберите дату'}
        </span>
        <CalendarIcon className="pointer-events-none" />
      </button>

      <input type="hidden" value={selectedIso} required={required} />

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[19rem] rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDisplayMonth((prev) => addMonths(prev, -1))}
            >
              ←
            </button>
            <strong className="capitalize">{monthFormatter.format(displayMonth)}</strong>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDisplayMonth((prev) => addMonths(prev, 1))}
            >
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs opacity-60">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, iso, isCurrentMonth }) => {
              const isSelected = iso === selectedIso
              const isToday = iso === formatIsoDate(new Date())

              return (
                <button
                  type="button"
                  key={iso}
                  className={`btn btn-sm h-10 min-h-10 px-0 ${
                    isSelected
                      ? 'btn-primary text-primary-content'
                      : 'btn-ghost'
                  } ${isCurrentMonth ? '' : 'opacity-40'} ${
                    isToday && !isSelected ? 'border border-primary' : ''
                  }`}
                  onClick={() => {
                    emitDateChange(onChange, iso)
                    setIsOpen(false)
                  }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setDisplayMonth(startOfMonth(new Date()))}
            >
              Сегодня
            </button>

            <div className="flex gap-2">
              {!required ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    emitDateChange(onChange, undefined)
                    setIsOpen(false)
                  }}
                >
                  Очистить
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsOpen(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
