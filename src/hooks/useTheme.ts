import { useEffect, useState } from 'preact/hooks'

const initialMatch = window.matchMedia('(prefers-color-scheme: dark)')

export default function () {
  const [isDark, setIsDark] = useState(initialMatch.matches ? 'dark' : 'light')

  useEffect(() => {
    initialMatch.addEventListener('change', (event) => {
      setIsDark(event.matches ? 'dark' : 'light')
    })

    return () => {
      initialMatch.removeEventListener('change', (event) => {
        setIsDark(event.matches ? 'dark' : 'light')
      })
    }
  }, [])

  return isDark
}
