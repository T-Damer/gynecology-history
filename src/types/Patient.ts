import {
  passportFieldConfigs,
  visitFieldConfigs,
  visitIntervalConfig,
} from 'config/formSchema'
import { getTodayIso } from 'helpers/patientDerived'
import { v4 } from 'uuid'

export type InputType = 'number' | 'date' | 'string' | 'textarea'
export type PlainValue = number | string | undefined

export interface FieldConfig {
  key: string
  title: string
  type?: InputType
  htmlType?: string
  options?: string[]
  placeholder?: string
  description?: string
  step?: number
  group?: string
  required?: boolean
  readOnly?: boolean
  inputMode?:
    | 'text'
    | 'numeric'
    | 'decimal'
    | 'tel'
    | 'search'
    | 'email'
    | 'url'
  pattern?: string
  autoComplete?: string
  multiValue?: boolean
}

export interface FieldState extends FieldConfig {
  value?: PlainValue
}

export interface Visit {
  id: string
  visitNumber: number
  visitDate: FieldState
  interval: FieldState
  fields: FieldState[]
}

export interface Patient {
  passport: FieldState[]
  visits: Visit[]
}

function cloneField(config: FieldConfig, value?: PlainValue): FieldState {
  return { ...config, value }
}

export function createVisit(visitNumber: number): Visit {
  return {
    id: v4(),
    visitNumber,
    visitDate: cloneField(
      {
        key: 'visitDate',
        title: 'Дата визита',
        type: 'date',
        required: true,
      },
      getTodayIso()
    ),
    interval: cloneField(visitIntervalConfig),
    fields: visitFieldConfigs.map(cloneField),
  }
}

function applyInitialValues(
  fields: FieldState[],
  initialValues?: Partial<Record<string, PlainValue>>
) {
  if (!initialValues) return fields

  return fields.map((field) => ({
    ...field,
    value: initialValues[field.key] ?? field.value,
  }))
}

export function createPatient(
  initialPassport?: Partial<Record<string, PlainValue>>
): Patient {
  return {
    passport: applyInitialValues(
      passportFieldConfigs.map(cloneField),
      initialPassport
    ),
    visits: [createVisit(1)],
  }
}

export function reindexVisits(visits: Visit[]) {
  return visits.map((visit, index) => ({
    ...visit,
    visitNumber: index + 1,
  }))
}

export function clonePatient(patient: Patient): Patient {
  return {
    passport: patient.passport.map((field) => ({ ...field })),
    visits: patient.visits.map((visit, index) => ({
      id: v4(),
      visitNumber: index + 1,
      visitDate: { ...visit.visitDate },
      interval: { ...visit.interval },
      fields: visit.fields.map((field) => ({ ...field })),
    })),
  }
}

export function getFieldValue(fields: FieldState[], key: string) {
  return fields.find((field) => field.key === key)?.value
}

export function getFieldTitle(fields: FieldState[], key: string) {
  return fields.find((field) => field.key === key)?.title || key
}
