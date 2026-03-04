import React, { useState, useEffect, Suspense, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Preload, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { usePerformanceStore } from './store/performanceStore'
import ScrollToTop from './components/ScrollToTop'

// Scenes & Components
import LobbyScene from './scenes/LobbyScene'
import OfficeScene from './scenes/OfficeScene'
import UI from './components/UI'
import ConversationUI from './components/ConversationUI'
import { useExperienceStore } from './store/experienceStore'

// Pages
import FuturisticPortfolio from './pages/FuturisticPortfolio'
import ProjectDetail from './pages/ProjectDetail'
import AdminApp from './pages/admin/AdminApp'
import SocialProfileDetail from './pages/SocialProfileDetail'

function SafeModeFallback({ reason = '3D mode is temporarily unavailable on this device.', onRetry }) {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#101010', color: '#fff', fontFamily: 'Inter, sans-serif', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '640px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#eebb44' }}>SAARKAAR 2D Safe Mode</h2>
        <p style={{ margin: '0 0 16px 0', color: 'rgba(255,255,255,0.8)' }}>{reason}</p>
        <p style={{ margin: '0 0 16px 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.92rem' }}>
          Your device or browser had trouble running the heavy 3D scene.
        </p>
        {onRetry && (
          <button onClick={onRetry} style={{ padding: '10px 20px', background: '#eebb44', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Retry 3D Mode
          </button>
        )}
      </div>
    </div>
  )
}

function Loader() {
  const { progress } = useProgress()
  const { gpuTier, isInitialized } = usePerformanceStore()

  return (
    <Html center>
      <div style={{ color: 'white', fontFamily: 'Inter, sans-serif', textAlign: 'center', width: '200px' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Loading {Math.round(progress)}%</div>
        <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#eebb44', borderRadius: '2px', transition: 'width 0.2s' }} />
        </div>
        {isInitialized && <div style={{ marginTop: '15px', fontSize: '0.8rem', color: '#aaa' }}>Optimized for {gpuTier} performance</div>}
      </div>
    </Html>
  )
}

function FPSMonitor() {
  const adjustForLowFPS = usePerformanceStore(state => state.adjustForLowFPS)
  const [frames, setFrames] = useState(0)
  const [lastTime, setLastTime] = useState(performance.now())

  useFrame(() => {
    const time = performance.now()
    setFrames(f => f + 1)
    if (time >= lastTime + 1000) {
      const fps = (frames * 1000) / (time - lastTime)
      if (fps < 20) {
        // If FPS drops below 20, downgrade
        adjustForLowFPS()
      }
      setFrames(0)
      setLastTime(time)
    }
  })
  return null
}

const SceneContent = memo(function SceneContent({ isInOffice }) {
  return (
    <>
      <color attach="background" args={['#101010']} />
      <fog attach="fog" args={['#101010', 10, 30]} />
      {!isInOffice ? <LobbyScene /> : <OfficeScene />}
      <FPSMonitor />
    </>
  )
})

const SceneFallback = memo(function SceneFallback() {
  return (
    <>
      <color attach="background" args={['#101010']} />
      <ambientLight intensity={0.45} />
      <Loader />
    </>
  )
})

const GameCanvas = memo(function GameCanvas({ isInOffice }) {
  const { settings, setSafeMode } = usePerformanceStore()
  const [retryKey, setRetryKey] = useState(0) // Used to re-mount canvas on context lost recovery

  return (
    <Canvas
      key={retryKey}
      shadows={settings.shadows}
      gl={{
        antialias: settings.antialiasing,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0
      }}
      dpr={settings.dpr}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      camera={{ position: [0, 1.6, 5], fov: 50 }}
      onCreated={({ gl }) => {
        gl.setClearColor('#101010', 1)

        // Memory optimization
        gl.info.autoReset = false

        // Context Loss Recovery
        const canvas = gl.domElement;

        // Remove old listener if remounting
        canvas._onContextLost = canvas._onContextLost || ((event) => {
          event.preventDefault();
          console.error("WebGL Context Lost!");
          setSafeMode(true); // temporary fallback
          setTimeout(() => {
            console.log("Attempting WebGL restore...");
            setRetryKey(k => k + 1)
            setSafeMode(false)
          }, 3000)
        });

        canvas.removeEventListener("webglcontextlost", canvas._onContextLost);
        canvas.addEventListener("webglcontextlost", canvas._onContextLost, false);
      }}
    >
      <Suspense fallback={<SceneFallback />}>
        <SceneContent isInOffice={isInOffice} />
        <Preload all />
      </Suspense>
    </Canvas>
  )
})

let cachedHasWebGL = null;

function Home3D() {
  const isInOffice = useExperienceStore((state) => state.isInOffice)
  const { isInitialized, initDevice, isSafeMode, setSafeMode } = usePerformanceStore()

  useEffect(() => {
    // Determine Safe Mode from local storage or unsupported contexts
    const forced = localStorage.getItem('saarkaar_safe_mode') === '1'
    if (forced) {
      setSafeMode(true)
    } else {
      if (cachedHasWebGL === null) {
        try {
          const canvas = document.createElement('canvas')
          const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'low-power' }) ||
            canvas.getContext('webgl', { antialias: false, powerPreference: 'low-power' });
          cachedHasWebGL = !!gl;
          if (gl) {
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) ext.loseContext();
          }
        } catch {
          cachedHasWebGL = false
        }
      }

      if (!cachedHasWebGL) {
        setSafeMode(true)
      } else {
        setSafeMode(false) // removes flag if it was false
        initDevice()
      }
    }
  }, [initDevice, setSafeMode])

  useEffect(() => {
    // Global cleanup on unmount
    return () => {
      THREE.Cache.clear()
    }
  }, [])

  if (isSafeMode) {
    return <SafeModeFallback reason="WebGL context could not be initialized or was lost." onRetry={() => {
      setSafeMode(false);
      initDevice();
    }} />
  }

  // Show nothing while detecting GPU tier
  if (!isInitialized) return <div style={{ background: '#101010', width: '100vw', height: '100vh' }} />

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#101010', overflow: 'hidden' }}>
      <GameCanvas isInOffice={isInOffice} />
      <UI />
      <ConversationUI />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop>
        <Routes>
          <Route path="/" element={<Home3D />} />
          <Route path="/portfolio" element={<FuturisticPortfolio />} />
          <Route path="/portfolio/social/:platform" element={<SocialProfileDetail />} />
          <Route path="/portfolio/:id" element={<ProjectDetail />} />
          <Route path="/admin" element={<AdminApp />} />
        </Routes>
      </ScrollToTop>
    </HashRouter>
  )
}
