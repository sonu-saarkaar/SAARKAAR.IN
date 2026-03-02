import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ResumeAccessModal from './ResumeAccessModal'

export default function ResumeSection() {
    const [isResumeModalOpen, setResumeModalOpen] = useState(false)

    return (
        <section
            id="resume"
            style={{
                width: '100%',
                padding: '4rem 2rem',
                backgroundColor: '#0a0a0a',
                borderTop: '1px solid rgba(212, 175, 55, 0.1)',
                borderBottom: '1px solid rgba(212, 175, 55, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '200px',
                background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 70%)',
                pointerEvents: 'none'
            }}></div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxWidth: '1200px',
                    background: 'rgba(15, 15, 15, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '3rem 4rem',
                    borderRadius: '12px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 2
                }}
            >
                <div>
                    <span style={{
                        color: '#D4AF37',
                        fontFamily: 'Rajdhani',
                        letterSpacing: '3px',
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '0.5rem'
                    }}>
                        SECURE DOCUMENTATION
                    </span>
                    <h2 style={{
                        margin: 0,
                        fontSize: '2.5rem',
                        color: '#fff',
                        fontFamily: 'Rajdhani',
                        textTransform: 'uppercase'
                    }}>
                        EXECUTIVE <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>RESUME</span>
                    </h2>
                    <p style={{ color: '#888', marginTop: '1rem', maxWidth: '500px', lineHeight: '1.6' }}>
                        Access to my detailed engineering timeline, AI system architectures, and government tech deployments is access-controlled. You must request security clearance to download.
                    </p>
                </div>

                <div>
                    <button
                        onClick={() => setResumeModalOpen(true)}
                        style={{
                            background: 'linear-gradient(90deg, #D4AF37, #f3d473)',
                            color: '#000',
                            border: 'none',
                            padding: '16px 32px',
                            fontSize: '1rem',
                            fontFamily: 'Inter',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.05)'
                            e.target.style.boxShadow = '0 0 30px rgba(212, 175, 55, 0.6)'
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)'
                            e.target.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.4)'
                        }}
                    >
                        <span>🔒</span> REQUEST CLEARANCE
                    </button>
                </div>
            </motion.div>

            <ResumeAccessModal
                isOpen={isResumeModalOpen}
                onClose={() => setResumeModalOpen(false)}
            />
        </section>
    )
}
