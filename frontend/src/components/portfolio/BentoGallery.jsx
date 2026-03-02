import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BentoGallery.css'

const categories = ['All', 'UI Screens', 'Architecture', 'Backend Systems', 'AI Flow', 'Mobile']

const mockImages = [
    {
        id: 1,
        src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
        category: 'Backend Systems',
        title: 'Server Infrastructure Matrix',
        tagline: 'High-availability cluster deployed for government tech.',
        description: 'A comprehensive visual of the distributed node architecture ensuring 99.99% uptime for secured communications.',
        tech_stack: ['AWS', 'Kubernetes', 'Docker'],
        size: 'hero'
    },
    {
        id: 2,
        src: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=800',
        category: 'Mobile',
        title: 'Secure Comms Terminal',
        tagline: 'Encrypted field communication.',
        description: 'End-to-end encrypted mobile terminal interface used by field agents.',
        tech_stack: ['React Native', 'WebRTC'],
        size: 'medium'
    },
    {
        id: 3,
        src: 'https://images.unsplash.com/photo-1618477247222-ac60c62187f4?auto=format&fit=crop&q=80&w=800',
        category: 'UI Screens',
        title: 'Command Data Flow',
        tagline: 'Real-time analytics dashboard.',
        description: 'Centralized command center dashboard tracking real-time anomalies and system integrity.',
        tech_stack: ['React', 'D3.js'],
        size: 'medium'
    },
    {
        id: 4,
        src: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800',
        category: 'Architecture',
        title: 'Encrypted Data Lake',
        tagline: 'Secure cold storage.',
        description: 'Architectural blueprint of the multi-layered encryption data lake for sensitive intelligence.',
        tech_stack: ['Python', 'PostgreSQL'],
        size: 'tall'
    },
    {
        id: 5,
        src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
        category: 'AI Flow',
        title: 'Neural Activation',
        tagline: 'Deep learning pipeline.',
        description: 'Visualization of the active neural pathways during predictive modeling tasks.',
        tech_stack: ['TensorFlow', 'PyTorch'],
        size: 'small'
    },
    {
        id: 6,
        src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
        category: 'Architecture',
        title: 'Global Topology',
        tagline: 'Cross-region network mapping.',
        description: 'Interactive map displaying global server topologies and latency routing.',
        tech_stack: ['Terraform', 'GCP'],
        size: 'small'
    },
    {
        id: 7,
        src: 'https://images.unsplash.com/photo-1620712948343-008423bb0d6d?auto=format&fit=crop&q=80&w=1200',
        category: 'UI Screens',
        title: 'Analytics Command',
        tagline: 'Predictive analytics interface.',
        description: 'High-level predictive UI designed for immediate threat identification.',
        tech_stack: ['Next.js', 'WebGL'],
        size: 'wide'
    }
]

