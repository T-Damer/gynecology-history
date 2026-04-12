import patientsDataStore from 'atoms/patientsDataStore'
import Button from 'components/Button'
import Chart from 'components/Chart'
import DetailsHeader from 'components/DetailsHeader'
import ExtractedInputs from 'components/ExtractedInputs'
import ArrowUp from 'components/Icons/ArrowUp'
import Save from 'components/Icons/Save'
import NotFound from 'components/NotFound'
import goMain from 'helpers/goMain'
import handleError from 'helpers/handleError'
import {
  calculateAgeFromBirthDate,
  formatFieldLabel,
  isAllowedBirthDate,
} from 'helpers/patientDerived'
import saveObjectAsXlsx from 'helpers/saveObjectAsXlsx'
import scrollTop from 'helpers/scrollTop'
import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import ButtonTypes from 'types/Button'
import {
  type Patient,
  type PlainValue,
  type Visit,
  createVisit,
  getFieldValue,
  reindexVisits,
} from 'types/Patient'

function updatePatient(
  patient: Patient,
  updater: (current: Patient) => Patient
) {
  return updater(patient)
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|#%]+/g, ' ').trim() || 'patient'
}

function ScrollJumpButtons() {
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    const update = () => {
      const scrollTopPosition = window.scrollY
      const viewportHeight = window.innerHeight
      const fullHeight = document.documentElement.scrollHeight
      const threshold = 16

      setCanScrollUp(scrollTopPosition > threshold)
      setCanScrollDown(
        scrollTopPosition + viewportHeight < fullHeight - threshold
      )
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (!canScrollUp && !canScrollDown) return null

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2 print:hidden md:right-6">
      {canScrollUp ? (
        <Button
          buttonType={ButtonTypes.ghost}
          className="btn-circle border border-base-300 bg-base-100 shadow-lg backdrop-blur"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Прокрутить вверх"
        >
          <ArrowUp />
        </Button>
      ) : null}

      {canScrollDown ? (
        <Button
          buttonType={ButtonTypes.ghost}
          className="btn-circle border border-base-300 bg-base-100 shadow-lg backdrop-blur"
          onClick={() =>
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth',
            })
          }
          aria-label="Прокрутить вниз"
        >
          <span className="rotate-180">
            <ArrowUp />
          </span>
        </Button>
      ) : null}
    </div>
  )
}

