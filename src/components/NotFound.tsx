import goMain from 'helpers/goMain'
import ArrowLeft from './Icons/ArrowLeft'

export default function () {
  return (
    <a className="text-4xl underline cursor-pointer" onClick={goMain}>
      <ArrowLeft /> <span>Пациент не найден 🔍</span>
    </a>
  )
}
