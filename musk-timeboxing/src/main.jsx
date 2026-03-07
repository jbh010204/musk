import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { hydratePlannerStorageFromServer } from './entities/planner'
import './index.css'

const bootstrap = async () => {
  const bootstrapResult = await hydratePlannerStorageFromServer()

  if (typeof window !== 'undefined') {
    window.__MUSK_PLANNER_BOOTSTRAP_RESULT__ = bootstrapResult
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
