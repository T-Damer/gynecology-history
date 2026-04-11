import ButtonTypes, { ButtonProps, buttonClassNames } from 'types/Button'

export default function ({
  buttonType = ButtonTypes.primary,
  children,
  disabled,
  onClick,
  className,
  iconLeft,
  iconRight,
}: ButtonProps) {
  const extractedClassNames = buttonClassNames()[buttonType]

  return (
    <button
      className={`btn flex flex-row gap-x-2 *:transition-all ${extractedClassNames} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}
