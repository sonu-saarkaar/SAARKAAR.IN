import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import UserAvatar from '../components/UserAvatar'
import ThirdPersonCamera from '../components/ThirdPersonCamera'
import ReceptionDesk from '../components/ReceptionDesk'
import SaarkaarLogo from '../components/SaarkaarLogo'
import { useExperienceStore } from '../store/experienceStore'
import * as THREE from 'three'

export default function LobbyScene() {
  const floorRef = useRef()
  const userPosition = useExperienceStore((state) => state.userPosition)
  const setUserPosition = useExperienceStore((state) => state.setUserPosition)
  const setUserRotation = useExperienceStore((state) => state.setUserRotation)
  const isWalking = useExperienceStore((state) => state.isWalking)
  const walkTarget = useExperienceStore((state) => state.walkTarget)
  const setWalking = useExperienceStore((state) => state.setWalking)

  useFrame(() => {
    if (isWalking && walkTarget) {
      const currentPos = new THREE.Vector3(...userPosition)
      const targetPos = new THREE.Vector3(...walkTarget)
      const direction = targetPos.sub(currentPos).normalize()
      const distance = currentPos.distanceTo(targetPos)

      if (distance > 0.1) {
        const speed = 0.05
        const newPos = currentPos.add(direction.multiplyScalar(speed))
        setUserPosition([newPos.x, newPos.y, newPos.z])
        const angle = Math.atan2(direction.x, direction.z)
        setUserRotation([0, angle, 0])
      } else {
        setWalking(false, null)
      }
    }
  })

  // KIA Showroom Style Materials - Exact Match
  const whiteFloorMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.05, // Highly reflective, glossy
    metalness: 0.1,
  })

  const darkWallMaterial = new THREE.MeshStandardMaterial({
    color: '#1a252f', // Deep dark blue/charcoal
    roughness: 0.6,
    metalness: 0.0,
  })

  const yellowAccentMaterial = new THREE.MeshStandardMaterial({
    color: '#ffd700', // Yellow accent strips
    roughness: 0.4,
    metalness: 0.2,
    emissive: '#ffd700',
    emissiveIntensity: 0.3,
  })

  const whiteDeskMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.3,
    metalness: 0.0,
  })

  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: '#e8e8e8', // Light grey/off-white
    roughness: 0.8,
    metalness: 0.0,
  })

  const displayPanelMaterial = new THREE.MeshStandardMaterial({
    color: '#1a252f', // Dark for back wall
    roughness: 0.4,
    metalness: 0.1,
  })

  const displayWhiteMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    metalness: 0.0,
    emissive: '#ffffff',
    emissiveIntensity: 0.4,
  })

  const displayBlueMaterial = new THREE.MeshStandardMaterial({
    color: '#4a90e2', // Blue accent line
    roughness: 0.3,
    metalness: 0.2,
    emissive: '#4a90e2',
    emissiveIntensity: 0.5,
  })

  return (
    <>
      <ThirdPersonCamera />
      
      {/* KIA-STYLE FLOOR - Highly reflective white polished surface */}
      <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40, 20, 20]} />
        <primitive object={whiteFloorMaterial} attach="material" />
      </mesh>
      {/* Ultra-reflective overlay for mirror-like effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.15} 
          roughness={0.0} 
          metalness={0.5}
        />
      </mesh>

      {/* DARK WALLS - Deep dark blue/charcoal */}
      {/* Back wall (behind reception) */}
      <mesh position={[0, 3, -10]} receiveShadow>
        <boxGeometry args={[40, 6, 0.3]} />
        <primitive object={darkWallMaterial} attach="material" />
      </mesh>

      {/* Left wall with yellow vertical accents */}
      <group position={[-12, 3, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.3, 6, 40]} />
          <primitive object={darkWallMaterial} attach="material" />
        </mesh>
        {/* Yellow vertical accent strips - Left side */}
        {[-18, -12, -6, 0, 6, 12, 18].map((z, i) => (
          <mesh key={`yellow-left-${i}`} position={[0.16, 0, z]} receiveShadow>
            <boxGeometry args={[0.1, 5, 0.8]} />
            <primitive object={yellowAccentMaterial} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Right wall with yellow vertical accents */}
      <group position={[12, 3, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.3, 6, 40]} />
          <primitive object={darkWallMaterial} attach="material" />
        </mesh>
        {/* Yellow vertical accent strips - Right side */}
        {[-18, -12, -6, 0, 6, 12, 18].map((z, i) => (
          <mesh key={`yellow-right-${i}`} position={[-0.16, 0, z]} receiveShadow>
            <boxGeometry args={[0.1, 5, 0.8]} />
            <primitive object={yellowAccentMaterial} attach="material" />
          </mesh>
        ))}
      </group>

      {/* CEILING - Light grey/off-white with square recessed LED panels */}
      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

      {/* Square recessed LED light panels - Even distribution */}
      {[-15, -10, -5, 0, 5, 10, 15].map((x, i) => (
        [-15, -10, -5, 0, 5, 10, 15].map((z, j) => (
          <group key={`ceiling-light-${i}-${j}`} position={[x, 5.9, z]}>
            {/* Recessed panel frame */}
            <mesh receiveShadow>
              <boxGeometry args={[2, 0.1, 2]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.3} />
            </mesh>
            {/* LED light panel - Soft white glow */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
              <boxGeometry args={[1.8, 0.02, 1.8]} />
              <meshStandardMaterial 
                color="#ffffff" 
                emissive="#ffffff" 
                emissiveIntensity={0.9}
              />
            </mesh>
            {/* Point light for illumination */}
            <pointLight position={[0, -0.1, 0]} intensity={0.6} color="#ffffff" />
          </group>
        ))
      ))}

      {/* RECEPTION DESK - Long, rectangular, minimalist white */}
      <ReceptionDesk position={[0, 0, -6]} />

      {/* BACK WALL DISPLAY - Prominent graphic with white rectangles, blue line, white squares */}
      <group position={[0, 3, -9.5]}>
        {/* Dark background panel */}
        <mesh receiveShadow>
          <boxGeometry args={[12, 5, 0.1]} />
          <primitive object={displayPanelMaterial} attach="material" />
        </mesh>

        {/* Large white rectangles - Horizontal arrangement */}
        <group position={[0, 1.5, 0.06]}>
          {[-4, -1.5, 1, 3.5].map((x, i) => (
            <mesh key={`rect-${i}`} position={[x, 0, 0]} receiveShadow>
              <boxGeometry args={[1.8, 0.8, 0.02]} />
              <primitive object={displayWhiteMaterial} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Thin blue horizontal line */}
        <mesh position={[0, 0.3, 0.06]} receiveShadow>
          <boxGeometry args={[8, 0.08, 0.02]} />
          <primitive object={displayBlueMaterial} attach="material" />
        </mesh>

        {/* Row of smaller white squares */}
        <group position={[0, -0.5, 0.06]}>
          {[-3.5, -2, -0.5, 1, 2.5, 4].map((x, i) => (
            <mesh key={`square-${i}`} position={[x, 0, 0]} receiveShadow>
              <boxGeometry args={[0.6, 0.6, 0.02]} />
              <primitive object={displayWhiteMaterial} attach="material" />
            </mesh>
          ))}
        </group>

        {/* SAARKAAR Logo overlay - Subtle branding */}
        <SaarkaarLogo position={[0, -1.8, 0.07]} size={0.6} style="wall" />
      </group>

      {/* User Avatar */}
      <UserAvatar />

      {/* KIA-STYLE LIGHTING - Even, soft white light from ceiling */}
      <ambientLight intensity={0.8} color="#ffffff" />
      
      {/* Main overhead light - Soft and even */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
        shadow-radius={4}
      />
      
      {/* Fill lights for even illumination */}
      <directionalLight
        position={[10, 6, 0]}
        intensity={0.8}
        color="#ffffff"
      />
      <directionalLight
        position={[-10, 6, 0]}
        intensity={0.8}
        color="#ffffff"
      />
    </>
  )
}
