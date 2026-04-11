import { OnChange } from 'types/FormEvent'
import { useRef } from 'preact/hooks'
import CalendarIcon from 'components/Icons/CalendarIcon'

export default function ({
  value,
  onChange,
}: {
  value: string | number | undefined
  onChange: OnChange
}) {
  const dateInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <label className="input input-bordered flex items-center gap-2">
      <input
        className="grow"
        value={value}
        onInput={onChange}
        type="date"
        ref={dateInputRef}
        required
      />
      <CalendarIcon onPress={() => dateInputRef.current?.showPicker()} />
    </label>
  )
}
