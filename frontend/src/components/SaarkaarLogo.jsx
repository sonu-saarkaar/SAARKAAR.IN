import * as THREE from 'three'

export default function SaarkaarLogo({ position = [0, 0, 0], size = 1, style = 'wall' }) {
  // Premium brand colors - Powerful, calm, intelligent
  const primaryColor = '#1a252f' // Deep charcoal - powerful
  const accentColor = '#4a90e2' // Professional blue - intelligent
  const textColor = '#ffffff' // Clean white - calm
  
  // Logo base material
  const logoBaseMaterial = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.3,
    metalness: 0.2,
  })
  
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.2,
    metalness: 0.4,
    emissive: accentColor,
    emissiveIntensity: 0.1,
  })
  
  const textMaterial = new THREE.MeshStandardMaterial({
    color: textColor,
    roughness: 0.4,
    metalness: 0.1,
  })

  if (style === 'wall') {
    // Large wall-mounted logo
    return (
      <group position={position}>
        {/* Logo background panel */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[6 * size, 3 * size, 0.1]} />
          <primitive object={logoBaseMaterial} attach="material" />
        </mesh>
        
        {/* SAARKAAR Text - Modern, bold typography */}
        <group position={[0, 0.3 * size, 0.06]}>
          {/* Letter S */}
          <mesh position={[-2.2 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[-2.2 * size, 0.3 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[-2.2 * size, -0.3 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter A (first) */}
          <mesh position={[-1.3 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[-1.3 * size, 0.25 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter A (second) */}
          <mesh position={[-0.4 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.4 * size, 0.25 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter R (first) */}
          <mesh position={[0.5 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[0.5 * size, 0.25 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter K */}
          <mesh position={[1.4 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[1.4 * size, 0, 0]} rotation={[0, 0, -0.5]} receiveShadow>
            <boxGeometry args={[0.3 * size, 0.4 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[1.4 * size, 0, 0]} rotation={[0, 0, 0.5]} receiveShadow>
            <boxGeometry args={[0.3 * size, 0.4 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter A (third) */}
          <mesh position={[2.3 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[2.3 * size, 0.25 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          
          {/* Letter R (second) */}
          <mesh position={[3.2 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.8 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[3.2 * size, 0.25 * size, 0]} receiveShadow>
            <boxGeometry args={[0.4 * size, 0.15 * size, 0.05]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
        </group>
        
        {/* Accent line - Tech-driven element */}
        <mesh position={[0, -0.8 * size, 0.06]} receiveShadow>
          <boxGeometry args={[4 * size, 0.08 * size, 0.05]} />
          <primitive object={accentMaterial} attach="material" />
        </mesh>
        
        {/* Tagline - Professional */}
        <group position={[0, -1.2 * size, 0.06]}>
          <mesh position={[-0.8 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.15 * size, 0.3 * size, 0.03]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.4 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.15 * size, 0.3 * size, 0.03]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0]} receiveShadow>
            <boxGeometry args={[0.15 * size, 0.3 * size, 0.03]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[0.4 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.15 * size, 0.3 * size, 0.03]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
          <mesh position={[0.8 * size, 0, 0]} receiveShadow>
            <boxGeometry args={[0.15 * size, 0.3 * size, 0.03]} />
            <primitive object={textMaterial} attach="material" />
          </mesh>
        </group>
      </group>
    )
  } else if (style === 'desk') {
    // Small desk nameplate
    return (
      <group position={position}>
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[1.2 * size, 0.3 * size, 0.02]} />
          <primitive object={logoBaseMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.015]} receiveShadow>
          <boxGeometry args={[0.8 * size, 0.15 * size, 0.01]} />
          <primitive object={textMaterial} attach="material" />
        </mesh>
      </group>
    )
  }
  
  return null
}
