import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './CinematicIntro.css'

export default function CinematicIntro({ onComplete }) {
    const [step, setStep] = useState(0)

    useEffect(() => {
        // Step 1: System Boot Sound
        const bootSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-system-boot-2465.mp3")
        bootSound.volume = 0.5
        bootSound.play().catch(e => console.log("Audio autoplay constrained"))

        // Timeline
        const timeouts = [
            setTimeout(() => setStep(1), 1000), // "INITIALIZING..."
            setTimeout(() => setStep(2), 2500), // "ESTABLISHING LINK..."
            setTimeout(() => setStep(3), 4000), // "WELCOME, FOUNDER"
            setTimeout(() => setStep(4), 5500)  // "User must click to enter"
        ]

        return () => timeouts.forEach(clearTimeout)
    }, [onComplete])

    return (
        <AnimatePresence>
            <motion.div
                className="cinematic-intro"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 1.5 } }}
            >
                <div className="particles-layer"></div>

                <motion.div className="intro-text-container">
                    {step >= 1 && (
                        <motion.h1
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.8 }}
                            className="intro-text"
                        >
                            INITIALIZING SAARKAAR...
                        </motion.h1>
                    )}

                    {step >= 2 && (
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '200px' }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            className="loading-bar"
                        >
                            <div className="loading-fill"></div>
                        </motion.div>
                    )}

                    {step >= 3 && (
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="intro-subtext"
                        >
                            SYSTEMS ONLINE
                        </motion.h2>
                    )}

                    {step >= 4 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            onClick={onComplete}
                            className="intro-enter-btn"
                        >
                            ENTER PORTFOLIO
                        </motion.button>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
