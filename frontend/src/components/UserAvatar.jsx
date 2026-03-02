import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useExperienceStore } from '../store/experienceStore'
import * as THREE from 'three'

export default function UserAvatar() {
  const meshRef = useRef()
  const userPosition = useExperienceStore((state) => state.userPosition)
  const userRotation = useExperienceStore((state) => state.userRotation)
  const isWalking = useExperienceStore((state) => state.isWalking)
  const isSitting = useExperienceStore((state) => state.isSitting)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...userPosition)
      meshRef.current.rotation.y = userRotation[1]

      if (isSitting) {
        meshRef.current.position.y = userPosition[1] - 0.4
      }
    }
  })

  // Premium PBR Materials - Ultra-realistic
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: '#e8c4a8',
    roughness: 0.85,
    metalness: 0.0,
    normalScale: new THREE.Vector2(0.5, 0.5),
  })

  const suitMaterial = new THREE.MeshStandardMaterial({
    color: '#2c3e50', // Dark charcoal business suit
    roughness: 0.7,
    metalness: 0.05,
  })

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', // White formal shirt
    roughness: 0.6,
    metalness: 0.0,
  })

  const pantsMaterial = new THREE.MeshStandardMaterial({
    color: '#1a252f', // Matching suit pants
    roughness: 0.7,
    metalness: 0.05,
  })

  const shoeMaterial = new THREE.MeshStandardMaterial({
    color: '#0a0a0a', // Black leather shoes
    roughness: 0.3,
    metalness: 0.4,
  })

  const hairMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a', // Dark professional hair
    roughness: 0.9,
    metalness: 0.0,
  })

  const faceTexture = useMemo(() => {
    const tex = new THREE.TextureLoader().load('/face_texture.png')
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: '#1a1a1a', // Suit buttons
    roughness: 0.4,
    metalness: 0.6,
  })

  // Avatar height: ~1.78m (5'10") - Professional executive height
  const height = 1.78
  const headHeight = height * 0.13 // Head is ~13% of total height
  const torsoHeight = height * 0.3
  const legHeight = height * 0.47

  return (
    <group ref={meshRef} castShadow>
      {/* HEAD - Realistic professional male */}
      <group position={[0, height - headHeight * 0.5, 0]}>
        {/* Head base - Box shape for texture mapping */}
        <mesh position={[0, 0, 0]} castShadow material={[
          skinMaterial, // right
          skinMaterial, // left
          hairMaterial, // top
          skinMaterial, // bottom
          new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.6 }), // front
          hairMaterial, // back
        ]}>
          <boxGeometry args={[headHeight * 0.8, headHeight, headHeight * 0.8]} />
        </mesh>
      </group>

      {/* NECK */}
      <mesh position={[0, height - headHeight - 0.05, 0]} castShadow>
        <cylinderGeometry args={[headHeight * 0.15, headHeight * 0.15, 0.12, 16]} />
        <primitive object={skinMaterial} attach="material" />
      </mesh>

      {/* TORSO - Business suit jacket */}
      <group position={[0, height - headHeight - torsoHeight * 0.5 - 0.12, 0]}>
        {/* Suit jacket base */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.48, torsoHeight, 0.28]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>

        {/* White formal shirt - Visible collar and cuffs */}
        <mesh position={[0, torsoHeight * 0.3, 0.15]} castShadow>
          <boxGeometry args={[0.42, torsoHeight * 0.4, 0.05]} />
          <primitive object={shirtMaterial} attach="material" />
        </mesh>
        {/* Shirt collar */}
        <mesh position={[0, torsoHeight * 0.35, 0.16]} castShadow>
          <boxGeometry args={[0.38, 0.08, 0.06]} />
          <primitive object={shirtMaterial} attach="material" />
        </mesh>

        {/* Suit jacket lapels */}
        <mesh position={[-0.2, torsoHeight * 0.25, 0.15]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.04]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        <mesh position={[0.2, torsoHeight * 0.25, 0.15]} rotation={[0, 0, -0.2]} castShadow>
          <boxGeometry args={[0.12, 0.2, 0.04]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>

        {/* Suit buttons - Professional detail */}
        {[0.15, 0, -0.15].map((y, i) => (
          <mesh key={i} position={[0, y, 0.145]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
            <primitive object={buttonMaterial} attach="material" />
          </mesh>
        ))}

        {/* Shoulder pads - Professional tailoring */}
        <mesh position={[-0.24, torsoHeight * 0.15, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.25]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        <mesh position={[0.24, torsoHeight * 0.15, 0]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.25]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
      </group>

      {/* ARMS - Professional suit sleeves */}
      <group position={[-0.28, height - headHeight - torsoHeight * 0.3 - 0.12, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.35, 0]} rotation={[0, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 16]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        {/* Shirt cuff visible */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.04, 16]} />
          <primitive object={shirtMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.04]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      <group position={[0.28, height - headHeight - torsoHeight * 0.3 - 0.12, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.15, 0]} rotation={[0, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.35, 0]} rotation={[0, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 16]} />
          <primitive object={suitMaterial} attach="material" />
        </mesh>
        {/* Shirt cuff visible */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.04, 16]} />
          <primitive object={shirtMaterial} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[0.06, 0.08, 0.04]} />
          <primitive object={skinMaterial} attach="material" />
        </mesh>
      </group>

      {/* LEGS - Professional suit pants */}
      <group position={[-0.12, height - headHeight - torsoHeight - 0.12, 0]}>
        {/* Thigh */}
        <mesh position={[0, -legHeight * 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, legHeight * 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Knee area */}
        <mesh position={[0, -legHeight * 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.1, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Shank */}
        <mesh position={[0, -legHeight * 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, legHeight * 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -legHeight * 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Formal black leather shoe */}
        <group position={[0, -legHeight, 0.05]}>
          {/* Shoe base */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.06, 0.28]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
          {/* Shoe toe - Polished leather */}
          <mesh position={[0, 0.03, 0.12]} castShadow>
            <boxGeometry args={[0.12, 0.05, 0.1]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Shoe heel */}
          <mesh position={[0, -0.04, -0.1]} castShadow>
            <boxGeometry args={[0.1, 0.05, 0.08]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
        </group>
      </group>

      <group position={[0.12, height - headHeight - torsoHeight - 0.12, 0]}>
        {/* Thigh */}
        <mesh position={[0, -legHeight * 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, legHeight * 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Knee area */}
        <mesh position={[0, -legHeight * 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.1, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Shank */}
        <mesh position={[0, -legHeight * 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, legHeight * 0.5, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Ankle */}
        <mesh position={[0, -legHeight * 0.95, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 16]} />
          <primitive object={pantsMaterial} attach="material" />
        </mesh>
        {/* Formal black leather shoe */}
        <group position={[0, -legHeight, 0.05]}>
          {/* Shoe base */}
          <mesh castShadow>
            <boxGeometry args={[0.12, 0.06, 0.28]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
          {/* Shoe toe - Polished leather */}
          <mesh position={[0, 0.03, 0.12]} castShadow>
            <boxGeometry args={[0.12, 0.05, 0.1]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Shoe heel */}
          <mesh position={[0, -0.04, -0.1]} castShadow>
            <boxGeometry args={[0.1, 0.05, 0.08]} />
            <primitive object={shoeMaterial} attach="material" />
          </mesh>
        </group>
      </group>
    </group>
  )
}
