import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useMemo, useState } from 'preact/hooks'
import Button from 'components/Button'
import ButtonTypes from 'types/Button'
import DateInput from 'components/DateInput'
import {
  formatFieldLabel,
  getBirthDateMaxIso,
  getResolvedPassportFields,
} from 'helpers/patientDerived'
import { FieldState, Patient, PlainValue, Visit } from 'types/Patient'

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

function normalizeValue(
  field: FieldState,
  value: string,
  valueAsNumber: number
) {
  if (field.type === 'number') {
    return Number.isNaN(valueAsNumber) ? undefined : valueAsNumber
  }

  return value || undefined
}

function ProcessedInput({
  field,
  onChange,
}: {
  field: FieldState
  onChange: (value: PlainValue) => void
}) {
  const max = field.key === 'birthDate' ? getBirthDateMaxIso() : undefined

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
    <label className="form-control w-full my-3 gap-1">
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
    </label>
  )
}

function renderGroupedFields(
  fields: FieldState[],
  onChange: (fieldKey: string, value: PlainValue) => void
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
      {groupFields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          onChange={(value) => onChange(field.key, value)}
        />
      ))}
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
    <section className="rounded-box border-2 border-neutral-content p-4">
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
          {renderGroupedFields(visit.fields, (fieldKey, value) =>
            onVisitFieldChange(visit.id, fieldKey, value)
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
            <h2 className="text-lg font-semibold">Визиты</h2>
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
