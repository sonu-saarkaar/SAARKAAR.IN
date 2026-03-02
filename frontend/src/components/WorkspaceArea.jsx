import * as THREE from 'three'

export default function WorkspaceArea({ position = [0, 0, 4] }) {
  const deskMaterial = new THREE.MeshStandardMaterial({
    color: '#ecf0f1',
    roughness: 0.3,
    metalness: 0.1,
  })

  const monitorMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.2,
    metalness: 0.3,
  })

  return (
    <group position={position}>
      {/* Open Office Workstations - Modern layout */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Desk */}
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[2, 0.8, 1]} />
            <primitive object={deskMaterial} attach="material" />
          </mesh>

          {/* Monitor */}
          <group position={[0, 0.9, 0.2]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <boxGeometry args={[0.08, 0.2, 0.08]} />
              <primitive object={monitorMaterial} attach="material" />
            </mesh>
            <mesh castShadow>
              <boxGeometry args={[0.6, 0.4, 0.05]} />
              <primitive object={monitorMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.03]} receiveShadow>
              <boxGeometry args={[0.58, 0.38, 0.01]} />
              <meshStandardMaterial color="#000000" emissive="#001122" emissiveIntensity={0.4} />
            </mesh>
          </group>

          {/* Keyboard */}
          <mesh position={[0, 0.85, 0.4]} castShadow>
            <boxGeometry args={[0.4, 0.02, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>

          {/* Chair */}
          <group position={[0, 0, -0.8]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 0.6, 16]} />
              <meshStandardMaterial color="#34495e" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.12, 0.5]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.8, -0.15]} castShadow>
              <boxGeometry args={[0.5, 0.4, 0.1]} />
              <meshStandardMaterial color="#2c3e50" roughness={0.5} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Glass Partitions */}
      {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.05, 3, 8]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
            roughness={0.0}
            transmission={0.8}
          />
        </mesh>
      ))}

      {/* Whiteboards */}
      {[-7, 7].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 2]} receiveShadow>
          <boxGeometry args={[1.5, 2, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}
