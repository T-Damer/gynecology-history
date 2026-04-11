import { atomWithStorage } from 'jotai/utils'
import { Patient } from 'types/Patient'

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
