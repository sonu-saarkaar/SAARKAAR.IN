import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAnimationStore } from '../store/animationStore'

const C = {
  skin: '#b97a4f',
  skinShade: '#9c623a',
  hair: '#101010',
  suit: '#161b24',
  suitDark: '#10141c',
  shirt: '#f1f4f8',
  tie: '#7f1d1d',
  shoe: '#0b0b0b',
  chair: '#101010',
  chrome: '#cfd3d8',
}

export default function Boss({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const rootRef = useRef()
  const torsoRef = useRef()
  const headRef = useRef()
  const jawRef = useRef()

  const bossState = useAnimationStore((s) => s.bossState)

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    const talking = bossState === 'talking' || bossState === 'boss_welcoming' || bossState === 'listening'

    if (torsoRef.current) {
      torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, 0.88 + Math.sin(t * 1.1) * 0.008, Math.min(1, delta * 4))
    }

    if (headRef.current) {
      const targetX = talking ? -0.05 + Math.sin(t * 5.5) * 0.02 : Math.sin(t * 0.6) * 0.012
      const targetY = talking ? Math.sin(t * 1.8) * 0.08 : Math.sin(t * 0.4) * 0.03
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, Math.min(1, delta * 5))
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, Math.min(1, delta * 5))
    }

    if (jawRef.current) {
      const jawTarget = talking ? 0.05 + Math.abs(Math.sin(t * 18)) * 0.035 : 0
      jawRef.current.rotation.x = THREE.MathUtils.lerp(jawRef.current.rotation.x, jawTarget, Math.min(1, delta * 10))
    }
  })

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={[1.08, 1.08, 1.08]}>
      {/* Chair */}
      <group>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
          <meshStandardMaterial color={C.chrome} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.06, 6]} />
          <meshStandardMaterial color={C.chrome} metalness={0.95} roughness={0.12} />
        </mesh>
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[0.6, 0.14, 0.58]} />
          <meshStandardMaterial color={C.chair} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.08, -0.29]} rotation={[-0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.56, 0.95, 0.14]} />
          <meshStandardMaterial color={C.chair} roughness={0.32} />
        </mesh>
        <mesh position={[-0.31, 0.74, 0.03]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.32]} />
          <meshStandardMaterial color={C.chair} roughness={0.34} />
        </mesh>
        <mesh position={[0.31, 0.74, 0.03]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.32]} />
          <meshStandardMaterial color={C.chair} roughness={0.34} />
        </mesh>
      </group>

      {/* Lower body - seated */}
      <mesh position={[0, 0.41, 0.02]} castShadow>
        <boxGeometry args={[0.36, 0.16, 0.26]} />
        <meshStandardMaterial color={C.suitDark} roughness={0.7} />
      </mesh>

      <mesh position={[-0.12, 0.46, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.085, 0.5, 20]} />
        <meshStandardMaterial color={C.suitDark} roughness={0.72} />
      </mesh>
      <mesh position={[0.12, 0.46, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.085, 0.5, 20]} />
        <meshStandardMaterial color={C.suitDark} roughness={0.72} />
      </mesh>

      <mesh position={[-0.12, 0.14, 0.43]} castShadow>
        <cylinderGeometry args={[0.062, 0.058, 0.58, 16]} />
        <meshStandardMaterial color={C.suitDark} roughness={0.72} />
      </mesh>
      <mesh position={[0.12, 0.14, 0.43]} castShadow>
        <cylinderGeometry args={[0.062, 0.058, 0.58, 16]} />
        <meshStandardMaterial color={C.suitDark} roughness={0.72} />
      </mesh>

      <mesh position={[-0.12, -0.16, 0.5]} castShadow>
        <boxGeometry args={[0.14, 0.09, 0.3]} />
        <meshStandardMaterial color={C.shoe} roughness={0.08} metalness={0.6} />
      </mesh>
      <mesh position={[0.12, -0.16, 0.5]} castShadow>
        <boxGeometry args={[0.14, 0.09, 0.3]} />
        <meshStandardMaterial color={C.shoe} roughness={0.08} metalness={0.6} />
      </mesh>

      {/* Torso */}
      <group ref={torsoRef} position={[0, 0.88, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.54, 0.27]} />
          <meshStandardMaterial color={C.suit} roughness={0.6} />
        </mesh>

        <mesh position={[0, 0.1, 0.14]}>
          <boxGeometry args={[0.13, 0.3, 0.01]} />
          <meshStandardMaterial color={C.shirt} roughness={0.88} />
        </mesh>

        <mesh position={[0, 0.08, 0.15]}>
          <boxGeometry args={[0.04, 0.24, 0.008]} />
          <meshStandardMaterial color={C.tie} roughness={0.5} />
        </mesh>

        <mesh position={[0, 0.22, 0.148]}>
          <boxGeometry args={[0.055, 0.055, 0.012]} />
          <meshStandardMaterial color={C.tie} roughness={0.45} />
        </mesh>

        {/* Arms */}
        <mesh position={[-0.29, 0.1, 0.06]} rotation={[0.5, 0, -0.16]} castShadow>
          <boxGeometry args={[0.12, 0.34, 0.12]} />
          <meshStandardMaterial color={C.suit} roughness={0.62} />
        </mesh>
        <mesh position={[0.29, 0.1, 0.06]} rotation={[0.5, 0, 0.16]} castShadow>
          <boxGeometry args={[0.12, 0.34, 0.12]} />
          <meshStandardMaterial color={C.suit} roughness={0.62} />
        </mesh>

        <mesh position={[-0.31, -0.04, 0.25]} rotation={[-0.82, 0, -0.1]} castShadow>
          <boxGeometry args={[0.1, 0.27, 0.1]} />
          <meshStandardMaterial color={C.suit} roughness={0.62} />
        </mesh>
        <mesh position={[0.31, -0.04, 0.25]} rotation={[-0.82, 0, 0.1]} castShadow>
          <boxGeometry args={[0.1, 0.27, 0.1]} />
          <meshStandardMaterial color={C.suit} roughness={0.62} />
        </mesh>

        <mesh position={[-0.31, -0.18, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.06, 0.12]} />
          <meshStandardMaterial color={C.skin} roughness={0.55} />
        </mesh>
        <mesh position={[0.31, -0.18, 0.4]} castShadow>
          <boxGeometry args={[0.1, 0.06, 0.12]} />
          <meshStandardMaterial color={C.skin} roughness={0.55} />
        </mesh>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.2, 0.01]} castShadow>
        <cylinderGeometry args={[0.06, 0.072, 0.12, 16]} />
        <meshStandardMaterial color={C.skin} roughness={0.54} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 1.35, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 30, 28]} />
          <meshStandardMaterial color={C.skin} roughness={0.46} />
        </mesh>

        <mesh position={[0, 0.08, -0.01]} castShadow>
          <sphereGeometry args={[0.164, 26, 16]} />
          <meshStandardMaterial color={C.hair} roughness={0.86} />
        </mesh>

        <mesh position={[-0.06, 0.04, 0.154]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#f6f7f9" roughness={0.12} />
        </mesh>
        <mesh position={[0.06, 0.04, 0.154]}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#f6f7f9" roughness={0.12} />
        </mesh>

        <mesh position={[-0.06, 0.04, 0.17]}>
          <sphereGeometry args={[0.011, 10, 10]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.1} />
        </mesh>
        <mesh position={[0.06, 0.04, 0.17]}>
          <sphereGeometry args={[0.011, 10, 10]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.1} />
        </mesh>

        <mesh position={[0, -0.005, 0.165]}>
          <boxGeometry args={[0.022, 0.056, 0.016]} />
          <meshStandardMaterial color={C.skinShade} roughness={0.58} />
        </mesh>

        <mesh position={[0, -0.05, 0.152]}>
          <boxGeometry args={[0.062, 0.014, 0.01]} />
          <meshStandardMaterial color="#7a3a2a" roughness={0.7} />
        </mesh>

        <group ref={jawRef} position={[0, -0.072, 0.13]}>
          <mesh position={[0, 0.004, 0.02]}>
            <boxGeometry args={[0.066, 0.018, 0.01]} />
            <meshStandardMaterial color="#7a3a2a" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.055, 0.022]}>
            <boxGeometry args={[0.1, 0.04, 0.095]} />
            <meshStandardMaterial color={C.skin} roughness={0.54} />
          </mesh>
        </group>

        <mesh position={[-0.168, 0.005, 0]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial color={C.skin} roughness={0.58} />
        </mesh>
        <mesh position={[0.168, 0.005, 0]}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshStandardMaterial color={C.skin} roughness={0.58} />
        </mesh>
      </group>
    </group>
  )
}
