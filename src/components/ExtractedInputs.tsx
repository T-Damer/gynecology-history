import { useAutoAnimate } from '@formkit/auto-animate/preact'
import Button from 'components/Button'
import DateInput from 'components/DateInput'
import handleError from 'helpers/handleError'
import {
  formatFieldLabel,
  getBirthDateMaxIso,
  getResolvedPassportFields,
} from 'helpers/patientDerived'
import processImageFile from 'helpers/processImageFile'
import { useMemo, useRef, useState } from 'preact/hooks'
import ButtonTypes from 'types/Button'
import type { FieldState, Patient, PlainValue, Visit } from 'types/Patient'

const MAX_HPV_TYPES = 5

interface ExtractedInputsProps {
  patient: Patient
  onPassportChange: (fieldKey: string, value: PlainValue) => void
  onVisitFieldChange: (
    visitId: string,
    fieldKey: string,
    value: PlainValue
  ) => void
  onVisitDateChange: (visitId: string, value: PlainValue) => void
  onVisitIntervalChange: (visitId: string, value: PlainValue) => void
  onAddVisit: () => void
  onCopyVisit: (visitId: string) => void
  onDeleteVisit: (visitId: string) => void
}

interface HpvPairRow {
  type: string
  log: string
}

function splitCommaSeparatedValues(
  value: PlainValue,
  preserveEmpty = false
): string[] {
  if (typeof value !== 'string' || value.length === 0) return []

  const values = value.split(',').map((item) => item.trim())
  return preserveEmpty ? values : values.filter(Boolean)
}

function serializeHpvPairRows(rows: HpvPairRow[]) {
  const normalizedRows = rows
    .map((row) => ({
      type: row.type.trim(),
      log: row.log.trim(),
    }))
    .filter((row) => row.type.length > 0)

  if (normalizedRows.length === 0) {
    return {
      types: undefined,
      logs: undefined,
    }
  }

  return {
    types: normalizedRows.map((row) => row.type).join(', '),
    logs: normalizedRows.map((row) => row.log).join(', '),
  }
}

function normalizeNonNegativeIntegerValue(value: string) {
  return value.replace(/\D+/g, '')
}

function normalizeNonNegativeDecimalValue(value: string) {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '')
  const [integerPart = '', ...rest] = normalized.split('.')

  return rest.length > 0
    ? `${integerPart}.${rest.join('')}`.replace(/\.+$/, '')
    : integerPart
}

function normalizeValue(
  field: FieldState,
  value: string,
  valueAsNumber: number
) {
  if (field.type === 'number') {
    if (Number.isNaN(valueAsNumber)) return undefined
    return valueAsNumber < 0 ? undefined : valueAsNumber
  }

  return value || undefined
}

