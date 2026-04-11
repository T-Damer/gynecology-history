import Button from 'components/Button'
import goMain from 'helpers/goMain'

export default function ErrorFallback() {
  return (
    <div className="flex flex-col gap-y-2 items-center justify-center w-full h-screen">
      <span>Что-то сломалось :(</span>
      <Button
        onClick={() => {
          goMain()
          window.location.reload()
        }}
      >
        Вернуться на главную
      </Button>
    </div>
  )
}
