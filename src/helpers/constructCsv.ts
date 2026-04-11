import { Patient } from 'types/Patient'

function toCellValue(value: string | number | undefined) {
  if (value === undefined || value === null) return ''
  return String(value)
}

export default function (patient: Patient) {
  const titles = [
    ...patient.passport.map((field) => field.title),
    patient.visits[0]?.interval.title || 'Явка',
    ...patient.visits[0]?.fields.map((field) => field.title),
  ]

  const rows = patient.visits.map((visit) => [
    ...patient.passport.map((field) => toCellValue(field.value)),
    toCellValue(visit.interval.value),
    ...visit.fields.map((field) => toCellValue(field.value)),
  ])

  const plainString = [titles, ...rows].map((row) => row.join('\t')).join('\n')

  return {
    titles,
    rows,
    plainString,
  }
}
