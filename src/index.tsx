import 'index.css'
import 'react-toastify/dist/ReactToastify.css'
import { registerSW } from 'virtual:pwa-register'
import { render } from 'preact'
import App from 'App'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Доступно обновление 🎉\nПерезагрузить страницу?')) {
      void updateSW(true)
    }
  },
})

render(<App />, document.getElementById('root') as Element)
