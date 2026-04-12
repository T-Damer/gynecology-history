import { JSXInternal } from 'preact/src/jsx'
import { read, utils } from 'xlsx'
import {
  createPatient,
  createVisit,
  FieldState,
  Patient,
  PlainValue,
  reindexVisits,
} from 'types/Patient'
import handleError from './handleError'

function parseImportedValue(field: FieldState, rawValue: unknown): PlainValue {
  if (rawValue === undefined || rawValue === null || rawValue === '') return undefined

  const stringValue = String(rawValue)

  if (field.type === 'number') {
    const parsed = Number(stringValue)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  return stringValue
}

function fillFieldState(fields: FieldState[], row: Record<string, unknown>) {
  return fields.map((field) => ({
    ...field,
    value: parseImportedValue(field, row[field.title]),
  }))
}

export default async function (
  e: JSXInternal.TargetedInputEvent<HTMLInputElement>
) {
  const file = e.currentTarget?.files?.[0]

  if (!file) {
    const error = 'Не получилось загрузить файл'
    handleError({ e: error, toastMessage: error })
    return
  }

  const data = await file.arrayBuffer()
  const workBook = read(data)
  const workSheet = workBook.Sheets[workBook.SheetNames[0]]
  const rows = utils.sheet_to_json<Record<string, unknown>>(workSheet, {
    defval: '',
  })

  if (!rows.length) {
    const error = 'Файл пустой или не содержит строк с визитами'
    handleError({ e: error, toastMessage: error })
    return
  }

  const patient: Patient = createPatient()
  patient.passport = fillFieldState(patient.passport, rows[0])
  patient.visits = rows.map((row, index) => {
    const visit = createVisit(index + 1)

    return {
      ...visit,
      visitDate: {
        ...visit.visitDate,
        value: parseImportedValue(visit.visitDate, row[visit.visitDate.title]),
      },
      interval: {
        ...visit.interval,
        value: parseImportedValue(visit.interval, row[visit.interval.title]),
      },
      fields: fillFieldState(visit.fields, row),
    }
  })

  patient.visits = reindexVisits(patient.visits)

  return patient
}
