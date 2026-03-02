import * as THREE from 'three'
import { Text, Float } from '@react-three/drei'

export default function SaarkaarLogo({ position = [0, 0, 0], size = 1, style = 'wall' }) {
  const accentColor = '#d4af37' // Premium Luxury Gold
  const textColor = '#ffffff'   // Clean White

  if (style === 'wall') {
    // Large premium wall-mounted logo for Lobby Background
    return (
      <group position={position}>
        {/* Dark Premium Wall Backing Paneling */}
        <mesh position={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[9 * size, 3.8 * size, 0.1]} />
          <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Floating Inner Gold Frame for Depth/Architecture */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[8.6 * size, 3.4 * size, 0.02]} />
          <meshStandardMaterial color={accentColor} metalness={1} roughness={0.1} transparent opacity={0.15} />
        </mesh>

        {/* Hover/Float effect for Holographic/Premium feel */}
        <Float speed={1.5} rotationIntensity={0.02} floatIntensity={0.08}>

          {/* MAIN "SAARKAAR" TEXT */}
          <Text
            position={[0, 0.5 * size, 0.15]}
            fontSize={1.2 * size}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.25}
            fontWeight="bold"
          >
            SAARKAAR
            {/* Real 3D Lighting & Reflections on Font */}
            <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.1} />
          </Text>

          {/* GLOWING GOLD ACCENT DIVIDER (Sexy Cyber-Corporate style) */}
          <mesh position={[0, -0.35 * size, 0.12]} castShadow>
            <boxGeometry args={[6 * size, 0.03 * size, 0.05]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.0} metalness={1} roughness={0.1} toneMapped={false} />
          </mesh>

          {/* "VIRTUAL OFFICE" LUXURY SUBTITLE */}
          <Text
            position={[0, -0.85 * size, 0.15]}
            fontSize={0.4 * size}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.6}
          >
            VIRTUAL OFFICE
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} metalness={1} roughness={0.2} />
          </Text>

        </Float>
      </group>
    )
  } else if (style === 'desk') {
    // Small elegant desk nameplate
    return (
      <group position={position}>
        <mesh position={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.6 * size, 0.55 * size, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.1} metalness={0.9} />
        </mesh>
        <Text
          position={[0, 0.1 * size, 0.015]}
          fontSize={0.2 * size}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          SAARKAAR
        </Text>
        <Text
          position={[0, -0.15 * size, 0.015]}
          fontSize={0.08 * size}
          color={accentColor}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
        >
          VIRTUAL OFFICE
        </Text>
      </group>
    )
  }

  return null
}
