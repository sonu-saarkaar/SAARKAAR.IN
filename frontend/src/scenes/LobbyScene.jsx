/*
  LobbyScene.jsx
  PREMIUM CORPORATE LOBBY & CEO SUITE
  - Focused Layout: Reception, Waiting Area, Glass-Walled CEO Office.
  - Features: Realistic Collision, Appointment Gate, Meeting Workflow.
*/

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Environment, MeshReflectorMaterial, Text, Sparkles, Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Character from '../components/Character'
import ReceptionDesk from '../components/ReceptionDesk'
import Boss from '../components/Boss'
import SaarkaarLogo from '../components/SaarkaarLogo'
import Interactable from '../components/Interactable'
import { useAnimationStore } from '../store/animationStore'
import { useExperienceStore } from '../store/experienceStore'
import { usePerformanceStore } from '../store/performanceStore'

// --- 1. COLLISION BOUNDARIES (Simple AABB) ---
// [x, z, width, depth]
let WALLS = [
  // Outer Walls
  [5, -20.5, 50, 1], // North
  [5, 20.5, 50, 1],  // South
  [-20.5, 0, 1, 42], // West (Lobby Back)
  [30.5, 0, 1, 42],  // East (CEO Office Back)

  // CEO Office Glass Partition — gap at z=0 for door
  [9.5, -12, 1, 16],  // Glass Wall Left
  [9.5, 12, 1, 16],   // Glass Wall Right

  // Furniture Colliders
  [0, -10, 5, 3],    // Reception Desk
  [0, -12, 14, 1],   // Reception Back Wall
  [-8, 0, 5, 5],     // Sofa Area
  // CEO Desk: world x = CEO[20] + desk[5] + mesh[0] = 25, width=2.0
  // Keep collider tight so visitor chairs at x=23.5 are reachable
  [25.5, 0, 1.4, 5.2],  // Grand CEO Desk (tight, only blocks the desk itself)
]

// Default door wall (when closed), wait to add/remove this dynamically
const DOOR_COLLIDER = [9.5, 0, 1, 4]; // at x=10, z=0

// --- MATERIALS HOOK ---
const useMaterials = (settings) => {
  return useMemo(() => ({
    glass: new THREE.MeshPhysicalMaterial({
      color: '#aaccff',
      metalness: 0.1,
      roughness: 0,
      transmission: 0.95,
      thickness: 0.5,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#2a1d15', roughness: 0.4 }),
    doorMaterial: new THREE.MeshStandardMaterial({ color: '#181008', roughness: 0.6 }),
    wallMatte: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 }),
    floorReflect: {
      blur: [300, 100], resolution: settings.highResTextures ? 512 : 256, mixBlur: 1, mixStrength: 1.5,
      roughness: 0.4, depthScale: 1, minDepthThreshold: 0.4, maxDepthThreshold: 1.4,
      color: "#101010", metalness: 0.5, mirror: 0.5
    }
  }), [settings.highResTextures])
}

// --- FURNITURE ---
const SofaGroup = ({ position }) => (
  <group position={position}>
    {/* Sofa 1 */}
    <mesh position={[0, 0.4, -2]} castShadow><boxGeometry args={[3, 0.8, 1]} /><meshStandardMaterial color="#333" /></mesh>
    {/* Sofa 2 */}
    <mesh position={[-2, 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><boxGeometry args={[3, 0.8, 1]} /><meshStandardMaterial color="#333" /></mesh>
    {/* Coffee Table */}
    <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.8, 0.8, 0.6, 32]} /><meshStandardMaterial color="#000" /></mesh>
  </group>
)

