import React, { useState } from 'react'
import { motion } from 'framer-motion'
import './CinematicHero.css' // Reuse styles

export default function ContactSection() {
    return (
        <section className="contact-section" id="contact">
            <div className="contact-container">
                <div className="section-header">
                    <span className="section-label">GET IN TOUCH</span>
                    <h2 className="section-title-main">INITIATE <span>PROTOCOL</span></h2>
                </div>

                <div className="contact-info-grid">
                    <div className="contact-item">
                        <span className="contact-icon">📧</span>
                        <a href="mailto:contact@saarkaar.in" style={{ color: '#fff', textDecoration: 'none' }}>contact@saarkaar.in</a>
                    </div>
                    <div className="contact-item">
                        <span className="contact-icon">🔗</span>
                        <a href="https://linkedin.com/in/asifalam" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>/in/asifalam</a>
                        <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '10px' }}>(Professional)</span>
                    </div>
                    <div className="contact-item">
                        <span className="contact-icon">🐙</span>
                        <a href="https://github.com/asifalam" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none' }}>/asifalam</a>
                        <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '10px' }}>(Open Source)</span>
                    </div>
                    <div className="contact-item">
                        <span className="contact-icon">📅</span>
                        <a href="#" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Book 30min Discovery Call</a>
                    </div>
                </div>

                <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <input type="text" placeholder="NAME / ORGANIZATION" required />
                    </div>
                    <div className="form-group">
                        <input type="email" placeholder="COMMUNICATION CHANNEL (EMAIL)" required />
                    </div>
                    <div className="form-group">
                        <textarea rows="5" placeholder="MISSION OBJECTIVE (MESSAGE)" required></textarea>
                    </div>
                    <button className="primary-btn" style={{ width: '100%', marginTop: '1rem' }}>TRANSMIT MESSAGE</button>
                </form>
            </div>
        </section>
    )
}
