export type InputChangeValues = {
  value: string
  valueAsNumber?: number
  valueAsDate?: Date | null
}

export type OnChange = (e: FormEvent) => void

export type FormEvent = {
  currentTarget: InputChangeValues
}
