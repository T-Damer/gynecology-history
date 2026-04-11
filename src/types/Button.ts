import { ComponentChildren } from 'preact'
import { JSX } from 'preact/jsx-runtime'

enum ButtonTypes {
  success,
  error,
  primary,
  outline,
  ghost,
}

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  buttonType?: ButtonTypes | undefined
  children: ComponentChildren
  iconLeft?: JSX.Element | null
  iconRight?: JSX.Element | null
  isLoading?: boolean | undefined
  disabled?: boolean | undefined
  allowDisabledClick?: boolean | undefined
}

export const buttonClassNames = () => ({
  [ButtonTypes.primary]:
    'bg-base-300 hover:bg-opacity-90 active:bg-opacity-70 disabled:bg-opacity-60',
  [ButtonTypes.error]:
    'text-white bg-error hover:bg-opacity-90 focus-visible:bg-opacity-70 disabled:bg-opacity-60',
  [ButtonTypes.success]:
    'text-white bg-success hover:bg-opacity-90 focus-visible:bg-opacity-70 disabled:bg-opacity-60',
  [ButtonTypes.ghost]:
    'bg-transparent hover:text-opacity-90 focus-visible:text-opacity-70 disabled:text-opacity-60',
  [ButtonTypes.outline]: 'bg-transparent border border-white-16',
})

export default ButtonTypes
