import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useMemo, useState } from 'preact/hooks'
import Button from 'components/Button'
import ButtonTypes from 'types/Button'
import DateInput from 'components/DateInput'
import {
  formatFieldLabel,
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
  onVisitIntervalChange: (visitId: string, value: PlainValue) => void
  onAddVisit: () => void
  onCopyVisit: (visitId: string) => void
  onDeleteVisit: (visitId: string) => void
}

function normalizeValue(field: FieldState, value: string, valueAsNumber: number) {
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
        onChange={({ currentTarget }) => onChange(currentTarget.value || undefined)}
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
      type={field.type || 'text'}
      step={field.step}
      required={field.required}
      readOnly={field.readOnly}
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
      <h4 className="mb-2 text-sm uppercase tracking-wide opacity-60">
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
  const resolvedFields = useMemo(() => getResolvedPassportFields(fields), [fields])

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
  onVisitIntervalChange: (visitId: string, value: PlainValue) => void
  onCopyVisit: (visitId: string) => void
  onDeleteVisit: (visitId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [parentRef] = useAutoAnimate()
  const title = useMemo(() => `Визит ${visit.visitNumber}`, [visit.visitNumber])

  return (
    <section className="rounded-box border-2 border-neutral-content p-4">
      <div className="sticky top-20 z-20 -mx-4 mb-3 border-b border-base-300 bg-base-100/95 px-4 py-3 backdrop-blur sm:top-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="text-left text-lg font-semibold hover:opacity-70"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {title} {collapsed ? '+' : '-'}
          </button>

          <div className="flex flex-wrap gap-2">
            <Button
              buttonType={ButtonTypes.ghost}
              className="btn-sm"
              onClick={() => onCopyVisit(visit.id)}
            >
              Дублировать
            </Button>
            <Button
              buttonType={ButtonTypes.error}
              className="btn-sm"
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
  onVisitIntervalChange,
  onAddVisit,
  onCopyVisit,
  onDeleteVisit,
}: ExtractedInputsProps) {
  const [visitsRef] = useAutoAnimate()

  return (
    <div className="flex flex-col gap-4">
      <PassportSection fields={patient.passport} onChange={onPassportChange} />

      <section className="relative rounded-box border-2 border-neutral-content p-4">
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
