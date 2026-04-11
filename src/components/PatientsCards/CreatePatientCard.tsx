import { useCallback, useMemo, useState } from 'preact/hooks'
import { useSetAtom } from 'jotai'
import { v4 } from 'uuid'
import Button from 'components/Button'
import ButtonTypes from 'types/Button'
import Card from 'components/Card'
import handleError from 'helpers/handleError'
import importXlsxPatient from 'helpers/importXlsxPatient'
import patientsDataStore from 'atoms/patientsDataStore'
import { createPatient } from 'types/Patient'

interface DraftPassport {
  telegram: string | undefined
  fullName: string | undefined
  birthDate: string | undefined
  age: number | undefined
  phone: string | undefined
}

const initialDraft: DraftPassport = {
  telegram: '',
  fullName: '',
  birthDate: '',
  age: undefined,
  phone: '',
}

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

    setPatientsData((prevData) => ({
      ...prevData,
      [v4()]: createPatient({
        telegram: draft.telegram?.trim() || undefined,
        fullName: draft.fullName?.trim(),
        birthDate: draft.birthDate || undefined,
        age: draft.age,
        phone: draft.phone?.trim() || undefined,
      }),
    }))

    clearData()
  }, [clearData, draft, setPatientsData])

  const disabled = useMemo(() => !draft.fullName?.trim(), [draft.fullName])

  return (
    <div className="flex flex-col gap-2 justify-center">
      <input
        type="text"
        placeholder="ФИО"
        className="input input-bordered"
        value={draft.fullName || ''}
        onInput={(e) =>
          setDraft((prev) => ({ ...prev, fullName: e.currentTarget.value }))
        }
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Тел."
          className="input input-bordered"
          value={draft.telegram || ''}
          onInput={(e) =>
            setDraft((prev) => ({ ...prev, telegram: e.currentTarget.value }))
          }
        />
        <input
          type="text"
          placeholder="Телефон"
          className="input input-bordered"
          value={draft.phone || ''}
          onInput={(e) =>
            setDraft((prev) => ({ ...prev, phone: e.currentTarget.value }))
          }
        />
        <input
          type="date"
          className="input input-bordered"
          value={draft.birthDate || ''}
          onInput={(e) =>
            setDraft((prev) => ({ ...prev, birthDate: e.currentTarget.value }))
          }
        />
        <input
          type="number"
          min="0"
          step="1"
          placeholder="Возраст"
          className="input input-bordered"
          value={draft.age ?? ''}
          onInput={(e) =>
            setDraft((prev) => ({
              ...prev,
              age: Number.isNaN(e.currentTarget.valueAsNumber)
                ? undefined
                : e.currentTarget.valueAsNumber,
            }))
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
