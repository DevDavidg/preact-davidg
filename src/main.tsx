import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './scene/suppressClockWarning'
import './styles/tokens.css'
import './styles/base.css'
import './styles/chrome.css'
import './styles/sections.css'
import './styles/about.css'
import './styles/assemble.css'
import './styles/world-copy.css'
import App from './App.tsx'
import { CopyProvider } from './i18n/CopyProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CopyProvider>
      <App />
    </CopyProvider>
  </StrictMode>,
)
