import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import * as THREE from 'three'

export default function OfficeDoor({ position = [4, 0, -2] }) {
  const doorRef = useRef()
  const [isOpen, setIsOpen] = useState(false)
  const setNearOffice = useExperienceStore((state) => state.setNearOffice)
  const setInOffice = useExperienceStore((state) => state.setInOffice)
  const userPosition = useExperienceStore((state) => state.userPosition)

  useFrame(() => {
    if (doorRef.current) {
      const distance = new THREE.Vector3(...userPosition).distanceTo(
        new THREE.Vector3(...position)
      )
      setNearOffice(distance < 2)

      if (isOpen && doorRef.current.rotation.y < Math.PI / 2) {
        doorRef.current.rotation.y += 0.05
      }
    }
  })

  const handleEnter = () => {
    setIsOpen(true)
    setTimeout(() => {
      setInOffice(true)
    }, 1000)
  }

  // Realistic materials
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: '#3d2817',
    roughness: 0.5,
    metalness: 0.1,
  })

  const doorMaterial = new THREE.MeshStandardMaterial({
    color: '#4a3728',
    roughness: 0.6,
    metalness: 0.0,
  })

  return (
    <group position={position}>
      {/* Professional Door Frame */}
      <mesh position={[0, 1.5, 0]} receiveShadow>
        <boxGeometry args={[1.4, 3.2, 0.25]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      
      {/* Door - Realistic wood */}
      <mesh
        ref={doorRef}
        position={[0, 1.5, 0.13]}
        rotation={[0, 0, 0]}
        castShadow
        onClick={handleEnter}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <boxGeometry args={[1.1, 3, 0.08]} />
        <primitive object={doorMaterial} attach="material" />
      </mesh>

      {/* Door handle - Modern */}
      <mesh position={[0.5, 1.5, 0.17]} castShadow>
        <boxGeometry args={[0.08, 0.02, 0.04]} />
        <meshStandardMaterial color="#8b7355" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Door panel details */}
      <mesh position={[0, 1.5, 0.17]} receiveShadow>
        <boxGeometry args={[0.9, 0.1, 0.01]} />
        <meshStandardMaterial color="#3a2818" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.8, 0.17]} receiveShadow>
        <boxGeometry args={[0.9, 0.1, 0.01]} />
        <meshStandardMaterial color="#3a2818" roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.2, 0.17]} receiveShadow>
        <boxGeometry args={[0.9, 0.1, 0.01]} />
        <meshStandardMaterial color="#3a2818" roughness={0.5} />
      </mesh>

      {/* Nameplate */}
      <mesh position={[0, 2.6, 0.18]} receiveShadow>
        <boxGeometry args={[0.4, 0.15, 0.02]} />
        <meshStandardMaterial color="#d4a574" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  )
}
