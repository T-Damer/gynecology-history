import patientsDataStore from 'atoms/patientsDataStore'
import PatientCard from 'components/PatientsCards/PatientCard'
import { calculateAgeFromBirthDate } from 'helpers/patientDerived'
import { useAtomValue } from 'jotai'
import { getFieldValue } from 'types/Patient'

function matchesSearch(
  search: string,
  values: Array<string | number | undefined>
) {
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
    .map(([id, patient]) => {
      const displayName =
        String(getFieldValue(patient.passport, 'fullName') || '').trim() ||
        'Без имени'
      const birthDate = String(
        getFieldValue(patient.passport, 'birthDate') || ''
      )
      const phone = String(getFieldValue(patient.passport, 'phone') || '')
      const age = calculateAgeFromBirthDate(birthDate || undefined)

      if (!matchesSearch(search || '', [displayName, birthDate, phone]))
        return null

      return (
        <PatientCard
          id={id}
          displayName={displayName}
          birthDate={birthDate || undefined}
          phone={phone || undefined}
          age={age}
          visitsCount={patient.visits.length}
          key={id}
        />
      )
    })

  return <>{cards}</>
}
