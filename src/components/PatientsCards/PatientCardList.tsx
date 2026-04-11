import { useAtomValue } from 'jotai'
import PatientCard from 'components/PatientsCards/PatientCard'
import patientsDataStore from 'atoms/patientsDataStore'
import { getFieldValue } from 'types/Patient'

function matchesSearch(search: string, values: Array<string | number | undefined>) {
  const query = search.toLowerCase().trim()
  if (!query) return true

  return values.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(query)
  )
}

export default function ({ search }: { search?: string }) {
  const patients = useAtomValue(patientsDataStore)

  const cards = Object.entries(patients)
    .reverse()
    .map(([id, patient], index) => {
      const displayName =
        String(getFieldValue(patient.passport, 'fullName') || '').trim() ||
        'Без имени'
      const birthDate = String(getFieldValue(patient.passport, 'birthDate') || '')
      const phone = String(getFieldValue(patient.passport, 'phone') || '')
      const telegram = String(getFieldValue(patient.passport, 'telegram') || '')

      if (!matchesSearch(search || '', [displayName, birthDate, phone, telegram]))
        return null

      return (
        <PatientCard
          id={id}
          displayName={displayName}
          birthDate={birthDate || undefined}
          phone={phone || undefined}
          visitsCount={patient.visits.length}
          key={index}
        />
      )
    })

  return <>{cards}</>
}
