import { useAutoAnimate } from '@formkit/auto-animate/preact'
import CreatePatientCard from 'components/PatientsCards/CreatePatientCard'
import PatientCardList from 'components/PatientsCards/PatientCardList'
import SearchBar from 'components/SearchBar'
import { useState } from 'preact/hooks'

export default function () {
  const [parentRef] = useAutoAnimate()
  const [search, setSearch] = useState('')

  return (
    <div>
      <h1>🚺 Gynecology history</h1>
      <SearchBar search={search} setSearch={setSearch} />
      <div className="flex flex-wrap" ref={parentRef}>
        <CreatePatientCard />
        <PatientCardList search={search} />
      </div>
    </div>
  )
}
