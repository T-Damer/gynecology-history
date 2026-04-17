import type { FieldState, Patient } from 'types/Patient'
import { getResolvedPassportFields } from './patientDerived'

function toCellValue(value: string | number | undefined) {
  if (value === undefined || value === null) return ''
  return String(value)
}

function toExportCellValue(field: FieldState) {
  if (field.type === 'image') return ''

  return toCellValue(field.value)
}

export default function (patient: Patient) {
  const passportFields = getResolvedPassportFields(patient.passport)
  const titles = [
    ...passportFields.map((field) => field.title),
    patient.visits[0]?.visitDate.title || 'Дата визита',
    patient.visits[0]?.interval.title || 'Явка',
    ...(patient.visits[0]?.fields.map((field) => field.title) ?? []),
  ]

  const rows = patient.visits.map((visit) => [
    ...passportFields.map((field) => toCellValue(field.value)),
    toCellValue(visit.visitDate.value),
    toCellValue(visit.interval.value),
    ...visit.fields.map((field) => toExportCellValue(field)),
  ])

  const plainString = [titles, ...rows].map((row) => row.join('\t')).join('\n')

  return {
    titles,
    rows,
    plainString,
  }
}
