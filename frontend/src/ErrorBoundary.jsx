import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, recoveryKey: 0 }
  }

  isWebGLError = (error) => {
    const errorText = error?.toString?.() || ''
    return /webgl|context/i.test(errorText)
  }

  openSafeMode = () => {
    try {
      localStorage.setItem('saarkaar_safe_mode', '1')
    } catch {}

    this.setState((prev) => ({
      hasError: false,
      error: null,
      recoveryKey: prev.recoveryKey + 1
    }))
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)

    if (this.isWebGLError(error)) {
      this.openSafeMode()
    }
  }

  render() {
    if (this.state.hasError) {
      const errorText = this.state.error?.toString?.() || ''
      const isWebGLError = /webgl|context/i.test(errorText)

      return (
        <div style={{ 
          width: '100vw', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '20px'
        }}>
          <h1>Something went wrong</h1>
          <p style={{ marginTop: '20px', color: '#ff6b6b' }}>
            {errorText}
          </p>
          {isWebGLError && (
            <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.75)', maxWidth: '680px', textAlign: 'center' }}>
              Your browser/GPU could not create a WebGL context. You can continue in Safe Mode.
            </p>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          {isWebGLError && (
            <button
              onClick={() => {
                this.openSafeMode()
              }}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                backgroundColor: '#eebb44',
                color: '#101010',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Open Safe Mode
            </button>
          )}
        </div>
      )
    }

    return <React.Fragment key={this.state.recoveryKey}>{this.props.children}</React.Fragment>
  }
}

export default ErrorBoundary
