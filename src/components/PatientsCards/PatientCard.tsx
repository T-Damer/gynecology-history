import { useCallback } from 'preact/hooks'
import { useHashLocation } from 'wouter-preact/use-hash-location'
import { useAtom } from 'jotai'
import Button from 'components/Button'
import Card from 'components/Card'
import patientsDataStore from 'atoms/patientsDataStore'
import handleError from 'helpers/handleError'
import scrollTop from 'helpers/scrollTop'
import { clonePatient } from 'types/Patient'
import { v4 } from 'uuid'

export default function ({
  id,
  displayName,
  birthDate,
  phone,
  age,
  visitsCount,
}: {
  id: string
  displayName: string
  birthDate: string | undefined
  phone: string | undefined
  age: number | undefined
  visitsCount: number
}) {
  const [patients, setPatients] = useAtom(patientsDataStore)
  const [, setLocation] = useHashLocation()

  const onPress = useCallback(() => {
    setLocation(`/patient/${id}`)
    scrollTop()
  }, [id, setLocation])

  const onCopy = useCallback(() => {
    const currentPatient = patients[id]

    if (!currentPatient) {
      const error = 'Пациент не найден'
      handleError({ e: error, toastMessage: error })
      return
    }

    setPatients((prev) => ({
      ...prev,
      [v4()]: clonePatient(currentPatient),
    }))
  }, [id, patients, setPatients])

  return (
    <Card>
      <div className="flex flex-col justify-between overflow-hidden w-full gap-3">
        <div className="flex-1 flex flex-col gap-1" onClick={onPress}>
          <span className="font-bold truncate-2 leading-snug">{displayName}</span>
          {birthDate ? <span className="text-sm opacity-70">{birthDate}</span> : null}
          {age !== undefined ? (
            <span className="text-sm opacity-70">Возраст: {age}</span>
          ) : null}
          {phone ? <span className="text-sm opacity-70">{phone}</span> : null}
          <span className="text-sm opacity-70">Визитов: {visitsCount}</span>
        </div>
        <Button alt="Копировать" onClick={onCopy} className="w-full">
          Копировать
        </Button>
      </div>
    </Card>
  )
}
