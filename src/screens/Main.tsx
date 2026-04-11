import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useState } from 'preact/hooks'
import CreatePatientCard from 'components/PatientsCards/CreatePatientCard'
import PatientCardList from 'components/PatientsCards/PatientCardList'
import SearchBar from 'components/SearchBar'

export default function () {
  const [parentRef] = useAutoAnimate()
  const [search, setSearch] = useState('')

  return (
    <div>
      <h1>Gynecology history</h1>
      <p className="mt-0 opacity-70">
        Создавайте карточки пациентов, добавляйте неограниченное количество
        визитов и экспортируйте данные в Excel по строке на визит.
      </p>
      <SearchBar search={search} setSearch={setSearch} />
      <div className="flex flex-wrap" ref={parentRef}>
        <CreatePatientCard />
        <PatientCardList search={search} />
      </div>
    </div>
  )
}
