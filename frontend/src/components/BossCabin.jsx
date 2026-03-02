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
      // Gentle subtle breathing/head movement
      founderRef.current.rotation.y = Math.sin(time * 0.3) * 0.05
    }

    // Check if user enters cabin
    const distance = new THREE.Vector3(...userPosition).distanceTo(
      new THREE.Vector3(...position)
    )
    if (distance < 2.5 && !useExperienceStore.getState().isInOffice) {
      setInOffice(true)
    }
  })

  // ---- PREMIUM MATERIALS ----
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#aaccff',
    transparent: true,
    opacity: 0.2,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.95,
    thickness: 0.8,
  })

  const blackMetalMaterial = new THREE.MeshStandardMaterial({
    color: '#0a0a0c',
    roughness: 0.2,
    metalness: 0.9,
  })

  const goldAccentMaterial = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    roughness: 0.15,
    metalness: 1.0,
  })

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: '#1e0f08', // very dark rich mahogany/espresso wood
    roughness: 0.4,
    metalness: 0.1,
  })

  const glossyMarbleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#111', // dark marble
    roughness: 0.05,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  })

  const floorMarbleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#1a1a1a',
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1
  })

  const premiumLeatherMaterial = new THREE.MeshStandardMaterial({
    color: '#1c1918', // rich charcoal/brown black leather
    roughness: 0.6,
    metalness: 0.1,
  })

  const whiteLeatherMaterial = new THREE.MeshStandardMaterial({
    color: '#f0f0f0',
    roughness: 0.5,
    metalness: 0.05,
  })

  return (
    <group position={position}>
      {/* ---------------- ROOM STRUCTURE ---------------- */}

      {/* Premium Dark Marble Floor */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[6, 0.02, 4]} />
        <primitive object={floorMarbleMaterial} attach="material" />
      </mesh>

      {/* Premium Ceiling */}
      <mesh position={[0, 3.9, 0]} receiveShadow>
        <boxGeometry args={[6, 0.2, 4]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Ceiling LED strips */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={`led-${i}`} position={[x, 3.79, 0]} receiveShadow>
          <boxGeometry args={[0.05, 0.02, 3.8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
        </mesh>
      ))}

      {/* Glass Walls - Front */}
      <mesh position={[0, 2, 2]}>
        <boxGeometry args={[6, 4, 0.05]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Glass Walls - Side */}
      <mesh position={[-3, 2, 0]}>
        <boxGeometry args={[0.05, 4, 4]} />
        <primitive object={glassMaterial} attach="material" />
      </mesh>

      {/* Pillars to frame the glass instead of a solid box that obscures it */}
      <mesh position={[-3, 2, 2]} receiveShadow>
        <boxGeometry args={[0.1, 4, 0.1]} />
        <primitive object={blackMetalMaterial} attach="material" />
      </mesh>
      <mesh position={[3, 2, 2]} receiveShadow>
        <boxGeometry args={[0.1, 4, 0.1]} />
        <primitive object={blackMetalMaterial} attach="material" />
      </mesh>
      <mesh position={[-3, 2, -2]} receiveShadow>
        <boxGeometry args={[0.1, 4, 0.1]} />
        <primitive object={blackMetalMaterial} attach="material" />
      </mesh>

      {/* Solid Back Wall */}
      <mesh position={[0, 2, -2]} receiveShadow>
        <boxGeometry args={[6, 4, 0.1]} />
        <meshStandardMaterial color="#111115" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Solid Right Wall (with wooden acoustic panels) */}
      <mesh position={[3, 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, 4, 4]} />
        <primitive object={darkWoodMaterial} attach="material" />
      </mesh>
      {/* Vertical Wood Slats on Right Wall */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={`slat-${i}`} position={[2.92, 2, -1.8 + i * 0.27]}>
          <boxGeometry args={[0.05, 4, 0.1]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>
      ))}

      {/* SAARKAAR Wall Logo - Executive branding - glowing */}
      <group position={[-2.8, 2.5, -1]}>
        <SaarkaarLogo size={0.6} style="wall" />
      </group>


      {/* ---------------- PREMIUM EXECUTIVE DESK & TECH ---------------- */}
      <group position={[0.5, 0, -1]}>
        {/* Desk base/legs */}
        <mesh position={[-1.6, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.9, 1.4]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        <mesh position={[1.6, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.9, 1.4]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        {/* Central Privacy panel */}
        <mesh position={[0, 0.5, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.8, 0.05]} />
          <primitive object={darkWoodMaterial} attach="material" />
        </mesh>

        {/* Desk top (Premium Glossy Marble) */}
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.1, 1.6]} />
          <primitive object={glossyMarbleMaterial} attach="material" />
        </mesh>

        {/* Desk Gold Trim */}
        <mesh position={[0, 0.9, 0]} receiveShadow>
          <boxGeometry args={[3.85, 0.02, 1.65]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>

        {/* --- Multi-Monitor Tech Setup --- */}
        {/* Main curved ultrawide monitor */}
        <group position={[0, 1.3, 0.2]}>
          {/* Stand base */}
          <mesh position={[0, -0.3, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 32]} />
            <primitive object={blackMetalMaterial} attach="material" />
          </mesh>
          <mesh position={[0, -0.15, -0.05]} castShadow rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.05, 0.35, 0.05]} />
            <primitive object={blackMetalMaterial} attach="material" />
          </mesh>
          {/* Screen */}
          <mesh castShadow rotation={[0, 0, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 0.6, 64, 1, false, Math.PI * 1.35, Math.PI * 0.3]} />
            <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Display glowing area */}
          <mesh position={[0, 0, -0.01]} receiveShadow>
            <cylinderGeometry args={[1.49, 1.49, 0.58, 64, 1, false, Math.PI * 1.355, Math.PI * 0.29]} />
            <meshStandardMaterial color="#001122" emissive="#002244" emissiveIntensity={0.8} />
          </mesh>

          {/* Holographic glowing charts on screen */}
          <mesh position={[-0.4, 0, -1.45]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.01]} />
            <meshBasicMaterial color="#00ff88" opacity={0.7} transparent />
          </mesh>
          <mesh position={[0.4, 0, -1.45]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.3, 0.01]} />
            <meshBasicMaterial color="#0088ff" opacity={0.7} transparent />
          </mesh>
        </group>

        {/* Premium Laptop */}
        <group position={[-1.2, 1.0, 0.2]} rotation={[0, 0.4, 0]}>
          <mesh castShadow position={[0, 0.01, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.3]} />
            <primitive object={blackMetalMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.15, -0.15]} rotation={[-0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.3, 0.02]} />
            <primitive object={blackMetalMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.15, -0.14]} rotation={[-0.3, 0, 0]} receiveShadow>
            <boxGeometry args={[0.38, 0.28, 0.01]} />
            <meshStandardMaterial color="#001122" emissive="#003366" emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* Desk accessories */}
        {/* Coffee Mug */}
        <mesh position={[1.2, 1.05, 0.3]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 32]} />
          <meshStandardMaterial color="#111" roughness={0.1} />
        </mesh>

        {/* SAARKAAR Desk Nameplate Premium */}
        <group position={[1.5, 1.05, 0.6]}>
          <mesh position={[0, 0, 0]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.4, 0.15, 0.05]} />
            <primitive object={goldAccentMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0.03]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.38, 0.13, 0.02]} />
            <primitive object={glossyMarbleMaterial} attach="material" />
          </mesh>
        </group>
      </group>


      {/* ---------------- BOSS (FOUNDER) IN SUIT ---------------- */}
      <group ref={founderRef} position={[0.5, 1, -1.8]}>
        {/* Head */}
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.16, 32, 32]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.4} />
        </mesh>
        {/* Formal Hair */}
        <mesh position={[0, 0.86, -0.02]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* Proper Formal Suit Body */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.5, 0.55, 0.3]} />
          <meshStandardMaterial color="#121215" roughness={0.7} /> {/* Black/Dark Navy Suit */}
        </mesh>
        {/* White Shirt Insert */}
        <mesh position={[0, 0.45, 0.16]}>
          <boxGeometry args={[0.15, 0.3, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        {/* Tie */}
        <mesh position={[0, 0.4, 0.175]}>
          <boxGeometry args={[0.04, 0.28, 0.01]} />
          <meshStandardMaterial color="#990000" roughness={0.5} /> {/* Red Power Tie */}
        </mesh>

        {/* Arms in Suit (Resting on armrests) */}
        <mesh position={[-0.3, 0.4, 0.1]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#121215" roughness={0.7} />
        </mesh>
        <mesh position={[0.3, 0.4, 0.1]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#121215" roughness={0.7} />
        </mesh>

        {/* Hands */}
        <mesh position={[-0.3, 0.22, 0.25]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.4} />
        </mesh>
        <mesh position={[0.3, 0.22, 0.25]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#fdbcb4" roughness={0.4} />
        </mesh>

        {/* Legs in Suit Pants */}
        <mesh position={[-0.15, -0.1, 0.15]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.18, 0.45, 0.2]} />
          <meshStandardMaterial color="#121215" roughness={0.8} />
        </mesh>
        <mesh position={[0.15, -0.1, 0.15]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.18, 0.45, 0.2]} />
          <meshStandardMaterial color="#121215" roughness={0.8} />
        </mesh>

        {/* Dress Shoes */}
        <mesh position={[-0.15, -0.35, 0.25]}>
          <boxGeometry args={[0.16, 0.1, 0.25]} />
          <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} /> {/* Glossy leather */}
        </mesh>
        <mesh position={[0.15, -0.35, 0.25]}>
          <boxGeometry args={[0.16, 0.1, 0.25]} />
          <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.8} />
        </mesh>
      </group>


      {/* ---------------- EXECUTIVE CHAIR ---------------- */}
      <group position={[0.5, 0, -1.9]}>
        {/* Base star */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 5]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>
        {/* Gas lift cylinder */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        {/* Seat cushion */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.15, 0.65]} />
          <primitive object={premiumLeatherMaterial} attach="material" />
        </mesh>
        {/* High Backrest */}
        <mesh position={[0, 1.3, -0.28]} castShadow receiveShadow>
          <boxGeometry args={[0.65, 1.1, 0.15]} />
          <primitive object={premiumLeatherMaterial} attach="material" />
        </mesh>
        {/* Armrests */}
        <mesh position={[-0.38, 0.95, -0.05]} castShadow>
          <boxGeometry args={[0.08, 0.05, 0.4]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        <mesh position={[0.38, 0.95, -0.05]} castShadow>
          <boxGeometry args={[0.08, 0.05, 0.4]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        {/* Armrest supports */}
        <mesh position={[-0.38, 0.85, -0.2]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>
        <mesh position={[0.38, 0.85, -0.2]} castShadow>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>
      </group>


      {/* ---------------- MEETING & LOUNGE AREA ---------------- */}

      {/* Premium Sofa (L-Shaped or Wide U) */}
      <group position={[-1.8, 0, 0.5]}>
        {/* Main Seat */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.4, 0.9]} />
          <primitive object={whiteLeatherMaterial} attach="material" />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.6, -0.35]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.6, 0.2]} />
          <primitive object={whiteLeatherMaterial} attach="material" />
        </mesh>
        {/* Left Arm */}
        <mesh position={[-0.9, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.5, 0.9]} />
          <primitive object={whiteLeatherMaterial} attach="material" />
        </mesh>
        {/* Right Arm / Chaise extension */}
        <mesh position={[0.9, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.5, 0.9]} />
          <primitive object={whiteLeatherMaterial} attach="material" />
        </mesh>
        {/* Metallic legs */}
        {[-0.9, 0.9].map((x) => (
          [-0.3, 0.3].map((z) => (
            <mesh key={`leg-${x}-${z}`} position={[x, 0.05, z]} castShadow>
              <cylinderGeometry args={[0.03, 0.02, 0.1, 8]} />
              <primitive object={goldAccentMaterial} attach="material" />
            </mesh>
          ))
        ))}
      </group>

      {/* Premium Meeting/Coffee Table */}
      <group position={[-1.8, 0, 1.4]}>
        {/* Table base - modern architectural */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.4, 0.4, 32]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        {/* Marble Table Top */}
        <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.04, 64]} />
          <primitive object={glossyMarbleMaterial} attach="material" />
        </mesh>
        {/* Gold Rim */}
        <mesh position={[0, 0.41, 0]} receiveShadow>
          <cylinderGeometry args={[0.72, 0.72, 0.02, 64]} />
          <primitive object={goldAccentMaterial} attach="material" />
        </mesh>
      </group>

      {/* Secondary Lounge Chairs for guests */}
      {[[-2.6, 1.8, 0.8], [-1.0, 1.8, -0.8]].map((pos, idx) => (
        <group key={`chair-${idx}`} position={[pos[0], 0, pos[1]]} rotation={[0, pos[2], 0]}>
          <mesh position={[0, 0.15, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.2, 0.3, 16]} />
            <primitive object={goldAccentMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.15, 0.6]} />
            <primitive object={whiteLeatherMaterial} attach="material" />
          </mesh>
          <mesh position={[0, 0.6, -0.22]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.5, 0.15]} />
            <primitive object={whiteLeatherMaterial} attach="material" />
          </mesh>
        </group>
      ))}

      {/* Modern Floor Lamp next to sofa */}
      <group position={[-2.8, 0, -0.2]}>
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.05, 2, 16]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 2, 0]} castShadow>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffddaa" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 2.05, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.35, 0.3, 32]} openEnded={true} />
          <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 1.9, 0]} intensity={1.5} distance={3} color="#ffddaa" />
      </group>

      {/* Wall-mounted Large Presentation Display */}
      <group position={[-2.94, 1.8, 1.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.4, 1.4, 0.05]} />
          <primitive object={blackMetalMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.03]} receiveShadow>
          <boxGeometry args={[2.3, 1.3, 0.01]} />
          <meshStandardMaterial color="#001a33" emissive="#003366" emissiveIntensity={0.5} />
        </mesh>
        {/* Presentation Content simulation */}
        <mesh position={[-0.6, 0.3, 0.035]} receiveShadow>
          <boxGeometry args={[0.8, 0.4, 0.005]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
        <mesh position={[0.5, -0.2, 0.035]} receiveShadow>
          <boxGeometry args={[1.0, 0.6, 0.005]} />
          <meshBasicMaterial color="#0099ff" />
        </mesh>
      </group>

      {/* Decorative Indoor Plant */}
      <group position={[2.5, 0, -1.5]}>
        {/* Pot */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.5, 32]} />
          <primitive object={glossyMarbleMaterial} attach="material" />
        </mesh>
        {/* Plant base/dirt */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 0.02, 32]} />
          <meshStandardMaterial color="#2d1b11" />
        </mesh>
        {/* Leaves */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={`leaf-${i}`} position={[0, 0.8 + i * 0.1, 0]} rotation={[i % 2 * 0.5, i * Math.PI / 3, 0.2]} castShadow>
            <boxGeometry args={[0.8, 0.02, 0.2]} />
            <meshStandardMaterial color="#1a4d2e" roughness={0.4} />
          </mesh>
        ))}
      </group>


      {/* ---------------- PREMIUM LIGHTING ---------------- */}
      {/* Ambient glowing ceiling light */}
      <pointLight position={[0, 3.5, 0]} intensity={2.0} color="#ffffff" distance={6} />

      {/* Dramatic SpotLight for Boss Desk area */}
      <spotLight
        position={[0, 3.8, -1]}
        target-position={[0, 0, -1]}
        intensity={3.5}
        angle={0.6}
        penumbra={0.5}
        color="#ffffff"
        castShadow
      />
      {/* Reference point for target */}
      <mesh position={[0, 0, -1]} visible={false} name="boss-spot-target">
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>

      {/* Subtle warm light for the lounge area */}
      <pointLight position={[-1.8, 2, 1.5]} intensity={1.5} color="#ffd4a3" distance={4} />

    </group>
  )
}
