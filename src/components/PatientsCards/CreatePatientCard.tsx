import patientsDataStore from 'atoms/patientsDataStore'
import Button from 'components/Button'
import Card from 'components/Card'
import DateInput from 'components/DateInput'
import { passportFieldConfigs } from 'config/formSchema'
import handleError from 'helpers/handleError'
import importXlsxPatient from 'helpers/importXlsxPatient'
import { getBirthDateMaxIso, isAllowedBirthDate } from 'helpers/patientDerived'
import { useSetAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'preact/hooks'
import ButtonTypes from 'types/Button'
import { createPatient } from 'types/Patient'
import { v4 } from 'uuid'

interface DraftPassport {
  fullName: string | undefined
  birthDate: string | undefined
}

const initialDraft: DraftPassport = {
  fullName: '',
  birthDate: '',
}

const requiredPassportKeys = new Set(
  passportFieldConfigs
    .filter((field) => field.required)
    .map((field) => field.key)
)

function AddPatientForm() {
  const [draft, setDraft] = useState<DraftPassport>(initialDraft)
  const setPatientsData = useSetAtom(patientsDataStore)

  const clearData = useCallback(() => {
    setDraft(initialDraft)
  }, [])

  const onSubmit = useCallback(() => {
    if (!draft.fullName?.trim()) {
      const error = 'Введите ФИО пациента'
      handleError({ e: error, toastMessage: error })
      return
    }

    if (!draft.birthDate) {
      const error = 'Введите дату рождения пациента'
      handleError({ e: error, toastMessage: error })
      return
    }

    if (!isAllowedBirthDate(draft.birthDate)) {
      const error = 'Минимальный возраст пациента — 12 лет'
      handleError({ e: error, toastMessage: error })
      return
    }

    setPatientsData((prevData) => ({
      ...prevData,
      [v4()]: createPatient({
        fullName: draft.fullName?.trim(),
        birthDate: draft.birthDate || undefined,
      }),
    }))

    clearData()
  }, [clearData, draft, setPatientsData])

  const disabled = useMemo(
    () => !draft.fullName?.trim() || !draft.birthDate,
    [draft.birthDate, draft.fullName]
  )

  return (
    <div className="flex flex-col gap-2 justify-center">

      <div className="form-control w-full gap-1">
        <span className="text-sm font-medium">Имя пациента</span>
        <input
          type="text"
          placeholder="ФИО *"
          className="input input-bordered"
          value={draft.fullName || ''}
          required={requiredPassportKeys.has('fullName')}
          onInput={(e) =>
            setDraft((prev) => ({ ...prev, fullName: e.currentTarget.value }))
          }
        />
      </div>

      <div className="form-control w-full gap-1">
        <span className="text-sm font-medium">Дата рождения</span>
        <DateInput
          value={draft.birthDate || ''}
          required={requiredPassportKeys.has('birthDate')}
          max={getBirthDateMaxIso()}
          onChange={({ currentTarget }) =>
            setDraft((prev) => ({ ...prev, birthDate: currentTarget.value }))
          }
        />
      </div>

      <div className="flex items-center gap-x-2 pr-1.5">
        <Button
          buttonType={ButtonTypes.success}
          disabled={disabled}
          onClick={onSubmit}
          className="w-1/2"
        >
          Добавить
        </Button>

        <Button
          buttonType={ButtonTypes.error}
          onClick={clearData}
          disabled={!Object.values(draft).some(Boolean)}
          className="w-1/2"
        >
          Очистить
        </Button>
      </div>
    </div>
  )
}

function ImportPatient() {
  const setPatients = useSetAtom(patientsDataStore)
  const [parsedResult, setParsedResult] = useState<ReturnType<
    typeof createPatient
  > | null>(null)

  const onClick = useCallback(() => {
    if (!parsedResult) return

    setPatients((prev) => ({
      ...prev,
      [v4()]: parsedResult,
    }))
    setParsedResult(null)
  }, [parsedResult, setPatients])

  return (
    <div className="flex flex-col gap-2 justify-center">
      <input
        type="file"
        accept=".xls,.xlsx"
        className="file-input file-input-bordered w-full"
        onInput={async (e) => {
          const newPatient = await importXlsxPatient(e)
          if (!newPatient) return
          setParsedResult(newPatient)
        }}
      />
      <p className="m-0 text-sm opacity-70">
        Программа может обработать только файлы, созданные ей.
      </p>
      <Button
        buttonType={ButtonTypes.success}
        onClick={onClick}
        disabled={!parsedResult}
      >
        Загрузить экспорт
      </Button>
    </div>
  )
}

export default function () {
  return (
    <div className="w-full flex flex-col gap-2">
      <Card dashedOutline>
        <AddPatientForm />
      </Card>
      <Card dashedOutline>
        <ImportPatient />
      </Card>
    </div>
  )
}
