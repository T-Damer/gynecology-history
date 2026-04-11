import { ErrorBoundary } from 'react-error-boundary'
import { Route, Router, Switch } from 'wouter-preact'
import { ToastContainer } from 'react-toastify'
import { useHashLocation } from 'wouter-preact/use-hash-location'
import DetailsPage from 'screens/DetailsPage'
import ErrorFallback from 'components/ErrorFallback'
import Footer from 'components/Footer'
import Main from 'screens/Main'
import useTheme from 'hooks/useTheme'

declare global {
  interface Window {
    TelegramWebviewProxy: any
    TelegramWebviewProxyProto: any
    TelegramWebview: any
  }
}

export default function () {
  const theme = useTheme()

  if (
    window.TelegramWebviewProxy ||
    window.TelegramWebviewProxyProto ||
    window.TelegramWebview
  )
    return (
      <div className="flex flex-col container prose h-[100dvh] mx-auto justify-center font-bold px-4">
        <p>
          Пожалуйста используйте браузерную версию приложения, телеграм не
          позволяет сохранять файлы
        </p>
        <p>Для этого нажмите три точки сверху справа и "Открыть в" браузере</p>
        <p>
          Истории сохраненные в телеграме не переносятся в браузер и ими нельзя
          поделиться
        </p>
      </div>
    )

  return (
    <div className="flex flex-col container prose print:w-full min-h-[100dvh] mx-auto my-5 px-5 md:p-10">
      <Router hook={useHashLocation}>
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Switch>
            <Route
              path="/patient/:id"
              component={({ params }: { params: { id: string } }) => (
                <DetailsPage {...params} />
              )}
            />
            <Route component={Main} />
          </Switch>
          <Footer />
        </ErrorBoundary>
      </Router>
      <ToastContainer theme={theme} />
    </div>
  )
}
