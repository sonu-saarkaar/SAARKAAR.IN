import { useRef } from 'react'
import * as THREE from 'three'

export default function MeetingRoom({ position = [-8, 0, -6] }) {
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

  const tableMaterial = new THREE.MeshStandardMaterial({
    color: '#3d2817',
    roughness: 0.4,
    metalness: 0.1,
  })

  const tableTopMaterial = new THREE.MeshStandardMaterial({
    color: '#5a3d2a',
    roughness: 0.2,
    metalness: 0.0,
  })

  return (
    <group position={position}>
      {/* Glass Walls - Transparent meeting room */}
      {/* Front wall */}
      <mesh position={[0, 2, 2]} receiveShadow>
        <boxGeometry args={[8, 4, 0.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 2, 2]} receiveShadow>
        <boxGeometry args={[8.1, 4.1, 0.08]} />
        <primitive object={steelFrame} attach="material" />
      </mesh>

      {/* Side wall */}
      <mesh position={[-4, 2, 0]} receiveShadow>
        <boxGeometry args={[0.05, 4, 4]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>
      <mesh position={[-4, 2, 0]} receiveShadow>
        <boxGeometry args={[0.08, 4.1, 4.1]} />
        <primitive object={steelFrame} attach="material" />
      </mesh>

      {/* Long Conference Table */}
      <group position={[0, 0, 0]}>
        {/* Table base */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 0.8, 1.8]} />
          <primitive object={tableMaterial} attach="material" />
        </mesh>
        
        {/* Table top */}
        <mesh position={[0, 0.8, 0]} receiveShadow>
          <boxGeometry args={[6.2, 0.1, 2]} />
          <primitive object={tableTopMaterial} attach="material" />
        </mesh>

        {/* Conference Chairs - Organized */}
        {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x, i) => (
          <group key={i} position={[x, 0, 1.2]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
              <meshStandardMaterial color="#34495e" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.12, 0.5]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.85, -0.15]} castShadow>
              <boxGeometry args={[0.5, 0.5, 0.1]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Smart Screen / Digital Board */}
      <mesh position={[-3.5, 2.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.8, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh position={[-3.5, 2.5, -0.95]} receiveShadow>
        <boxGeometry args={[2.9, 1.7, 0.01]} />
        <meshStandardMaterial color="#000000" emissive="#001133" emissiveIntensity={0.7} />
      </mesh>
      {/* Screen frame */}
      <mesh position={[-3.5, 2.5, -0.94]} receiveShadow>
        <boxGeometry args={[3.1, 1.9, 0.05]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Premium Lighting */}
      <pointLight position={[0, 3.5, 0]} intensity={1.5} color="#ffffff" />
    </group>
  )
}
