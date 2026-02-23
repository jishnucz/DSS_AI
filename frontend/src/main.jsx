import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './agriflyer-theme.css' // 🌾 AgriFlyer Clean Modern Theme
import App from './App.jsx'
import { LanguageProvider } from './LanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
