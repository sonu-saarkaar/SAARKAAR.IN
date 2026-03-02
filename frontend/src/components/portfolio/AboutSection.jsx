import React, { useState } from 'react'
import { motion } from 'framer-motion'
import './CinematicHero.css' // Reusing styles
import ResumeAccessModal from './ResumeAccessModal'

export default function AboutSection() {
    const [isResumeModalOpen, setResumeModalOpen] = useState(false)

    const stats = [
        { label: 'Projects Built', value: '25+' },
        { label: 'Systems Deployed', value: '10+' },
        { label: 'AI Integrations', value: '15+' },
        { label: 'Years Experience', value: '5+' },
    ]

    return (
        <section className="about-section" id="about">
            <div className="section-header">
                <span className="section-label">THE ARCHITECT</span>
                <h2 className="section-title-main">FOUNDER <span>PROFILE</span></h2>
            </div>

            <div className="about-grid">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="about-text"
                >
                    <h3 style={{ color: '#D4AF37', fontFamily: 'Rajdhani', fontSize: '2rem', marginBottom: '1rem' }}>
                        ASIF ALAM
                    </h3>
                    <p>
                        I am an <strong>AI Systems Architect</strong> and <strong>Full Stack Developer</strong> obsessed with building scalable digital ecosystems.
                        My work bridges the gap between complex backend logic and immersive frontend experiences.
                    </p>

                    <div className="founder-philosophy-block" style={{ marginTop: '2.5rem', marginBottom: '2.5rem', paddingLeft: '1.5rem', borderLeft: '2px solid #00f5d4' }}>
                        <h4 style={{ color: '#00f5d4', fontFamily: 'Courier New, monospace', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>
                            Why I Build Systems
                        </h4>
                        <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
                            To solve complexity, not just manage it. Making digital systems intuitive means engineering absolute clarity from complete chaos.
                        </p>
                    </div>

                    <div className="tech-stack-mini" style={{ marginTop: '2rem' }}>
                        {['Python', 'React', 'Three.js', 'FastAPI', 'AWS', 'TensorFlow'].map(tech => (
                            <span key={tech} className="tech-pill">{tech}</span>
                        ))}
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <button
                            className="primary-btn"
                            style={{
                                padding: '12px 24px',
                                border: '1px solid #D4AF37',
                                background: 'transparent',
                                color: '#D4AF37'
                            }}
                            onClick={() => setResumeModalOpen(true)}
                        >
                            <span style={{ marginRight: '8px' }}>📑</span> SECURE RESUME ACCESS
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="about-stats"
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="stat-item">
                            <div className="stat-number">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <ResumeAccessModal
                isOpen={isResumeModalOpen}
                onClose={() => setResumeModalOpen(false)}
            />
        </section>
    )
}
