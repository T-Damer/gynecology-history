import type { FieldState } from 'types/Patient'

const MINIMUM_PATIENT_AGE = 12

export function formatFieldLabel(label: string) {
  if (label === 'фио') return 'ФИО'
  if (label === 'рН') return label
  if (!label) return label

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function calculateAgeFromBirthDate(
  birthDateValue: string | number | undefined
) {
  if (typeof birthDateValue !== 'string' || !birthDateValue) return undefined

  const birthDate = new Date(`${birthDateValue}T00:00:00`)
  if (Number.isNaN(birthDate.getTime())) return undefined

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1

  return age >= 0 ? age : undefined
}

export function getBirthDateMaxIso() {
  const today = new Date()
  const maxBirthDate = new Date(
    today.getFullYear() - MINIMUM_PATIENT_AGE,
    today.getMonth(),
    today.getDate()
  )

  return formatDateAsIso(maxBirthDate)
}

export function getTodayIso() {
  return formatDateAsIso(new Date())
}

export function isAllowedBirthDate(value: string | number | undefined) {
  if (typeof value !== 'string' || !value) return false

  return value <= getBirthDateMaxIso()
}

export function getResolvedPassportFields(fields: FieldState[]) {
  const birthDateValue = fields.find(
    (field) => field.key === 'birthDate'
  )?.value
  const age = calculateAgeFromBirthDate(birthDateValue)

  return fields.map((field) =>
    field.key === 'age'
      ? {
          ...field,
          value: age,
        }
      : field
  )
}

function formatDateAsIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
