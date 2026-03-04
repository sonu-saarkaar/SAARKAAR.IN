import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import Character from '../components/Character' // Updated import
import BossCabin from '../components/BossCabin'
import MeetingRoom from '../components/MeetingRoom'
import WorkspaceArea from '../components/WorkspaceArea'
import { useExperienceStore } from '../store/experienceStore'
import { usePerformanceStore } from '../store/performanceStore'
import * as THREE from 'three'

const OFFICE_WALLS = [
  // Room boundaries
  [0, -10, 40, 0.3],
  [-10, 0, 0.3, 40],
  [10, 0, 0.3, 40],

  // Major office structures
  [8, -6, 6.2, 4.2],
  [-8, -6, 8.2, 4.2],
  [0, 4, 14.2, 8.2],
]

export default function OfficeScene() {
  const floorRef = useRef()
  const userPositionRef = useRef([0, 0, 0])
  const { settings } = usePerformanceStore()
  const setUserPosition = useExperienceStore((state) => state.setUserPosition)
  const isSitting = useExperienceStore((state) => state.isSitting)
  const setSitting = useExperienceStore((state) => state.setSitting)
  const setNearSeating = useExperienceStore((state) => state.setNearSeating)
  const setCameraFocus = useExperienceStore((state) => state.setCameraFocus)
  const setConversationPartner = useExperienceStore((state) => state.setConversationPartner)

  useEffect(() => {
    const unsub = useExperienceStore.subscribe((state) => {
      userPositionRef.current = state.userPosition
    })
    return unsub
  }, [])

  useEffect(() => {
    setCameraFocus('lobby')
    setConversationPartner(null)
  }, [setCameraFocus, setConversationPartner])

  useFrame(() => {
    const seatingArea = new THREE.Vector3(0, 0, 2)
    const distance = new THREE.Vector3(...userPositionRef.current).distanceTo(seatingArea)
    setNearSeating(distance < 1.5)
  })

  // Premium wooden floor material
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#8b6f47',
    roughness: 0.3,
    metalness: 0.1,
  }), [])

  // Wood grain pattern (simulated with subtle variation)
  const woodGrainMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6b5234',
    roughness: 0.4,
    metalness: 0.05,
  }), [])

  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f8f9fa',
    roughness: 0.6,
    metalness: 0.0,
  }), [])

  return (
    <>
      {/* Premium Office Floor - Wooden with pattern */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={settings.shadows}>
        <planeGeometry args={[40, 40, 20, 20]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      {/* Wood planks pattern (simulated) */}
      {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
        <mesh key={`plank-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]} receiveShadow={settings.shadows}>
          <planeGeometry args={[2.5, 40]} />
          <primitive object={woodGrainMaterial} attach="material" />
        </mesh>
      ))}

      {/* Office Walls - Glass partitions for transparency */}
      <group position={[0, 3, -10]}>
        <mesh receiveShadow>
          <boxGeometry args={[40, 6, 0.3]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        {/* Glass windows in wall */}
        {[-12, -6, 0, 6, 12].map((x, i) => (
          <mesh key={`window-${i}`} position={[x, 0, 0.16]}>
            <boxGeometry args={[5, 4, 0.05]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              roughness={0.0}
              transmission={0.8}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[-10, 3, 0]} receiveShadow>
        <boxGeometry args={[0.3, 6, 40]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      <mesh position={[10, 3, 0]} receiveShadow>
        <boxGeometry args={[0.3, 6, 40]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>

      {/* Premium Ceiling - Modern suspended */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* Ceiling lights - Recessed LED panels */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        [-6, -3, 0, 3, 6].map((z, j) => (
          <group key={`light-${i}-${j}`} position={[x, 5.9, z]}>
            <mesh receiveShadow={settings.shadows}>
              <boxGeometry args={[1.5, 0.1, 1.5]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.05, 0]} receiveShadow={settings.shadows}>
              <boxGeometry args={[1.4, 0.02, 1.4]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
            </mesh>
            {settings.particlesEnabled && <pointLight position={[0, -0.1, 0]} intensity={0.4} color="#ffffff" />}
          </group>
        ))
      ))}

      {/* Boss Cabin - Glass-walled executive office */}
      <BossCabin position={[8, 0, -6]} />

      {/* Meeting Room - Glass conference room */}
      <MeetingRoom position={[-8, 0, -6]} />

      {/* Open Workspace Area */}
      <WorkspaceArea position={[0, 0, 4]} />

      {/* Realistic Character with Animations */}
      <Character walls={OFFICE_WALLS} />

      {/* Premium Office Lighting - Bright and professional */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Main light source */}
      <directionalLight
        position={[0, 10, -10]}
        intensity={2.0}
        color="#fff8e1"
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.highResTextures ? 4096 : 1024}
        shadow-mapSize-height={settings.highResTextures ? 4096 : 1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-radius={settings.highResTextures ? 4 : 2}
      />

      {/* Side fill lights */}
      <directionalLight
        position={[10, 8, 0]}
        intensity={1.2}
        color="#ffffff"
      />
      <directionalLight
        position={[-10, 8, 0]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* Top-down light for even illumination */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={0.6}
        color="#ffffff"
      />
    </>
  )
}

