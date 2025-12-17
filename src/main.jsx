import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import { AdminProvider } from './contexts/AdminContext.jsx'

function showFatalOverlay(title, error) {
  try {
    const existing = document.getElementById('__fatal_error_overlay__')
    const el = existing || document.createElement('div')
    el.id = '__fatal_error_overlay__'
    el.style.position = 'fixed'
    el.style.inset = '0'
    el.style.zIndex = '2147483647'
    el.style.background = 'rgba(0,0,0,0.85)'
    el.style.color = 'white'
    el.style.padding = '16px'
    el.style.overflow = 'auto'
    el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace'

    const message = error?.message ? String(error.message) : String(error)
    const stack = error?.stack ? String(error.stack) : ''
    el.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <h2 style="margin:0; font-size:16px;">${title}</h2>
          <button id="__fatal_reload__" style="padding:8px 10px; border-radius:8px; border:0; cursor:pointer; font-weight:700;">Reload</button>
        </div>
        <p style="margin:10px 0 0; color:#ffd54f;">Скопируй этот текст и пришли мне — я сразу скажу точную причину.</p>
        <pre style="white-space:pre-wrap; margin:12px 0 0; background: rgba(255,255,255,0.08); padding:12px; border-radius:8px;">${escapeHtml(
          `${message}${stack ? `\n\n${stack}` : ''}`
        )}</pre>
      </div>
    `
    if (!existing) document.body.appendChild(el)
    const btn = document.getElementById('__fatal_reload__')
    if (btn) btn.onclick = () => window.location.reload()
  } catch {
    // ignore
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// Global safety net (shows message even if React tree unmounts)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const err = event?.error || event?.message || 'Unknown error'
    showFatalOverlay('Uncaught error', err)
  })
  window.addEventListener('unhandledrejection', (event) => {
    const err = event?.reason || 'Unhandled promise rejection'
    showFatalOverlay('Unhandled promise rejection', err)
  })
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    // keep overlay as well (helps if boundary itself fails later)
    showFatalOverlay('React render error', error)
  }
  render() {
    if (this.state.error) {
      const msg = this.state.error?.message ? String(this.state.error.message) : String(this.state.error)
      return (
        <div style={{ padding: '2rem', color: '#111', background: 'white', borderRadius: '12px', margin: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Ошибка в приложении</h2>
          <p style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{msg}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 1rem' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AdminProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </BrowserRouter>
      </AdminProvider>
    </LanguageProvider>
  </React.StrictMode>,
)

