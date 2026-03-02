import React, { useRef, useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.esm'

function ParticleField({ mousePos }) {
    const ref = useRef()
    const sphere = random.inSphere(new Float32Array(3000), { radius: 12 })
    const { camera } = useThree()

    useFrame((state, delta) => {
        // Soft ambient rotation (slower, not distracting)
        ref.current.rotation.x -= delta / 30
        ref.current.rotation.y -= delta / 45

        // Subtle depth parallax based on mouse
        camera.position.x += (mousePos.x * 0.1 - camera.position.x) * 0.05
        camera.position.y += (-mousePos.y * 0.1 - camera.position.y) * 0.05
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#D4AF37"
                    size={0.015} /* Softer points */
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.6}
                />
            </Points>
        </group>
    )
}

export default function CinematicHero() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e) => {
        setMousePos({
            x: (e.clientX / window.innerWidth - 0.5) * 20,
            y: (e.clientY / window.innerHeight - 0.5) * 20
        })
    }

    return (
        <div className="section cin-hero" onMouseMove={handleMouseMove}>
            <div className="hero-bg-layer">
                <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                    <color attach="background" args={['#030303']} />
                    <ParticleField mousePos={mousePos} />
                </Canvas>
            </div>

            <motion.div
                className="hero-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
            >
                {/* 1. Tagline first */}
                <motion.div
                    className="hero-tagline-strip"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 1, ease: 'easeOut' }}
                >
                    <span className="auth-signal">SYSTEM STATUS: ONLINE</span>
                </motion.div>

                {/* 2. Main heading */}
                <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="hero-title-main"
                >
                    DIGITAL IDENTITY <br />
                    <span className="scramble-text pulse-glow">SAARKAAR</span>
                </motion.h1>

                {/* 3. Subheading */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0, duration: 1, ease: 'easeOut' }}
                    className="hero-subtitle-main"
                >
                    ARCHITECTING VIRTUAL ECOSYSTEMS
                </motion.p>

                {/* 4. Manifesto Line */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 1.5 }}
                    className="hero-manifesto"
                >
                    Not building websites. Engineering digital ecosystems.
                </motion.p>

                {/* Authority Strip (Phase 9) */}
                <motion.div
                    className="authority-signals-strip"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6, duration: 1.2 }}
                >
                    <span>AI Integrations: 15+</span>
                    <span className="dot-sep">•</span>
                    <span>Live Systems Deployed: 10+</span>
                    <span className="dot-sep">•</span>
                    <span>Hackathon Participant</span>
                    <span className="dot-sep">•</span>
                    <span>Full Stack + AI Architect</span>
                </motion.div>

                {/* 5. CTA Buttons */}
                <motion.div
                    className="cta-group"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                >
                    <button className="primary-btn cin-btn" onClick={() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' })}>
                        EXPLORE SYSTEMS
                    </button>
                    <button className="secondary-btn cin-btn" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                        INITIATE PROTOCOL
                    </button>
                </motion.div>
            </motion.div>
        </div>
    )
}
