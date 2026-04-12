import { atomWithStorage } from 'jotai/utils'
import type { Patient } from 'types/Patient'

interface PatientsDataStore {
  [id: string]: Patient
}

export default atomWithStorage<PatientsDataStore>(
  'patientsData',
  {},
  undefined,
  {
    getOnInit: true,
  }
)
