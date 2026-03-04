import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './index.css'

console.log('Main.jsx loading...')

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

const WEBGL_RECOVERY_ONCE_KEY = 'saarkaar_webgl_recovery_once'

function isWebGLCreationError(value) {
  const text = typeof value === 'string' ? value : value?.toString?.() || ''
  return /error creating webgl context|webgl|context lost/i.test(text)
}

function recoverToSafeMode(reason) {
  if (!isWebGLCreationError(reason)) return

  try {
    localStorage.setItem('saarkaar_safe_mode', '1')
  } catch {}

  try {
    const alreadyRecovered = sessionStorage.getItem(WEBGL_RECOVERY_ONCE_KEY) === '1'
    if (alreadyRecovered) return
    sessionStorage.setItem(WEBGL_RECOVERY_ONCE_KEY, '1')
    window.location.reload()
  } catch {
    window.location.reload()
  }
}

window.addEventListener('error', (event) => {
  recoverToSafeMode(event?.error || event?.message)
})

window.addEventListener('unhandledrejection', (event) => {
  recoverToSafeMode(event?.reason)
})

try {
  if (localStorage.getItem('saarkaar_safe_mode') === '1') {
    sessionStorage.removeItem(WEBGL_RECOVERY_ONCE_KEY)
  }
} catch {}

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>'
} else {
  console.log('Root element found, creating root...')
  const root = ReactDOM.createRoot(rootElement)
  
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
  
  console.log('App rendered!')
}