function PhotoInput({
  field,
  onChange,
}: {
  field: FieldState
  onChange: (value: PlainValue) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      const error = 'Можно загружать только изображения'
      handleError({ e: error, toastMessage: error })
      return
    }

    setIsProcessing(true)

    try {
      const imageDataUrl = await processImageFile(file)
      onChange(imageDataUrl)
    } catch (error) {
      handleError({
        e: error,
        toastMessage: 'Не удалось обработать изображение',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onInput={(e) => {
          void handleFile(e.currentTarget.files?.[0])
          e.currentTarget.value = ''
        }}
      />

      <button
        type="button"
        className={`flex min-h-44 w-full flex-col items-center justify-center rounded-box border-2 border-dashed px-4 py-6 text-center transition ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-200/30'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void handleFile(event.dataTransfer?.files?.[0])
        }}
      >
        {typeof field.value === 'string' && field.value ? (
          <img
            src={field.value}
            alt={field.title}
            className="max-h-56 w-auto rounded-box object-contain shadow"
          />
        ) : (
          <div className="space-y-2">
            <p className="m-0 font-medium">Перетащите фото сюда</p>
            <p className="m-0 text-sm opacity-70">
              или нажмите, чтобы выбрать файл
            </p>
          </div>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        <Button
          buttonType={ButtonTypes.ghost}
          onClick={() => inputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? 'Обработка...' : 'Выбрать фото'}
        </Button>

        <Button
          buttonType={ButtonTypes.error}
          onClick={() => onChange(undefined)}
          disabled={isProcessing || !field.value}
        >
          Удалить фото
        </Button>
      </div>
    </div>
  )
}

function ProcessedInput({
  field,
  onChange,
}: {
  field: FieldState
  onChange: (value: PlainValue) => void
}) {
  const max = field.key === 'birthDate' ? getBirthDateMaxIso() : undefined
  const min = field.type === 'number' ? 0 : undefined

  if (field.multiValue) {
    const values = String(field.value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const inputValues = [...values, '']

    return (
      <div className="flex flex-col gap-2">
        {inputValues.map((itemValue, index) => (
          <input
            key={`${field.key}-${index}`}
            className="placeholder:text-opacity-30 placeholder:text-slate-500 input input-bordered"
            placeholder={index === 0 ? field.placeholder || '---' : '...'}
            value={itemValue}
            onInput={(e) => {
              const nextValues = [...inputValues]
              nextValues[index] = e.currentTarget.value

              const normalized = nextValues
                .map((item) => item.trim())
                .filter(Boolean)
                .join(', ')

              onChange(normalized || undefined)
            }}
          />
        ))}
      </div>
    )
  }

  if (field.options?.length)
    return (
      <select
        className="select select-bordered"
        value={String(field.value || '')}
        required={field.required}
        onInput={(e) => {
          const nextValue = e.currentTarget.value
          onChange(nextValue || undefined)
        }}
      >
        <option value="">Не выбрано</option>
        {field.options.map((option) => (
          <option value={option} key={`${field.key}-${option}`}>
            {option}
          </option>
        ))}
      </select>
    )

  if (field.type === 'date')
    return (
      <DateInput
        value={field.value}
        required={field.required}
        {...(max ? { max } : {})}
        onChange={({ currentTarget }) =>
          onChange(currentTarget.value || undefined)
        }
      />
    )

  if (field.type === 'textarea')
    return (
      <textarea
        className="textarea textarea-bordered min-h-28"
        placeholder={field.placeholder || '---'}
        value={String(field.value || '')}
        required={field.required}
        readOnly={field.readOnly}
        onInput={(e) => onChange(e.currentTarget.value || undefined)}
      />
    )

  if (field.type === 'image') {
    return <PhotoInput field={field} onChange={onChange} />
  }

  return (
    <input
      className="placeholder:text-opacity-30 placeholder:text-slate-500 input input-bordered"
      placeholder={field.placeholder || '---'}
      value={field.value === undefined ? '' : String(field.value)}
      onInput={(e) =>
        onChange(
          normalizeValue(
            field,
            e.currentTarget.value,
            e.currentTarget.valueAsNumber
          )
        )
      }
      type={field.htmlType || field.type || 'text'}
      min={min}
      step={field.step}
      required={field.required}
      readOnly={field.readOnly}
      inputMode={field.inputMode}
      pattern={field.pattern}
      autoComplete={field.autoComplete}
    />
  )
}

function FieldControl({
  field,
  onChange,
}: {
  field: FieldState
  onChange: (value: PlainValue) => void
}) {
  return (
    <div className="form-control my-3 w-full gap-1">
      <div className="flex flex-col gap-0.5">
        <b>
          {formatFieldLabel(field.title)}
          {field.required ? ' *' : ''}
        </b>
        {field.description ? (
          <span className="text-xs opacity-70">{field.description}</span>
        ) : null}
      </div>
      <ProcessedInput field={field} onChange={onChange} />
    </div>
  )
}

function HpvPairControl({
  visitNumber,
  typeField,
  logField,
  onTypeChange,
  onLogChange,
}: {
  visitNumber: number
  typeField: FieldState
  logField: FieldState
  onTypeChange: (value: PlainValue) => void
  onLogChange: (value: PlainValue) => void
}) {
  const typeValues = splitCommaSeparatedValues(typeField.value)
  const logValues = splitCommaSeparatedValues(logField.value, true)
  const filledRowsCount = Math.max(typeValues.length, 1)
  const rowsCount =
    typeValues.length >= MAX_HPV_TYPES
      ? filledRowsCount
      : Math.min(filledRowsCount + 1, MAX_HPV_TYPES)
  const rows: HpvPairRow[] = Array.from({ length: rowsCount }, (_, index) => ({
    type: typeValues[index] || '',
    log: logValues[index] || '',
  }))

  const updateRows = (
    index: number,
    key: keyof HpvPairRow,
    nextValue: string
  ) => {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: nextValue } : row
    )
    const serialized = serializeHpvPairRows(nextRows)

    onTypeChange(serialized.types)
    onLogChange(serialized.logs)
  }

  return (
    <div
      id={`visit-hpv-${visitNumber}`}
      className="form-control my-3 w-full scroll-mt-28 gap-2"
    >
      <div className="flex flex-col gap-0.5">
        <b>
          {formatFieldLabel(typeField.title)} /{' '}
          {formatFieldLabel(logField.title)}
        </b>
        <span className="text-xs opacity-70">
          Для каждого ВПЧ типа укажите свой логарифм. Максимум 5 типов.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div
            key={`${typeField.key}-${index}`}
            className="grid gap-2 sm:grid-cols-2"
          >
            <input
              className="input input-bordered placeholder:text-opacity-30 placeholder:text-slate-500"
              placeholder={index === 0 ? typeField.placeholder || '---' : '...'}
              value={row.type}
              onInput={(e) =>
                updateRows(
                  index,
                  'type',
                  normalizeNonNegativeIntegerValue(e.currentTarget.value)
                )
              }
              type="number"
              min={0}
              step={typeField.step}
              inputMode={typeField.inputMode}
            />
            <input
              className="input input-bordered placeholder:text-opacity-30 placeholder:text-slate-500"
              placeholder={
                index === 0 ? logField.placeholder || '---' : 'Логарифм'
              }
              value={row.log}
              onInput={(e) =>
                updateRows(
                  index,
                  'log',
                  normalizeNonNegativeDecimalValue(e.currentTarget.value)
                )
              }
              type="number"
              min={0}
              step={logField.step}
              inputMode={logField.inputMode}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function renderGroupedFields(
  fields: FieldState[],
  onChange: (fieldKey: string, value: PlainValue) => void,
  visitNumber?: number
) {
  const groups = fields.reduce<Record<string, FieldState[]>>((acc, field) => {
    const groupName = field.group || 'Общее'
    acc[groupName] = [...(acc[groupName] || []), field]
    return acc
  }, {})

  return Object.entries(groups).map(([groupName, groupFields]) => (
    <div key={groupName} className="mt-4 first:mt-0">
      <h4 className="sticky top-[10.5rem] z-10 -mx-4 mb-2 border-b border-base-300 bg-base-300 px-4 py-2 text-sm uppercase tracking-wide">
        {formatFieldLabel(groupName)}
      </h4>
      {groupFields.map((field) => {
        if (field.key === 'hpvLog') return null

        if (field.key === 'hpvType') {
          const logField = groupFields.find(
            (groupField) => groupField.key === 'hpvLog'
          )

          if (logField) {
            return (
              <HpvPairControl
                key={field.key}
                visitNumber={visitNumber || 1}
                typeField={field}
                logField={logField}
                onTypeChange={(value) => onChange(field.key, value)}
                onLogChange={(value) => onChange(logField.key, value)}
              />
            )
          }
        }

        return (
          <FieldControl
            key={field.key}
            field={field}
            onChange={(value) => onChange(field.key, value)}
          />
        )
      })}
    </div>
  ))
}

function PassportSection({
  fields,
  onChange,
}: {
  fields: FieldState[]
  onChange: (fieldKey: string, value: PlainValue) => void
}) {
  const resolvedFields = useMemo(
    () => getResolvedPassportFields(fields),
    [fields]
  )

  return (
    <section className="relative rounded-box border-2 border-neutral-content p-4">
      <h2 className="mb-3 text-lg font-semibold">Паспортные данные</h2>
      <p className="m-0 text-sm opacity-70">
        Обязательны только ФИО и дата рождения.
      </p>
      {resolvedFields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
    </section>
  )
}

function VisitEditor({
  visit,
  visitsCount,
  onVisitFieldChange,
  onVisitDateChange,
  onVisitIntervalChange,
  onCopyVisit,
  onDeleteVisit,
}: {
  visit: Visit
  visitsCount: number
  onVisitFieldChange: (
    visitId: string,
    fieldKey: string,
    value: PlainValue
  ) => void
  onVisitDateChange: (visitId: string, value: PlainValue) => void
  onVisitIntervalChange: (visitId: string, value: PlainValue) => void
  onCopyVisit: (visitId: string) => void
  onDeleteVisit: (visitId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [parentRef] = useAutoAnimate()
  const title = useMemo(() => `Визит ${visit.visitNumber}`, [visit.visitNumber])

  return (
    <section
      id={`visit-${visit.visitNumber}`}
      className="scroll-mt-24 rounded-box border-2 border-neutral-content p-4"
    >
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-3 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-left text-lg font-semibold">{title}</div>

          <Button
            buttonType={ButtonTypes.ghost}
            className="btn-sm min-w-10 px-0 text-lg font-bold"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? `Развернуть ${title}` : `Свернуть ${title}`}
          >
            {collapsed ? '+' : '−'}
          </Button>
        </div>

        <div className="mt-3 flex flex-nowrap gap-2">
          <div className="flex flex-nowrap gap-2">
            <Button
              buttonType={ButtonTypes.ghost}
              className="btn-sm whitespace-nowrap"
              onClick={() => onCopyVisit(visit.id)}
            >
              Дублировать
            </Button>
            <Button
              buttonType={ButtonTypes.error}
              className="btn-sm whitespace-nowrap"
              onClick={() => onDeleteVisit(visit.id)}
              disabled={visitsCount === 1}
            >
              Удалить
            </Button>
          </div>
        </div>
      </div>

      {collapsed ? null : (
        <div ref={parentRef} className="mt-3">
          <FieldControl
            field={visit.visitDate}
            onChange={(value) => onVisitDateChange(visit.id, value)}
          />
          <FieldControl
            field={visit.interval}
            onChange={(value) => onVisitIntervalChange(visit.id, value)}
          />
          {renderGroupedFields(
            visit.fields,
            (fieldKey, value) => onVisitFieldChange(visit.id, fieldKey, value),
            visit.visitNumber
          )}
        </div>
      )}
    </section>
  )
}

export default function ({
  patient,
  onPassportChange,
  onVisitFieldChange,
  onVisitDateChange,
  onVisitIntervalChange,
  onAddVisit,
  onCopyVisit,
  onDeleteVisit,
}: ExtractedInputsProps) {
  const [visitsRef] = useAutoAnimate()

  return (
    <div className="flex flex-col gap-4">
      <PassportSection fields={patient.passport} onChange={onPassportChange} />

      <section className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Визиты{' '}
              <span className="opacity-70">Всего {patient.visits.length}</span>
            </h2>
            <p className="m-0 text-sm opacity-70">
              Все визиты используют общие паспортные данные пациента.
            </p>
          </div>

          <Button buttonType={ButtonTypes.success} onClick={onAddVisit}>
            Добавить визит
          </Button>
        </div>

        <div ref={visitsRef} className="mt-4 flex flex-col gap-4">
          {patient.visits.map((visit) => (
            <VisitEditor
              key={visit.id}
              visit={visit}
              visitsCount={patient.visits.length}
              onVisitFieldChange={onVisitFieldChange}
              onVisitDateChange={onVisitDateChange}
              onVisitIntervalChange={onVisitIntervalChange}
              onCopyVisit={onCopyVisit}
              onDeleteVisit={onDeleteVisit}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
