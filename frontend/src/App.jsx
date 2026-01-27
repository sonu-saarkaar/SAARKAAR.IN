import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import LobbyScene from './scenes/LobbyScene'
import OfficeScene from './scenes/OfficeScene'
import UI from './components/UI'
import { useExperienceStore } from './store/experienceStore'

function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [canvasError, setCanvasError] = useState(null)
  const isInOffice = useExperienceStore((state) => state.isInOffice)

  useEffect(() => {
    console.log('App component mounted')
    setIsLoaded(true)
  }, [])

  if (canvasError) {
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
        <h1>Canvas Error</h1>
        <p style={{ marginTop: '20px', color: '#ff6b6b' }}>
          {canvasError.toString()}
        </p>
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
          Reload
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      margin: 0, 
      padding: 0, 
      backgroundColor: '#1a1a1a',
      overflow: 'hidden'
    }}>
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        dpr={[1, 2]}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block'
        }}
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        onCreated={(state) => {
          console.log('✅ Canvas created successfully!', state)
        }}
        onError={(error) => {
          console.error('❌ Canvas error:', error)
          setCanvasError(error)
        }}
      >
        <Suspense 
          fallback={null}
        >
          <color attach="background" args={['#f8f9fa']} />
          <fog attach="fog" args={['#f8f9fa', 35, 60]} />
          <Environment preset="city" />
          
          {!isInOffice ? (
            <LobbyScene />
          ) : (
            <OfficeScene />
          )}
        </Suspense>
      </Canvas>
      <UI />
    </div>
  )
}

export default App
