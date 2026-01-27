import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import SaarkaarLogo from './SaarkaarLogo'
import * as THREE from 'three'

export default function BossCabin({ position = [8, 0, -6] }) {
  const founderRef = useRef()
  const setInOffice = useExperienceStore((state) => state.setInOffice)
  const userPosition = useExperienceStore((state) => state.userPosition)

  useFrame(() => {
    if (founderRef.current) {
      const time = Date.now() * 0.001
      founderRef.current.rotation.y = Math.sin(time * 0.3) * 0.05
    }

    // Check if user enters cabin
    const distance = new THREE.Vector3(...userPosition).distanceTo(
      new THREE.Vector3(...position)
    )
    if (distance < 2 && !useExperienceStore.getState().isInOffice) {
      setInOffice(true)
    }
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.15,
    roughness: 0.0,
    metalness: 0.0,
    transmission: 0.9,
    thickness: 0.5,
  })

  const steelFrame = new THREE.MeshStandardMaterial({
    color: '#2c3e50',
    roughness: 0.2,
    metalness: 0.8,
  })

  const deskMaterial = new THREE.MeshStandardMaterial({
    color: '#3d2817',
    roughness: 0.4,
    metalness: 0.1,
  })

  const deskTopMaterial = new THREE.MeshStandardMaterial({
    color: '#5a3d2a',
    roughness: 0.2,
    metalness: 0.0,
  })

  return (
    <group position={position}>
      {/* Glass Walls - Transparent cabin */}
      {/* Front wall */}
      <mesh position={[0, 2, 2]} receiveShadow>
        <boxGeometry args={[6, 4, 0.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 2, 2]} receiveShadow>
        <boxGeometry args={[6.1, 4.1, 0.08]} />
        <primitive object={steelFrame} attach="material" />
      </mesh>

      {/* Side wall */}
      <mesh position={[-3, 2, 0]} receiveShadow>
        <boxGeometry args={[0.05, 4, 4]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      <mesh position={[-3, 2, 0]} receiveShadow>
        <boxGeometry args={[0.08, 4.1, 4.1]} />
        <primitive object={steelFrame} attach="material" />
      </mesh>
      
      {/* SAARKAAR Wall Logo - Executive branding */}
      <SaarkaarLogo position={[-2.8, 2.5, -1]} size={0.5} style="wall" />

      {/* Premium Executive Desk */}
      <group position={[0, 0, -1.5]}>
        {/* Desk base */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 1, 2]} />
          <primitive object={deskMaterial} attach="material" />
        </mesh>
        
        {/* Desk top */}
        <mesh position={[0, 1, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.1, 2.2]} />
          <primitive object={deskTopMaterial} attach="material" />
        </mesh>

        {/* Multiple Large Monitors - Tech Setup */}
        {[-1.2, 0, 1.2].map((x, i) => (
          <group key={i} position={[x, 1.3, 0.3]}>
            {/* Monitor stand */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.1, 0.3, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.4} />
            </mesh>
            {/* Monitor screen */}
            <mesh castShadow>
              <boxGeometry args={[0.8, 0.5, 0.05]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
            </mesh>
            {/* Screen display - Tech dashboards */}
            <mesh position={[0, 0, 0.03]} receiveShadow>
              <boxGeometry args={[0.75, 0.45, 0.01]} />
              <meshStandardMaterial 
                color="#0a0a0a" 
                emissive={i === 1 ? "#001133" : "#001122"} 
                emissiveIntensity={0.6} 
              />
            </mesh>
            {/* Dashboard elements (simulated) */}
            <mesh position={[-0.2, 0.1, 0.031]} receiveShadow>
              <boxGeometry args={[0.15, 0.1, 0.005]} />
              <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0.2, -0.1, 0.031]} receiveShadow>
              <boxGeometry args={[0.15, 0.1, 0.005]} />
              <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}

        {/* Laptop */}
        <group position={[-1.5, 1, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.03, 0.35]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.4} />
          </mesh>
          <mesh position={[0, -0.02, 0]} castShadow>
            <boxGeometry args={[0.5, 0.02, 0.35]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.015, 0.175]} receiveShadow>
            <boxGeometry args={[0.48, 0.025, 0.01]} />
            <meshStandardMaterial color="#000000" emissive="#001122" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Desk accessories */}
        <mesh position={[-1.8, 1, 0.8]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[-1.8, 1.15, 0.8]} castShadow>
          <boxGeometry args={[0.12, 0.06, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
        </mesh>
        
        {/* SAARKAAR Desk Nameplate */}
        <SaarkaarLogo position={[1.5, 1.05, 0.8]} size={0.3} style="desk" />
      </group>

      {/* Executive Chair */}
      <group position={[0, 0, -2.5]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2 * Math.PI / 5) * 0.25, 0.05, Math.sin(i * 2 * Math.PI / 5) * 0.25]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.15, 0.65]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.2, -0.25]} castShadow>
          <boxGeometry args={[0.65, 0.9, 0.12]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.5} />
        </mesh>
        <mesh position={[-0.38, 0.8, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.55]} />
          <meshStandardMaterial color="#34495e" roughness={0.4} />
        </mesh>
        <mesh position={[0.38, 0.8, 0]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.55]} />
          <meshStandardMaterial color="#34495e" roughness={0.4} />
        </mesh>
      </group>

      {/* Comfortable Sofa Seating Area */}
      <group position={[-2, 0, 1]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.8, 1.2]} />
          <meshStandardMaterial color="#34495e" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, -0.4]} castShadow>
          <boxGeometry args={[2.5, 0.8, 0.15]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.8, 0.1]} castShadow>
          <boxGeometry args={[2.3, 0.2, 1]} />
          <meshStandardMaterial color="#3a4a5c" roughness={0.6} />
        </mesh>
      </group>

      {/* Coffee Table */}
      <group position={[-2, 0, 2.5]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.7, 16]} />
          <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.7, 0]} receiveShadow>
          <boxGeometry args={[1.2, 0.05, 0.8]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.2} />
        </mesh>
      </group>

      {/* Founder Character */}
      <group ref={founderRef} position={[0, 1, -2.5]}>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.45, 0.05]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#2c1810" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.45, 0.6, 0.35]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[-0.3, 0.2, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.24, 0.14, 0.14]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
        </mesh>
        <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.24, 0.14, 0.14]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
        </mesh>
      </group>

      {/* Premium Lighting - Well-balanced */}
      <pointLight position={[0, 3, -1]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-2, 2.5, 1]} intensity={0.6} color="#ffffff" />
    </group>
  )
}