export default function ({ id }: { id: string }) {
  const [patientsData, setPatientsData] = useAtom(patientsDataStore)
  const currentPatient = patientsData[id]

  const setCurrentPatient = useCallback(
    (updater: (patient: Patient) => Patient) => {
      setPatientsData((prev) => {
        const patient = prev[id]
        if (!patient) return prev

        return {
          ...prev,
          [id]: updatePatient(patient, updater),
        }
      })
    },
    [id, setPatientsData]
  )

  const deleteEntry = useCallback(() => {
    if (!currentPatient) {
      const error = 'Не удалось найти пациента при удалении'
      handleError({ e: error, toastMessage: error })
      return
    }

    setPatientsData((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    goMain()
  }, [currentPatient, id, setPatientsData])

  const onPassportChange = useCallback(
    (fieldKey: string, value: PlainValue) => {
      if (String(value || '').includes('\t')) {
        const error = 'Нельзя использовать tab, файл будет поврежден'
        handleError({ e: error, toastMessage: error })
        return
      }

      setCurrentPatient((patient) => {
        const targetField = patient.passport.find(
          (field) => field.key === fieldKey
        )

        if (!targetField) return patient

        const isEmptyRequiredValue =
          targetField.required &&
          (value === undefined ||
            (typeof value === 'string' && value.trim().length === 0))

        if (isEmptyRequiredValue) {
          const error = `Поле "${formatFieldLabel(targetField.title)}" обязательно`
          handleError({ e: error, toastMessage: error })
          return patient
        }

        if (fieldKey === 'birthDate' && value && !isAllowedBirthDate(value)) {
          const error = 'Минимальный возраст пациента — 12 лет'
          handleError({ e: error, toastMessage: error })
          return patient
        }

        return {
          ...patient,
          passport: patient.passport.map((field) =>
            field.key === fieldKey ? { ...field, value } : field
          ),
        }
      })
    },
    [setCurrentPatient]
  )

  const onVisitFieldChange = useCallback(
    (visitId: string, fieldKey: string, value: PlainValue) => {
      if (String(value || '').includes('\t')) {
        const error = 'Нельзя использовать tab, файл будет поврежден'
        handleError({ e: error, toastMessage: error })
        return
      }

      setCurrentPatient((patient) => ({
        ...patient,
        visits: patient.visits.map((visit) =>
          visit.id === visitId
            ? {
                ...visit,
                fields: visit.fields.map((field) =>
                  field.key === fieldKey ? { ...field, value } : field
                ),
              }
            : visit
        ),
      }))
    },
    [setCurrentPatient]
  )

  const onVisitDateChange = useCallback(
    (visitId: string, value: PlainValue) => {
      setCurrentPatient((patient) => {
        const targetVisit = patient.visits.find((visit) => visit.id === visitId)
        if (!targetVisit) return patient

        const isEmptyRequiredValue =
          targetVisit.visitDate.required &&
          (value === undefined ||
            (typeof value === 'string' && value.trim().length === 0))

        if (isEmptyRequiredValue) {
          const error = `Поле "${formatFieldLabel(targetVisit.visitDate.title)}" обязательно`
          handleError({ e: error, toastMessage: error })
          return patient
        }

        return {
          ...patient,
          visits: patient.visits.map((visit) =>
            visit.id === visitId
              ? {
                  ...visit,
                  visitDate: { ...visit.visitDate, value },
                }
              : visit
          ),
        }
      })
    },
    [setCurrentPatient]
  )

  const onVisitIntervalChange = useCallback(
    (visitId: string, value: PlainValue) => {
      setCurrentPatient((patient) => ({
        ...patient,
        visits: patient.visits.map((visit) =>
          visit.id === visitId
            ? {
                ...visit,
                interval: { ...visit.interval, value },
              }
            : visit
        ),
      }))
    },
    [setCurrentPatient]
  )

  const onAddVisit = useCallback(() => {
    setCurrentPatient((patient) => ({
      ...patient,
      visits: [...patient.visits, createVisit(patient.visits.length + 1)],
    }))
  }, [setCurrentPatient])

  const onCopyVisit = useCallback(
    (visitId: string) => {
      setCurrentPatient((patient) => {
        const visitIndex = patient.visits.findIndex(
          (visit) => visit.id === visitId
        )
        if (visitIndex < 0) return patient

        const visitToCopy = patient.visits[visitIndex]
        const duplicatedVisit: Visit = {
          ...createVisit(visitToCopy.visitNumber + 1),
          visitDate: { ...visitToCopy.visitDate },
          interval: { ...visitToCopy.interval },
          fields: visitToCopy.fields.map((field) => ({ ...field })),
        }

        const nextVisits = [...patient.visits]
        nextVisits.splice(visitIndex + 1, 0, duplicatedVisit)

        return {
          ...patient,
          visits: reindexVisits(nextVisits),
        }
      })
    },
    [setCurrentPatient]
  )

  const onDeleteVisit = useCallback(
    (visitId: string) => {
      setCurrentPatient((patient) => {
        if (patient.visits.length === 1) {
          const error = 'У пациента должен оставаться хотя бы один визит'
          handleError({ e: error, toastMessage: error })
          return patient
        }

        return {
          ...patient,
          visits: reindexVisits(
            patient.visits.filter((visit) => visit.id !== visitId)
          ),
        }
      })
    },
    [setCurrentPatient]
  )

  if (!currentPatient) return <NotFound />

  const displayName =
    String(getFieldValue(currentPatient.passport, 'fullName') || '').trim() ||
    'Без имени'
  const phone = String(
    getFieldValue(currentPatient.passport, 'phone') || ''
  ).trim()
  const age = calculateAgeFromBirthDate(
    getFieldValue(currentPatient.passport, 'birthDate')
  )
  const subtitle = [
    age !== undefined ? `${age} лет` : undefined,
    phone,
    `Визитов: ${currentPatient.visits.length}`,
  ]
    .filter(Boolean)
    .join(' · ')
  const fileName = safeFileName(displayName)
  const chartVisits = useMemo(
    () =>
      currentPatient.visits.map((visit) => ({
        visitNumber: visit.visitNumber,
        visitDate:
          typeof visit.visitDate.value === 'string'
            ? visit.visitDate.value
            : undefined,
        hpvTypes: getFieldValue(visit.fields, 'hpvType'),
        hpvLogs: getFieldValue(visit.fields, 'hpvLog'),
      })),
    [currentPatient.visits]
  )

  const saveAndExport = useCallback(() => {
    const missingVisitDate = currentPatient.visits.find(
      (visit) =>
        visit.visitDate.required &&
        (!visit.visitDate.value ||
          (typeof visit.visitDate.value === 'string' &&
            visit.visitDate.value.trim().length === 0))
    )

    if (missingVisitDate) {
      const error = `Укажите ${formatFieldLabel(
        missingVisitDate.visitDate.title
      )} для визита ${missingVisitDate.visitNumber}`
      handleError({ e: error, toastMessage: error })
      return
    }

    saveObjectAsXlsx(fileName, currentPatient)
  }, [currentPatient, fileName])

  return (
    <div className="flex flex-col gap-4">
      <DetailsHeader
        deleteEntry={deleteEntry}
        title={displayName}
        subtitle={subtitle}
      />

      <ExtractedInputs
        patient={currentPatient}
        onPassportChange={onPassportChange}
        onVisitFieldChange={onVisitFieldChange}
        onVisitDateChange={onVisitDateChange}
        onVisitIntervalChange={onVisitIntervalChange}
        onAddVisit={onAddVisit}
        onCopyVisit={onCopyVisit}
        onDeleteVisit={onDeleteVisit}
      />

      <Chart visits={chartVisits} />

      <div className="flex flex-row w-full gap-x-2 bottom-safe-bottom z-20 print:hidden drop-shadow-md">
        <Button
          buttonType={ButtonTypes.success}
          onClick={saveAndExport}
          className="w-2/3 shadow-xl"
          iconRight={<Save />}
        >
          Экспортировать
        </Button>

        <Button
          buttonType={ButtonTypes.success}
          onClick={scrollTop}
          className="w-1/3 shadow-xl"
        >
          <ArrowUp />
        </Button>
      </div>

      <ScrollJumpButtons />
    </div>
  )
}
