export default function () {
  const href = 'https://github.com/T-Damer/gynecology-history'

  return (
    <footer className="flex flex-1 h-full justify-center items-end w-full mt-2">
      <span className="block print:hidden">
        Made by{' '}
        <a href={href} target="_blank" rel="noreferrer">
          T-Damer
        </a>{' '}
        <b>Σ</b> {new Date().getFullYear()}
      </span>
      <span className="hidden print:block">
        <a href={href}>{href}</a>
      </span>
    </footer>
  )
}
