import { atomWithStorage } from 'jotai/utils'
import { createPatient, createVisit, reindexVisits } from 'types/Patient'
import type { Patient, PlainValue, Visit } from 'types/Patient'

interface PatientsDataStore {
  [id: string]: Patient
}

const STORAGE_KEY = 'gynecology-history:patientsData:v1'
const LEGACY_STORAGE_KEY = 'patientsData'

interface RawField {
  key?: unknown
  value?: unknown
}

interface RawVisit {
  id?: unknown
  visitDate?: unknown
  interval?: unknown
  fields?: unknown
}

interface RawPatient {
  passport?: unknown
  visits?: unknown
}

interface RawValueHolder {
  value?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRawField(value: unknown): value is RawField {
  return isRecord(value)
}

function isRawVisit(value: unknown): value is RawVisit {
  return isRecord(value)
}

function isRawPatient(value: unknown): value is RawPatient {
  return isRecord(value)
}

function isRawValueHolder(value: unknown): value is RawValueHolder {
  return isRecord(value)
}

function normalizePlainValue(value: unknown): PlainValue {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === 'string') {
    return value || undefined
  }

  return undefined
}

function getFieldValueMap(fields: unknown) {
  if (!Array.isArray(fields)) return new Map<string, PlainValue>()

  return new Map(
    fields.flatMap((field) => {
      if (!isRawField(field) || typeof field.key !== 'string') return []

      return [[field.key, normalizePlainValue(field.value)]]
    })
  )
}

function normalizeVisit(rawVisit: unknown, visitNumber: number): Visit {
  const normalizedVisit = createVisit(visitNumber)
  if (!isRawVisit(rawVisit)) return normalizedVisit

  const fieldValueMap = getFieldValueMap(rawVisit.fields)

  return {
    ...normalizedVisit,
    id:
      typeof rawVisit.id === 'string' && rawVisit.id.trim().length > 0
        ? rawVisit.id
        : normalizedVisit.id,
    visitDate: {
      ...normalizedVisit.visitDate,
      value: isRawValueHolder(rawVisit.visitDate)
        ? normalizePlainValue(rawVisit.visitDate.value)
        : undefined,
    },
    interval: {
      ...normalizedVisit.interval,
      value: isRawValueHolder(rawVisit.interval)
        ? normalizePlainValue(rawVisit.interval.value)
        : undefined,
    },
    fields: normalizedVisit.fields.map((field) => ({
      ...field,
      value: fieldValueMap.get(field.key),
    })),
  }
}

function normalizePatient(rawPatient: unknown): Patient | null {
  if (!isRawPatient(rawPatient)) return null

  const normalizedPatient = createPatient()
  const passportValueMap = getFieldValueMap(rawPatient.passport)
  const rawVisits = Array.isArray(rawPatient.visits) ? rawPatient.visits : []

  normalizedPatient.passport = normalizedPatient.passport.map((field) => ({
    ...field,
    value: passportValueMap.get(field.key),
  }))
  normalizedPatient.visits = reindexVisits(
    (rawVisits.length ? rawVisits : [createVisit(1)]).map((visit, index) =>
      normalizeVisit(visit, index + 1)
    )
  )

  return normalizedPatient
}

function normalizePatientsStore(rawStore: unknown): PatientsDataStore {
  if (!isRecord(rawStore)) return {}

  return Object.fromEntries(
    Object.entries(rawStore).flatMap(([id, rawPatient]) => {
      const normalizedPatient = normalizePatient(rawPatient)

      return normalizedPatient ? [[id, normalizedPatient]] : []
    })
  )
}

function parseStoredValue(key: string) {
  if (typeof window === 'undefined') {
    return { found: false, value: undefined as unknown }
  }

  const rawValue = window.localStorage.getItem(key)
  if (rawValue === null) return { found: false, value: undefined as unknown }

  try {
    return { found: true, value: JSON.parse(rawValue) as unknown }
  } catch {
    return { found: true, value: undefined as unknown }
  }
}

function isEmptyObject(value: unknown) {
  return isRecord(value) && Object.keys(value).length === 0
}

const patientsDataStorage = {
  getItem: (_key: string, initialValue: PatientsDataStore) => {
    const scopedValue = parseStoredValue(STORAGE_KEY)
    const normalizedScopedValue = normalizePatientsStore(scopedValue.value)

    if (
      scopedValue.found &&
      (Object.keys(normalizedScopedValue).length > 0 ||
        isEmptyObject(scopedValue.value))
    ) {
      return normalizedScopedValue
    }

    const legacyValue = parseStoredValue(LEGACY_STORAGE_KEY)
    const normalizedLegacyValue = normalizePatientsStore(legacyValue.value)

    if (Object.keys(normalizedLegacyValue).length === 0) {
      return initialValue
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedLegacyValue)
    )

    return normalizedLegacyValue
  },
  setItem: (_key: string, value: PatientsDataStore) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  removeItem: () => {
    window.localStorage.removeItem(STORAGE_KEY)
  },
  subscribe: (
    _key: string,
    callback: (value: PatientsDataStore) => void,
    initialValue: PatientsDataStore
  ) => {
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return

      let parsedValue = initialValue

      if (event.newValue !== null) {
        try {
          parsedValue = normalizePatientsStore(JSON.parse(event.newValue))
        } catch {
          parsedValue = initialValue
        }
      }

      callback(parsedValue)
    }

    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener('storage', handler)
    }
  },
}

export default atomWithStorage<PatientsDataStore>(
  STORAGE_KEY,
  {},
  patientsDataStorage,
  {
    getOnInit: true,
  }
)
