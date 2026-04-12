import goMain from 'helpers/goMain'
import ArrowLeft from './Icons/ArrowLeft'

export default function () {
  return (
    <button
      className="inline-flex cursor-pointer items-center gap-2 text-4xl underline"
      onClick={goMain}
      type="button"
    >
      <ArrowLeft /> <span>Пациент не найден 🔍</span>
    </button>
  )
}
