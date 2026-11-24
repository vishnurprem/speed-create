import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import 'lenis/dist/lenis.css'
import './index.css'
import App, { type Variant } from './App'

const variant = (document.body.dataset.variant as Variant) || 'a'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App variant={variant} />
  </StrictMode>,
)