// Parallax Image Component
const BentoImageTile = ({ img, onClick }) => {
    const tileRef = useRef(null)
    const [backgroundPos, setBackgroundPos] = useState({ x: 50, y: 50 }) // Percentages

    const handleMouseMove = (e) => {
        if (!tileRef.current) return
        const { left, top, width, height } = tileRef.current.getBoundingClientRect()
        const xVal = ((e.clientX - left) / width) * 100
        const yVal = ((e.clientY - top) / height) * 100

        // We limit parallax to subtle movement (Math mapping)
        // Shift range roughly 45% to 55% instead of 0 to 100
        const clampedX = 48 + (xVal * 0.04)
        const clampedY = 48 + (yVal * 0.04)

        setBackgroundPos({ x: clampedX, y: clampedY })
    }

    const handleMouseLeave = () => {
        setBackgroundPos({ x: 50, y: 50 }) // Reset to center
    }

    return (
        <motion.div
            layout
            ref={tileRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className={`bento-tile ${img.size}`}
            onClick={() => onClick(img)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: 1.04, transition: { duration: 0.3, ease: 'easeOut' } }}
        >
            <div className="bento-tile-inner">
                <div
                    className="bento-parallax-img"
                    style={{
                        backgroundImage: `url(${img.src})`,
                        backgroundPosition: `${backgroundPos.x}% ${backgroundPos.y}%`
                    }}
                />
                <div className="bento-tile-overlay">
                    <div className="bento-tile-content">
                        <span className="bento-tag">{img.category}</span>
                        <h3 className="bento-tile-title">{img.title}</h3>
                        {img.size === 'hero' && (
                            <p className="bento-tagline">{img.tagline}</p>
                        )}
                        <span className="bento-cta">View Intelligence <span className="arrow">→</span></span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function BentoGallery() {
    const [activeFilter, setActiveFilter] = useState('All')
    const [filteredImages, setFilteredImages] = useState(mockImages)

    // Modal State
    const [selectedImage, setSelectedImage] = useState(null)
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
        if (activeFilter === 'All') {
            setFilteredImages(mockImages)
        } else {
            setFilteredImages(mockImages.filter(img => img.category === activeFilter))
        }
    }, [activeFilter])

    const openModal = (img) => {
        const idx = filteredImages.findIndex(i => i.id === img.id)
        setSelectedImage(img)
        setSelectedIndex(idx)
        document.body.style.overflow = 'hidden'
    }

    const closeModal = () => {
        setSelectedImage(null)
        document.body.style.overflow = 'auto'
    }

    const navigateModal = (direction) => {
        let newIndex = selectedIndex + direction
        if (newIndex < 0) newIndex = filteredImages.length - 1
        if (newIndex >= filteredImages.length) newIndex = 0
        setSelectedIndex(newIndex)
        setSelectedImage(filteredImages[newIndex])
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedImage) return
            if (e.key === 'ArrowRight') navigateModal(1)
            if (e.key === 'ArrowLeft') navigateModal(-1)
            if (e.key === 'Escape') closeModal()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedImage, selectedIndex, filteredImages])

    return (
        <section className="bento-system-section" id="visual-archive">
            <div className="bento-sys-header">
                <span className="sys-label">DEPLOYED ASSETS</span>
                <h2 className="sys-title">VISUAL INTELLIGENCE <span>ARCHIVE</span></h2>
                <p className="sys-desc">Secured architectural blueprints, component topologies, and UI terminals.</p>
            </div>

            <div className="sys-filters">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`sys-filter-btn ${activeFilter === cat ? 'active' : ''}`}
                        onClick={() => setActiveFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <motion.div layout className="bento-sys-grid" transition={{ duration: 0.5 }}>
                <AnimatePresence>
                    {filteredImages.map((img) => (
                        <BentoImageTile key={img.id} img={img} onClick={openModal} />
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* FULLSCREEN IMMERSIVE MODAL */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="sys-modal-overlay"
                        onClick={closeModal}
                    >
                        <button className="sys-modal-close" onClick={closeModal}>×</button>

                        <div className="sys-modal-content" onClick={e => e.stopPropagation()}>
                            <button className="sys-nav-btn left" onClick={() => navigateModal(-1)}>‹</button>

                            <motion.div
                                key={selectedImage.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="sys-modal-core"
                            >
                                <div className="sys-modal-visual">
                                    <img src={selectedImage.src} alt={selectedImage.title} className="sys-modal-img" />
                                </div>

                                <div className="sys-modal-panel">
                                    <span className="sys-modal-cat">{selectedImage.category}</span>
                                    <h2 className="sys-modal-title">{selectedImage.title}</h2>
                                    <p className="sys-modal-desc">{selectedImage.description}</p>

                                    <div className="sys-tech-stack">
                                        {selectedImage.tech_stack.map(tech => (
                                            <span key={tech} className="sys-tech-tag">{tech}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            <button className="sys-nav-btn right" onClick={() => navigateModal(1)}>›</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
