import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './premium-design.css'
import App from './App.jsx'
import { LanguageProvider } from './LanguageContext.jsx'
import { ToastProvider } from './components/Toast.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>,
)
