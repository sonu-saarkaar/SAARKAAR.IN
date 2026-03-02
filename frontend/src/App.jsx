import React, { useState, useEffect, Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Scenes & Components
import LobbyScene from './scenes/LobbyScene'
import OfficeScene from './scenes/OfficeScene'
import UI from './components/UI'
import ConversationUI from './components/ConversationUI'
import { useExperienceStore } from './store/experienceStore'

// Pages
import FuturisticPortfolio from './pages/FuturisticPortfolio'
import ProjectDetail from './pages/ProjectDetail'
import AdminDashboard from './pages/AdminDashboard'
import SocialProfileDetail from './pages/SocialProfileDetail'

// ── Stable inner scene — never re-renders unless isInOffice changes ──
// Wrapped in memo so ConversationUI / UI re-renders don't bleed into Canvas
const SceneContent = memo(function SceneContent({ isInOffice }) {
  return (
    <>
      <color attach="background" args={['#101010']} />
      <fog attach="fog" args={['#101010', 10, 30]} />
      {!isInOffice ? <LobbyScene /> : <OfficeScene />}
    </>
  )
})

// ── Canvas wrapper — also memoised so it never re-mounts ──
const GameCanvas = memo(function GameCanvas({ isInOffice }) {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0
      }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      camera={{ position: [0, 1.6, 5], fov: 50 }}
    >
      <Suspense fallback={null}>
        <SceneContent isInOffice={isInOffice} />
      </Suspense>
    </Canvas>
  )
})

// ── Home3D — reads isInOffice only (fine since scene switches rarely) ──
function Home3D() {
  // Only isInOffice is subscribed here — changes infrequently
  const isInOffice = useExperienceStore((state) => state.isInOffice)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', backgroundColor: '#101010', overflow: 'hidden' }}>
      <GameCanvas isInOffice={isInOffice} />
      {/* UI and ConversationUI are DOM overlays — outside Canvas so they never affect WebGL */}
      <UI />
      <ConversationUI />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home3D />} />
        <Route path="/portfolio" element={<FuturisticPortfolio />} />
        <Route path="/portfolio/social/:platform" element={<SocialProfileDetail />} />
        <Route path="/portfolio/:id" element={<ProjectDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
