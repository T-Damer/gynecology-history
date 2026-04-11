import CrossIcon from 'components/Icons/CrossIcon'
import SearchIcon from 'components/Icons/SearchIcon'

export default function ({
  search,
  setSearch,
}: {
  search?: string
  setSearch: (s: string) => void
}) {
  return (
    <label className="input input-bordered flex items-center gap-2 m-1">
      <input
        type="text"
        className="grow"
        placeholder="Поиск по ФИО, телефону или дате рождения"
        value={search}
        onInput={(e) => setSearch(e.currentTarget.value)}
      />
      {search ? <CrossIcon onPress={() => setSearch('')} /> : <SearchIcon />}
    </label>
  )
}
