import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { hydratePlannerStorageFromServer, startPlannerAutoSync } from './entities/planner'
import './index.css'

declare global {
  interface Window {
    __MUSK_PLANNER_BOOTSTRAP_RESULT__?: unknown
  }
}

const bootstrap = async (): Promise<void> => {
  const bootstrapResult = await hydratePlannerStorageFromServer()

  if (typeof window !== 'undefined') {
    window.__MUSK_PLANNER_BOOTSTRAP_RESULT__ = bootstrapResult
  }

  startPlannerAutoSync()

  const rootElement = document.getElementById('root')
  if (!rootElement) {
    return
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
