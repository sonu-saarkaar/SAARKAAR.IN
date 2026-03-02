import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Sparkles } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'

function MovingStars() {
    const starsRef = useRef()
    useFrame((state, delta) => {
        if (starsRef.current) {
            starsRef.current.rotation.y += delta * 0.05
            starsRef.current.rotation.x += delta * 0.02
        }
    })
    return <Stars ref={starsRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
}

export default function StarBackground() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Canvas camera={{ position: [0, 0, 1] }}>
                <Suspense fallback={null}>
                    <color attach="background" args={['#050505']} />
                    <fog attach="fog" args={['#050505', 5, 30]} />
                    <MovingStars />
                    <Sparkles count={200} scale={12} size={4} speed={0.4} opacity={0.5} color="#00ffff" />
                </Suspense>
            </Canvas>
        </div>
    )
}
