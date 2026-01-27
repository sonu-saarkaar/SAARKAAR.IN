import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import SaarkaarLogo from './SaarkaarLogo'
import * as THREE from 'three'

export default function ReceptionDesk({ position = [0, 0, -6] }) {
  const deskRef = useRef()
  const receptionistRef = useRef()
  const setNearReception = useExperienceStore((state) => state.setNearReception)
  const userPosition = useExperienceStore((state) => state.userPosition)

  useFrame(() => {
    if (deskRef.current) {
      const distance = new THREE.Vector3(...userPosition).distanceTo(
        new THREE.Vector3(...position)
      )
      setNearReception(distance < 3)
    }

    if (receptionistRef.current) {
      const time = Date.now() * 0.001
      receptionistRef.current.rotation.y = Math.sin(time * 0.5) * 0.1
    }
  })

  const deskMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', // Pure white for KIA style
    roughness: 0.3,
    metalness: 0.0,
  })

  return (
    <group position={position}>
      {/* KIA-STYLE Reception Desk - Long, rectangular, minimalist white */}
      <mesh ref={deskRef} position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 1, 1.8]} />
        <primitive object={deskMaterial} attach="material" />
      </mesh>

      {/* SAARKAAR Desk Nameplate */}
      <SaarkaarLogo position={[-2, 0.6, 0.76]} size={0.4} style="desk" />

      {/* Monitor on desk - KIA style minimalist */}
      <group position={[-2, 0.8, 0.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.35, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.03]} receiveShadow>
          <boxGeometry args={[0.48, 0.33, 0.01]} />
          <meshStandardMaterial color="#000000" emissive="#001133" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Professional Receptionist */}
      <group ref={receptionistRef} position={[1.5, 1, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.35, 0.5, 0.25]} />
          <meshStandardMaterial color="#34495e" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