// --- MAIN SCENE ---
export default function LobbyScene() {
  const { settings } = usePerformanceStore()
  const mat = useMaterials(settings)
  const visitorSeatPositions = useMemo(() => ([
    [23.5, 0.02, 1],
    [23.5, 0.02, -1],
  ]), [])
  const {
    setUserPosition,
    setConversationPartner,
    inCEOOffice,
    setInCEOOffice,
    ceoDoorOpen,
    setCeoDoorOpen,
    bossWelcomed,
    setBossWelcomed,
    setSitting,
    isSitting,
    setCameraFocus
  } = useExperienceStore()

  // ⚠️ userPosition NOT subscribed via React — prevents 10fps re-renders of entire scene
  const userPositionRef = useRef([0, 0, 0])
  useEffect(() => {
    // Zustand v5: subscribe(callback) — reads full state each call, update ref only
    const unsub = useExperienceStore.subscribe(
      (state) => { userPositionRef.current = state.userPosition }
    )
    return unsub
  }, [])

  const [bossMessage, setBossMessage] = useState("")
  const [isKnocking, setIsKnocking] = useState(false)
  const [nearestSeatIndex, setNearestSeatIndex] = useState(0)
  const doorGroup = useRef()

  // Manage Dynamic Collision for the Door
  useEffect(() => {
    if (ceoDoorOpen) {
      WALLS = WALLS.filter(w => w !== DOOR_COLLIDER);
    } else {
      if (!WALLS.includes(DOOR_COLLIDER)) WALLS.push(DOOR_COLLIDER);
    }
  }, [ceoDoorOpen])

  // Office Entry & Exit + Chair proximity — polled every 150ms from ref (no re-renders)
  useEffect(() => {
    const check = () => {
      const userPosition = userPositionRef.current
      const isInside = userPosition[0] > 10.5

      if (isInside && !useExperienceStore.getState().inCEOOffice) {
        setInCEOOffice(true)
        if (!useExperienceStore.getState().bossWelcomed) {
          setBossWelcomed(true)
          useAnimationStore.getState().setBossState('boss_welcoming')
          setBossMessage("Welcome, please take a seat.")
          setCameraFocus('boss_zoom')
          setTimeout(() => {
            setBossMessage("")
            useAnimationStore.getState().setBossState('sit')
            setCameraFocus('lobby')
          }, 4000)
        }
      } else if (userPosition[0] < 9.5 && useExperienceStore.getState().inCEOOffice) {
        setInCEOOffice(false)
        setBossMessage("")
        setConversationPartner(null)
        if (useExperienceStore.getState().isSitting) setSitting(false)
        setNearestSeatIndex(0)
      }
    }
    const iv = setInterval(check, 150)
    return () => clearInterval(iv)
  }, []) // empty deps — all state read from store.getState() or refs

  // Door Animation Loop
  useFrame((state, delta) => {
    if (doorGroup.current) {
      // Rotate along Y. Door hinge is offset naturally via group rotation
      const targetRotation = ceoDoorOpen ? -Math.PI / 2 : 0;
      doorGroup.current.rotation.y = THREE.MathUtils.lerp(doorGroup.current.rotation.y, targetRotation, delta * 3);
    }
  })

  const handleKnock = () => {
    setIsKnocking(true)
    setTimeout(() => {
      setIsKnocking(false)
      setCeoDoorOpen(true)
    }, 1500)
  }

  const handleEnter = () => {
    setCeoDoorOpen(true)
  }

  const handleSit = (seatIndex = 0) => {
    const [seatX, seatY, seatZ] = visitorSeatPositions[seatIndex] || visitorSeatPositions[0]
    setNearestSeatIndex(seatIndex)
    setSitting(true)
    setUserPosition([seatX, seatY, seatZ])
    setConversationPartner(null)  // Don't open chat yet — use Talk button
    setCameraFocus('interview')
  }

  return (
    <>
      {/* 1. CINEMATIC LIGHTING */}
      <ambientLight intensity={0.4} color="#ccccff" />
      <spotLight position={[0, 10, 0]} intensity={1} castShadow={settings.shadows} />
      <pointLight position={[15, 5, 0]} intensity={2} color="#ffaa00" distance={10} /> {/* Warm Office Light */}
      {settings.particlesEnabled && <Sparkles count={30} scale={30} size={2} color="#fff" opacity={0.2} />}
      <Environment preset="city" blur={0.8} visibility={false} />

      {/* ARCHITECTURE */}
      <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0, 0]} receiveShadow={settings.shadows}>
          <planeGeometry args={[50, 42]} />
          {settings.reflections ? (
            <MeshReflectorMaterial {...mat.floorReflect} />
          ) : (
            <meshStandardMaterial color="#101010" roughness={0.4} metalness={0.5} />
          )}
        </mesh>

        {/* Outer Walls */}
        <mesh position={[5, 4, -21]}><boxGeometry args={[50, 8, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
        <mesh position={[5, 4, 21]}><boxGeometry args={[50, 8, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
        <mesh position={[-20, 4, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[42, 8, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
        <mesh position={[30, 4, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[42, 8, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>

        {/* --- CEO OFFICE GATE --- */}
        <group position={[10, 0, 0]}>
          {/* Gate Pillars */}
          <mesh position={[0, 2.5, -2.5]}><boxGeometry args={[0.5, 5, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
          <mesh position={[0, 2.5, 2.5]}><boxGeometry args={[0.5, 5, 1]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
          {/* Gate Top Header */}
          <mesh position={[0, 5.25, 0]}><boxGeometry args={[0.5, 0.5, 6]} /><primitive object={mat.wallMatte} attach="material" /></mesh>

          {/* Animated Door Object */}
          <group ref={doorGroup} position={[0, 0, -2]}> {/* Hinge position */}
            <mesh position={[0, 2.5, 2]} castShadow>
              <boxGeometry args={[0.2, 5, 4]} />
              <primitive object={mat.doorMaterial} attach="material" />
              {/* Door Handle */}
              <mesh position={[0.15, 0, 1.5]}><boxGeometry args={[0.1, 0.4, 0.05]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
            </mesh>
          </group>

          {/* Show entry button only if NOT inside office and door is closed */}
          {!inCEOOffice && !ceoDoorOpen && (
            <>
              {isKnocking ? (
                <Interactable position={[0, 1.5, 0.8]} actionName="*Knocking...*" disabled={true} />
              ) : (
                <>
                  <Interactable position={[0, 1.5, -0.8]} actionName="KNOCK" onInteract={handleKnock} />
                  <Interactable position={[0, 1.5, 1.5]} actionName="ENTER" onInteract={handleEnter} />
                </>
              )}
            </>
          )}
        </group>

        {/* --- CEO OFFICE INTERIOR --- */}
        <group position={[20, 0, 0]}>
          {/* 1. Floor: Glossy Dark Marble */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[20, 42]} />
            {settings.reflections ? (
              <MeshReflectorMaterial
                blur={settings.highResTextures ? [400, 100] : [200, 50]} resolution={settings.highResTextures ? 1024 : 256} mixBlur={1} mixStrength={2}
                roughness={0.1} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4}
                color="#050505" metalness={0.8} mirror={0.9}
              />
            ) : (
              <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} />
            )}
          </mesh>

          {/* Grand Glass Partition (West) */}
          <group position={[-10, 2.5, 0]}>
            <mesh position={[0, 0, -11.5]}><boxGeometry args={[0.2, 5, 18]} /><primitive object={mat.glass} attach="material" /></mesh>
            <mesh position={[0, 0, 11.5]}><boxGeometry args={[0.2, 5, 18]} /><primitive object={mat.glass} attach="material" /></mesh>
          </group>

          {/* 3. Ceiling & Lighting */}
          {/* False Ceiling Center */}
          <mesh position={[0, 7.8, 0]} receiveShadow castShadow>
            <boxGeometry args={[16, 0.4, 30]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
          </mesh>
          <pointLight position={[0, 7.5, 0]} intensity={1.5} color="#ffddaa" distance={20} decay={2} />
          <ambientLight intensity={0.2} color="#ffffff" />
          <spotLight position={[5, 7, 0]} angle={0.6} penumbra={0.5} intensity={2} color="#ffebc2" castShadow />

          {/* 2. Back Wall (East) - Matte dark charcoal with vertical panels */}
          <group position={[9.9, 4, 0]}>
            {/* Base Wall */}
            <mesh rotation={[0, -Math.PI / 2, 0]} receiveShadow>
              <planeGeometry args={[42, 8]} />
              <meshStandardMaterial color="#111111" roughness={0.9} />
            </mesh>
            {/* Vertical Wood Panels */}
            {Array.from({ length: 22 }).map((_, i) => (
              <mesh key={i} position={[-0.1, 0, -19 + i * 1.8]} receiveShadow castShadow>
                <boxGeometry args={[0.2, 8, 0.5]} />
                <meshStandardMaterial color="#1a120e" roughness={0.7} />
              </mesh>
            ))}
            {/* Illuminated SAARKAAR Logo */}
            <Float floatIntensity={0.2} speed={2}>
              <Text position={[-0.5, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={1.2} color="#d4af37" outlineWidth={0.02} outlineColor="#000" letterSpacing={0.1}>
                S A A R K A A R
                <meshBasicMaterial color="#ffcc00" toneMapped={false} />
              </Text>
            </Float>
            {/* Achievement Frame Wall Section */}
            <group position={[-0.2, 0, -6]}>
              <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[0.1, 1.5, 1]} /><meshStandardMaterial color="#222" metalness={0.8} /></mesh>
              <mesh position={[0.06, 1, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.8, 1.3]} /><meshStandardMaterial color="#eee" roughness={0.2} /></mesh>

              <mesh position={[0, -0.5, -1.2]} castShadow><boxGeometry args={[0.1, 1, 0.8]} /><meshStandardMaterial color="#d4af37" metalness={0.9} /></mesh>
              <mesh position={[0, 0.8, -1.8]} castShadow><boxGeometry args={[0.1, 1.2, 0.9]} /><meshStandardMaterial color="#c0c0c0" metalness={0.9} /></mesh>
            </group>
            {/* Digital Name Plate */}
            <group position={[-0.2, 2.5, 5]}>
              <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.1, 0.8, 2.8]} /><meshStandardMaterial color="#111" metalness={0.8} /></mesh>
              <mesh position={[0.06, 0, 0]}><planeGeometry args={[2.7, 0.7]} rotation={[0, -Math.PI / 2, 0]} /><meshBasicMaterial color="#0a0a0a" /></mesh>
              <Text position={[0.07, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.2} color="#fff">
                Sonu Sarkar
              </Text>
              <Text position={[0.07, -0.15, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.12} color="#aaa">
                Founder & AI Architect
              </Text>
            </group>
          </group>

          {/* 2. Side Wall (North) - Glass Wall with City Skyline */}
          <group position={[0, 4, -20.5]}>
            <mesh>
              <boxGeometry args={[20, 8, 0.2]} />
              <meshPhysicalMaterial color="#001133" transmission={0.9} opacity={1} transparent roughness={0.1} metalness={0.8} />
            </mesh>
            {/* Fake City Backdrop just outside */}
            <mesh position={[0, -2, -10]}>
              <planeGeometry args={[80, 40]} />
              <meshBasicMaterial color="#000" />
            </mesh>
            {/* Minimal Animated City Lights (Sparkles) */}
            {settings.particlesEnabled && (
              <>
                <Sparkles position={[0, -2, -8]} count={100} scale={[60, 20, 10]} size={6} color="#aaccff" speed={0.2} opacity={0.5} noise={0} />
                <Sparkles position={[0, -2, -5]} count={80} scale={[60, 20, 5]} size={4} color="#ffd8a8" speed={0.1} opacity={0.4} noise={0} />
              </>
            )}
          </group>

          {/* 8. Technology Wall (South) */}
          <group position={[0, 4, 19.9]} rotation={[0, Math.PI, 0]}>
            <mesh receiveShadow>
              <planeGeometry args={[20, 8]} />
              <meshStandardMaterial color="#0a0a0c" />
            </mesh>
            {/* Digital Smart Screen Panel */}
            <mesh position={[0, 0, 0.1]} castShadow>
              <boxGeometry args={[8, 4.5, 0.1]} />
              <meshStandardMaterial color="#222" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.16]}>
              <planeGeometry args={[7.8, 4.3]} />
              <meshBasicMaterial color="#0a192f" toneMapped={false} />
            </mesh>
            {/* Fake UI Elements on Screen */}
            <group position={[0, 0, 0.17]}>
              <mesh position={[-2, 1, 0]}><planeGeometry args={[3, 1.5]} /><meshBasicMaterial color="#112240" toneMapped={false} /></mesh>
              <mesh position={[2, 1, 0]}><planeGeometry args={[3, 1.5]} /><meshBasicMaterial color="#112240" toneMapped={false} /></mesh>
              <mesh position={[0, -1, 0]}><planeGeometry args={[7, 2]} /><meshBasicMaterial color="#112240" toneMapped={false} /></mesh>
              {settings.particlesEnabled && <Sparkles position={[0, -1, 0]} count={20} scale={[6, 1.5, 0]} size={2} color="#64ffda" speed={1} />}
            </group>
          </group>

          {/* 9. Bookshelf Section (South-East Corner) */}
          <group position={[8, 0, 15]} rotation={[0, -Math.PI / 2, 0]}>
            <mesh position={[0, 4, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 8, 1]} />
              <meshStandardMaterial color="#2a1a10" roughness={0.6} />
            </mesh>
            {[1.5, 3.5, 5.5].map(y => (
              <mesh key={`shelf-${y}`} position={[0, y, 0.5]} castShadow receiveShadow>
                <boxGeometry args={[7.6, 0.1, 0.8]} />
                <meshStandardMaterial color="#3a2a20" />
              </mesh>
            ))}
            <mesh position={[-2, 1.8, 0.5]}><boxGeometry args={[0.8, 0.5, 0.6]} /><meshStandardMaterial color="#555" /></mesh>
            <mesh position={[2, 3.9, 0.5]}><sphereGeometry args={[0.3]} /><meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} /></mesh>
            <pointLight position={[0, 6, 1]} intensity={0.5} color="#ffaa55" distance={5} />
          </group>

          {/* 4. Boss Desk area */}
          <group position={[5, 0, 0]}>
            {/* Soft Carpet under desk */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[6, 8]} />
              <meshStandardMaterial color="#080808" roughness={0.9} />
            </mesh>
            {/* Premium Wooden Desk (Width 2.4, Thick top) */}
            <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.0, 0.08, 4.8]} />
              <meshStandardMaterial color="#211409" roughness={0.4} />
            </mesh>
            {/* Glass top reflection */}
            <mesh position={[0, 0.765, 0]} receiveShadow={settings.shadows}>
              <boxGeometry args={[1.9, 0.015, 4.7]} />
              {settings.reflections ? (
                <MeshReflectorMaterial mirror={0.4} color="#222" roughness={0.1} resolution={settings.highResTextures ? 256 : 128} />
              ) : (
                <meshStandardMaterial color="#222" roughness={0.1} />
              )}
            </mesh>
            /* Desk Legs (Solid Panel Style) */
            <mesh position={[-0.9, 0.36, 0]} castShadow><boxGeometry args={[0.1, 0.72, 4.6]} /><meshStandardMaterial color="#110a05" roughness={0.5} /></mesh>
            <mesh position={[0.9, 0.36, 0]} castShadow><boxGeometry args={[0.1, 0.72, 4.6]} /><meshStandardMaterial color="#110a05" roughness={0.5} /></mesh>
            <mesh position={[0, 0.36, 1.5]} castShadow><boxGeometry args={[1.8, 0.72, 0.08]} /><meshStandardMaterial color="#110a05" roughness={0.5} /></mesh>

            {/* LED Under-glow strip */}
            <mesh position={[-0.95, 0.68, 0]}>
              <boxGeometry args={[0.05, 0.05, 4.8]} />
              <meshBasicMaterial color="#ffaa00" toneMapped={false} />
            </mesh>
            <pointLight position={[-1, 0.5, 0]} intensity={0.8} color="#ffaa00" distance={3} />

            {/* 5. On Desk Items */}
            <group position={[0, 0.78, 0]}>
              {/* Dual Ultra Wide Monitors */}
              <group position={[0.6, 0.3, -0.8]} rotation={[0, -0.2, 0]}>
                <mesh castShadow><boxGeometry args={[0.05, 0.45, 1.2]} /><meshStandardMaterial color="#111" /></mesh>
                <mesh position={[-0.03, 0, 0]}><planeGeometry args={[1.15, 0.4]} rotation={[0, -Math.PI / 2, 0]} /><meshBasicMaterial color="#0a192f" toneMapped={false} /></mesh>
              </group>
              <group position={[0.6, 0.3, 0.8]} rotation={[0, 0.2, 0]}>
                <mesh castShadow><boxGeometry args={[0.05, 0.45, 1.2]} /><meshStandardMaterial color="#111" /></mesh>
                <mesh position={[-0.03, 0, 0]}><planeGeometry args={[1.15, 0.4]} rotation={[0, -Math.PI / 2, 0]} /><meshBasicMaterial color="#0a192f" toneMapped={false} /></mesh>
              </group>
              {/* MacBook / Laptop */}
              <mesh position={[0.2, 0.01, 0]} castShadow><boxGeometry args={[0.4, 0.02, 0.6]} /><meshStandardMaterial color="#ccc" metalness={0.8} /></mesh>
              <mesh position={[0.4, 0.15, 0]} tilt={0.3} castShadow><boxGeometry args={[0.02, 0.3, 0.6]} rotation={[0, 0, 0.3]} /><meshStandardMaterial color="#ccc" metalness={0.8} /></mesh>
              {/* Keyboard & Mouse */}
              <mesh position={[-0.2, 0.01, 0]} castShadow><boxGeometry args={[0.3, 0.01, 0.8]} /><meshStandardMaterial color="#222" /></mesh>
              <mesh position={[-0.2, 0.01, -0.6]} castShadow><boxGeometry args={[0.12, 0.02, 0.08]} /><meshStandardMaterial color="#222" /></mesh>
              {/* Coffee Mug */}
              <mesh position={[-0.3, 0.08, 1.2]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.12]} /><meshStandardMaterial color="#111" roughness={0.8} /></mesh>
              {/* Minimal Desk Lamp */}
              <mesh position={[0.5, 0.3, 1.8]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.05]} /><meshStandardMaterial color="#111" /></mesh>
              <mesh position={[0.3, 0.3, 1.8]} castShadow><boxGeometry args={[0.4, 0.03, 0.03]} rotation={[0, 0, -0.4]} /><meshStandardMaterial color="#111" /></mesh>
              <pointLight position={[0.1, 0.2, 1.8]} intensity={0.5} color="#fff" distance={2} />
              {/* Smart Tablet */}
              <mesh position={[-0.3, 0.01, 0.8]} rotation={[0, 0.2, 0]} castShadow><boxGeometry args={[0.3, 0.01, 0.22]} /><meshStandardMaterial color="#333" /></mesh>
            </group>

            {/* Direct Visitor Chairs (For handleSit interaction near desk) */}
            <group position={[-1.5, 0, -1]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.6, 0.1, 0.5]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
              <mesh position={[0, 0.8, -0.25]} castShadow><boxGeometry args={[0.6, 0.6, 0.1]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
              <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.45]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
            </group>
            <group position={[-1.5, 0, 1]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.6, 0.1, 0.5]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
              <mesh position={[0, 0.8, -0.25]} castShadow><boxGeometry args={[0.6, 0.6, 0.1]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
              <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.45]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
            </group>

            {/* Boss seated with built-in chair — floor aligned */}
            <Boss position={[1.4, 0.18, 0]} rotation={[0, -Math.PI / 2, 0]} />

            {/* INTERACTION - Only show if INSIDE office */}
            {inCEOOffice && (
              <>
                {bossMessage && (
                  <Float speed={2} floatIntensity={0.2} position={[1.65, 3.8, 0]}>
                    <Text fontSize={0.35} color="#d4af37" textAlign="center" anchorY="bottom" outlineWidth={0.015} outlineColor="#000" maxWidth={4}>
                      {bossMessage}
                    </Text>
                  </Float>
                )}

                {!isSitting ? (
                  <>
                    {visitorSeatPositions.map((seat, index) => (
                      <Interactable
                        key={`seat-${index}`}
                        position={[seat[0] - 0.1, 0.55, seat[2]]}
                        labelOffset={[0, 0.58, 0]}
                        triggerRadius={2.35}
                        actionName="💺 Seat on Chair"
                        onInteract={() => handleSit(index)}
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {/* Stand up — from active visitor chair */}
                    <Interactable
                      position={[
                        visitorSeatPositions[nearestSeatIndex][0],
                        0.55,
                        visitorSeatPositions[nearestSeatIndex][2]
                      ]}
                      labelOffset={[0, 0.62, 0]}
                      triggerRadius={2.6}
                      actionName="⬆ Stand from Chair"
                      onInteract={() => {
                        setSitting(false);
                        setUserPosition([22, 0, visitorSeatPositions[nearestSeatIndex][2] > 0 ? 2 : -2]);
                        setCameraFocus('lobby');
                        setConversationPartner(null);
                      }}
                    />
                    {/* Talk with Boss — world pos near boss desk x=25+1=26 */}
                    <Interactable
                      position={[24.5, 2.8, 0]}
                      triggerRadius={6.0}
                      actionName="💬 Talk with Boss"
                      onInteract={() => {
                        setConversationPartner('boss');
                        useAnimationStore.getState().setBossState('talking');
                      }}
                    />
                  </>
                )}
              </>
            )}
          </group>

          {/* 7. Meeting Area (Front-Left section of Cabin) */}
          <group position={[-2, 0, -8]}>
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[3, 32]} />
              <meshStandardMaterial color="#15171a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
              <meshStandardMaterial color="#2c1a0c" roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.4, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.5, 0.8, 16]} />
              <meshStandardMaterial color="#111" metalness={0.8} />
            </mesh>
            <mesh position={[0.3, 0.85, 0.2]} castShadow><boxGeometry args={[0.4, 0.02, 0.6]} rotation={[0, 0.2, 0]} /><meshStandardMaterial color="#fff" /></mesh>
            <mesh position={[-0.2, 0.9, -0.2]}><cylinderGeometry args={[0.05, 0.05, 0.15]} /><meshPhysicalMaterial color="#aaccff" transmission={0.9} transparent opacity={0.6} /></mesh>
            {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle, i) => (
              <group key={i} position={[Math.sin(angle) * 1.8, 0, Math.cos(angle) * 1.8]} rotation={[0, angle + Math.PI, 0]}>
                <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.6, 0.1, 0.5]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
                <mesh position={[0, 0.8, -0.25]} castShadow><boxGeometry args={[0.6, 0.6, 0.1]} /><meshStandardMaterial color="#111" roughness={0.3} /></mesh>
                <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.45]} /><meshStandardMaterial color="#888" metalness={0.9} /></mesh>
              </group>
            ))}
          </group>

          {/* 11. Decoration - Indoor Plant */}
          <group position={[8, 0, -18]}>
            <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.3, 0.2, 0.8]} /><meshStandardMaterial color="#111" /></mesh>
            <mesh position={[0, 1.2, 0]} castShadow><sphereGeometry args={[0.6, 16, 16]} /><meshStandardMaterial color="#1a4d2e" roughness={0.8} /></mesh>
          </group>

        </group>

        {/* 1. RECEPTION ZONE */}
        <group position={[0, 0, -10]}>
          <mesh position={[0, 4, -2.0]} receiveShadow><boxGeometry args={[14, 8, 0.5]} /><primitive object={mat.wallMatte} attach="material" /></mesh>
          <SaarkaarLogo position={[0, 4, -1.75]} size={2} style="wall" />
          <ReceptionDesk position={[0, 0, 0]} />
          {/* Talk trigger is now embedded inside Assistant.jsx (proximity-based) */}
        </group>

        {/* 2. WAITING ZONE */}
        <SofaGroup position={[-8, 0, 0]} />

      </group>

      {/* PLAYER & UI */}
      <Character walls={WALLS} />
    </>
  )
}
