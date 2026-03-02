import React from 'react'
import './CinematicHero.css' // Reuse styles

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="section-header" style={{ marginBottom: '1rem', borderTop: '1px solid #222', paddingTop: '2rem' }}>
                <span className="section-label" style={{ fontSize: '0.7rem' }}>SYSTEM TERMINATED</span>
            </div>

            <div className="footer-links">
                <a href="#about">About</a>
                <a href="#projects">Work</a>
                <a href="#services">Services</a>
                <a href="#contact">Contact</a>
            </div>

            <div style={{ opacity: 0.6 }}>
                &copy; {new Date().getFullYear()} SAARKAAR.IN. Architected by Asif Alam.
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#444' }}>
                Powered by React, Three.js, FastAPI & OpenAI
            </div>
        </footer>
    )
}
