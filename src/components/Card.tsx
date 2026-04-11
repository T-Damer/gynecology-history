import { PropsWithChildren } from 'preact/compat'

interface CardProps extends PropsWithChildren {
  dashedOutline?: boolean
  onPress?: () => void
}

export default function ({ children, dashedOutline, onPress }: CardProps) {
  const outline = dashedOutline ? 'border-dashed' : 'border-solid'
  const minWidth = dashedOutline ? '' : 'min-w-36 sm:min-w-64'
  const justify = dashedOutline ? 'justify-center' : 'justify-start'
  const bgHover = dashedOutline ? 'opacity-100' : 'hover:bg-opacity-70'

  return (
    <div
      className={`flex-1 ${bgHover} ${minWidth} ${justify} min-h-40 shadow-md border-2 border-neutral-content ${outline} cursor-pointer rounded-box p-3 m-1 transition-all flex align-center pointer-events-auto`}
      onClick={onPress}
    >
      {children}
    </div>
  )
}
