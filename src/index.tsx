import 'index.css'
import 'react-toastify/dist/ReactToastify.css'
import App from 'App'
import { render } from 'preact'

async function cleanupLegacyServiceWorkers() {
  if (!('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  const appRegistrations = registrations.filter((registration) =>
    registration.scope.includes('/gynecology-history/')
  )

  if (appRegistrations.length === 0) return

  await Promise.all(
    appRegistrations.map((registration) => registration.unregister())
  )

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.includes('gynecology-history'))
        .map((cacheName) => caches.delete(cacheName))
    )
  }
}

void cleanupLegacyServiceWorkers()

render(<App />, document.getElementById('root') as Element)
