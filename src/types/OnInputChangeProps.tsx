import { PlainValue } from 'types/Patient'

export default interface OnInputChangeProps {
  value: PlainValue
  headerId: string
  inputKey: string
}

export type OnChangeInput = (props: OnInputChangeProps) => void
