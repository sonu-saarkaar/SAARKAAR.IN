import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import SaarkaarLogo from './SaarkaarLogo'
import Receptionist from './Receptionist'
import * as THREE from 'three'

export default function ReceptionDesk({ position = [0, 0, -6] }) {
  const deskRef = useRef()
  const setNearReception = useExperienceStore((state) => state.setNearReception)
  const userPosition = useExperienceStore((state) => state.userPosition)

  useFrame(() => {
    if (deskRef.current) {
      const distance = new THREE.Vector3(...userPosition).distanceTo(
        new THREE.Vector3(...position)
      )
      setNearReception(distance < 3)
    }
  })

  const materials = {
    whiteGloss: new THREE.MeshStandardMaterial({ color: '#f0f0f0', roughness: 0.1, metalness: 0.1 }),
    woodAccent: new THREE.MeshStandardMaterial({ color: '#2a1d15', roughness: 0.6 }),
    blackMatte: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8 }),
    glow: new THREE.MeshBasicMaterial({ color: '#00ccff', transparent: true, opacity: 0.5 }),
    paper: new THREE.MeshStandardMaterial({ color: '#fffae6', roughness: 0.9 })
  }

  return (
    <group position={position}>
      {/* MAIN DESK STRUCTURE */}
      <mesh ref={deskRef} position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.1, 1.0]} />
        <primitive object={materials.whiteGloss} attach="material" />
      </mesh>

      {/* WOOD ACCENT PANEL */}
      <mesh position={[0, 0.55, 0.51]}>
        <boxGeometry args={[3.8, 0.8, 0.02]} />
        <primitive object={materials.woodAccent} attach="material" />
      </mesh>

      {/* GLOWING LINE */}
      <mesh position={[0, 0.15, 0.52]}>
        <boxGeometry args={[3.8, 0.02, 0.02]} />
        <primitive object={materials.glow} attach="material" />
      </mesh>

      <SaarkaarLogo position={[0, 0.6, 0.53]} size={0.3} style="desk" />

      {/* COMPUTER Monitor */}
      <group position={[-0.8, 1.1, 0.2]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.15, 0.2, 0.1]} /><meshStandardMaterial color="#888" /></mesh>
        <mesh position={[0, 0.35, 0.05]} rotation={[-0.1, 0, 0]}><boxGeometry args={[0.7, 0.45, 0.02]} /><primitive object={materials.blackMatte} attach="material" /></mesh>
        <mesh position={[0, 0.35, 0.061]} rotation={[-0.1, 0, 0]}><planeGeometry args={[0.68, 0.43]} /><meshBasicMaterial color="#001a33" /></mesh>
      </group>

      {/* Keyboard & Mouse */}
      <mesh position={[-0.8, 1.11, 0.4]} rotation={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.4, 0.02, 0.15]} />
        <primitive object={materials.blackMatte} attach="material" />
      </mesh>
      <mesh position={[-0.45, 1.11, 0.4]} rotation={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.06, 0.02, 0.1]} />
        <primitive object={materials.blackMatte} attach="material" />
      </mesh>

      {/* Telephone */}
      <group position={[-1.6, 1.11, 0.2]} rotation={[0, 0.5, 0]}>
        <mesh castShadow><boxGeometry args={[0.2, 0.05, 0.25]} /><primitive object={materials.blackMatte} attach="material" /></mesh>
        <mesh position={[0, 0.05, 0.05]} castShadow><boxGeometry args={[0.15, 0.04, 0.2]} /><primitive object={materials.blackMatte} attach="material" /></mesh>
      </group>

      {/* Notepad */}
      <mesh position={[0, 1.11, 0.2]} rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.01, 0.3]} />
        <primitive object={materials.paper} attach="material" />
      </mesh>

      {/* Office Lamp */}
      <group position={[1.2, 1.1, 0.1]}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.08, 0.1, 0.04]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.2]}><cylinderGeometry args={[0.01, 0.01, 0.4]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[-0.1, 0.4, 0]} rotation={[0, 0, 1.2]}><cylinderGeometry args={[0.08, 0.08, 0.15]} /><meshStandardMaterial color="#111" /></mesh>
        {/* Subtle Desk Lighting from Lamp */}
        <pointLight position={[-0.1, 0.3, 0]} intensity={0.5} distance={2} color="#ffe8b3" />
      </group>

      {/* RECEPTIONIST */}
      <group position={[0, 0, -0.65]}>
        <React.Suspense fallback={null}>
          <Receptionist />
        </React.Suspense>
      </group>
    </group>
  )
}
