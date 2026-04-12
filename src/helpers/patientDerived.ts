import { FieldState } from 'types/Patient'

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

export function getResolvedPassportFields(fields: FieldState[]) {
  const birthDateValue = fields.find((field) => field.key === 'birthDate')?.value
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
