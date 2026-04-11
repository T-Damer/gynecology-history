import { useAtom } from 'jotai'
import { useCallback } from 'preact/hooks'
import ArrowUp from 'components/Icons/ArrowUp'
import Save from 'components/Icons/Save'
import Button from 'components/Button'
import ButtonTypes from 'types/Button'
import DetailsHeader from 'components/DetailsHeader'
import ExtractedInputs from 'components/ExtractedInputs'
import NotFound from 'components/NotFound'
import patientsDataStore from 'atoms/patientsDataStore'
import goMain from 'helpers/goMain'
import handleError from 'helpers/handleError'
import saveObjectAsXlsx from 'helpers/saveObjectAsXlsx'
import scrollTop from 'helpers/scrollTop'
import {
  createVisit,
  getFieldValue,
  Patient,
  PlainValue,
  reindexVisits,
  Visit,
} from 'types/Patient'

function updatePatient(patient: Patient, updater: (current: Patient) => Patient) {
  return updater(patient)
}

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|#%]+/g, ' ').trim() || 'patient'
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

      setCurrentPatient((patient) => ({
        ...patient,
        passport: patient.passport.map((field) =>
          field.key === fieldKey ? { ...field, value } : field
        ),
      }))
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
        const visitIndex = patient.visits.findIndex((visit) => visit.id === visitId)
        if (visitIndex < 0) return patient

        const visitToCopy = patient.visits[visitIndex]
        const duplicatedVisit: Visit = {
          ...createVisit(visitToCopy.visitNumber + 1),
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
  const phone = String(getFieldValue(currentPatient.passport, 'phone') || '').trim()
  const subtitle = [phone, `Визитов: ${currentPatient.visits.length}`]
    .filter(Boolean)
    .join(' · ')
  const fileName = safeFileName(displayName)

  const saveAndExport = useCallback(() => {
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
        onVisitIntervalChange={onVisitIntervalChange}
        onAddVisit={onAddVisit}
        onCopyVisit={onCopyVisit}
        onDeleteVisit={onDeleteVisit}
      />

      <div className="flex flex-row w-full gap-x-2 sticky bottom-safe-bottom z-20 print:hidden drop-shadow-md">
        <Button
          buttonType={ButtonTypes.success}
          onClick={saveAndExport}
          className="w-2/3"
          iconRight={<Save />}
        >
          Экспортировать
        </Button>

        <Button
          buttonType={ButtonTypes.success}
          onClick={scrollTop}
          className="w-1/3"
        >
          <ArrowUp />
        </Button>
      </div>
    </div>
  )
}
