import Button from 'components/Button'
import ButtonTypes from 'types/Button'
import TrashBin from 'components/Icons/TrashBin'
import goMain from 'helpers/goMain'
import ArrowLeft from './Icons/ArrowLeft'

export default function ({
  deleteEntry,
  title,
  subtitle,
}: {
  deleteEntry: () => void
  title: string
  subtitle?: string
}) {
  return (
    <div className="sticky top-0 z-30 -mx-5 border-b border-base-300 bg-base-100/95 px-5 py-3 backdrop-blur md:-mx-10 md:px-10 print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={goMain}>
            <ArrowLeft />
          </Button>

          <div>
            <h1 className="m-0 text-xl">{title}</h1>
            {subtitle ? <p className="m-0 text-sm opacity-70">{subtitle}</p> : null}
          </div>
        </div>

        <Button buttonType={ButtonTypes.error} onClick={deleteEntry}>
          <TrashBin />
        </Button>
      </div>
    </div>
  )
}
