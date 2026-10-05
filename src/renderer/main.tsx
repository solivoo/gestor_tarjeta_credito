import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from 'glubox'
import 'glubox/style.css'
import 'glubox/themes/commerce.css'
import { App } from './app/App'
import './styles/global.css'

const root = document.documentElement
root.setAttribute('data-theme', 'commerce')
root.setAttribute('data-mode', 'light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider position="top-right">
      <App />
    </ToastProvider>
  </StrictMode>,
)
