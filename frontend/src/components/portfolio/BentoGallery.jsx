import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './BentoGallery.css'

const ARCHIVE_DIRECTORIES = [
    { id: 'Journey', label: 'Timeline', desc: 'The Origin Story' },
    { id: 'Achievements', label: 'Achievements', desc: 'Awards & Certifications' },
    { id: 'Projects', label: 'Projects', desc: 'Builds & Executions' },
    { id: 'Dreams', label: 'Visions', desc: 'Unstoppable Dreams' },
    { id: 'Lifestyle', label: 'Lifestyle', desc: 'Aesthetics & Grind' },
    { id: 'Skills', label: 'Skills', desc: 'Technical Arsenal' }
]

const DATA = {
    Journey: {
        'Genesis': [
            { id: '1', title: "Born", date: "25 Aug 2005", desc: "The beginning of the timeline.", type: "start" }
        ],
        'Early Education': [
            { id: '2', title: "Quraisa High School Semrahiya", date: "2008 - 2012", desc: "Nursery to 1st Standard.", type: "school" },
            { id: '3', title: "St Xavier's High School Motihari", date: "2012 - 2018", desc: "2nd to 7th Standard. Building the foundation.", type: "school" }
        ],
        'High School': [
            { id: '4', title: "Emmanuel School Motihari", date: "2017 - 2020", desc: "8th to 10th Standard. Affiliated to The Trident Public School Muzaffarpur.", type: "school" },
            { id: '5', title: "CMJ Institute of Education Motihari Bankat", date: "2020 - 2022", desc: "11th to 12th Standard.", type: "college" }
        ],
        'The Grind': [
            { id: '6', title: "Allen Career Institute Kota", date: "2023 - 2024", desc: "1 Year dedicated to JEE Preparation. The Kota grind.", type: "kota" }
        ],
        'Engineering Era': [
            { id: '7', title: "Parul University", date: "2024 - 2028 (Running)", desc: "B.Tech CSE. The engineering era.", type: "university" }
        ]
    },
    Achievements: {
        'Hackathons': [
            { title: 'Hackathon Winner', date: '2023', details: 'Secured 1st position in national level hackathon for building an AI-driven platform.', img: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&q=80&w=800' }
        ],
        'Awards': [
            { title: 'Outstanding Developer Award', date: '2022', details: 'Recognized for contributing highly scalable open-source backend architectures.', img: 'https://images.unsplash.com/photo-1541844053589-346841d0b34c?auto=format&fit=crop&q=80&w=800' }
        ],
        'Certifications': [
            { title: 'Certification of Excellence', date: '2024', details: 'Advanced Web Architecture & Systems Design Certification.', img: 'https://images.unsplash.com/photo-1589330694653-efa6475304af?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    Projects: {
        'SaaS & Web': [
            { title: 'SAARKAAR OS', date: '2026', details: 'Enterprise-grade personal virtual office and AI platform.', img: 'https://images.unsplash.com/photo-1618477247222-ac3bb45dbdb8?auto=format&fit=crop&q=80&w=800' },
            { title: 'E-Commerce Nexus', date: '2024', details: 'Full-stack next-gen e-commerce platform with microservices.', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800' }
        ],
        'AI Systems': [
            { title: 'Neural Architect', date: '2025', details: 'LLM context engine built with Python and Vector Databases.', img: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800' }
        ],
        'Open Source': [
            { title: 'React Terminal UI', date: '2023', details: 'Futuristic command line interface component for React.', img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800' }
        ]
    },
    Dreams: [
        { title: 'The Garage', img: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?auto=format&fit=crop&q=80&w=800', desc: 'A hypercar collection. The ultimate drive.' },
        { title: 'The Superbike', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', desc: 'Speed. Freedom. Adrenaline.' },
        { title: 'The Bungalow', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800', desc: 'A quiet, modern architectural masterpiece.' }
    ],
    Lifestyle: [
        { title: 'Workstation', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800' },
        { title: 'Exploration', img: 'https://images.unsplash.com/photo-1504609774640-305de12ea8f1?auto=format&fit=crop&q=80&w=800' },
        { title: 'The Grind', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800' },
        { title: 'Aesthetics', img: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=800' }
    ],
    Skills: {
        'Frontend': ['React', 'Next.js', 'Three.js / React Three Fiber', 'TailwindCSS', 'Framer Motion'],
        'Backend': ['Node.js', 'Python', 'FastAPI', 'Express', 'WebSockets'],
        'Database': ['MongoDB', 'PostgreSQL', 'Redis', 'Vector DBs'],
        'Marketing': ['SEO Optimization', 'Growth Hacking', 'Product Strategy', 'UI/UX Conversion'],
        'Basic': ['C / C++', 'Java', 'Git/GitHub', 'Linux Setup']
    }
}

const MassiveFolderSVG = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="huge-folder-icon">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
)

const getFolderSVG = (name) => {
    const lName = name.toLowerCase();
    if (lName.includes('genesis')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    if (lName.includes('early')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>;
    if (lName.includes('high')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>;
    if (lName.includes('grind')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    if (lName.includes('engineering')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" /></svg>;

    if (lName.includes('hack')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
    if (lName.includes('award')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>;
    if (lName.includes('certif')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" ry="2" /><path d="M8 21v-2a4 4 0 0 1 8 0v2" /></svg>;

    if (lName.includes('saas') || lName.includes('web')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
    if (lName.includes('ai')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>;
    if (lName.includes('open')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>;

    if (lName.includes('front')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>;
    if (lName.includes('back')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>;
    if (lName.includes('data')) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;

    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
}

export default function BentoGallery() {
    const [activeDirectory, setActiveDirectory] = useState(null)
    const [activeSubFolder, setActiveSubFolder] = useState(null)
    const [modalData, setModalData] = useState(null)

    const renderFolders = () => (
        <div className="massive-folders-grid">
            {ARCHIVE_DIRECTORIES.map((dir, i) => (
                <motion.div
                    className="massive-folder-card"
                    key={dir.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => {
                        setActiveDirectory(dir.id)
                        setActiveSubFolder(null)
                    }}
                >
                    <div className="massive-folder-icon-wrapper">
                        <MassiveFolderSVG />
                    </div>
                    <div className="massive-folder-meta">
                        <h3>{dir.label}</h3>
                        <p>{dir.desc}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    )

    const renderSubFolderExplorer = (categoryData, renderPayload) => {
        if (!activeSubFolder) {
            return (
                <div className="skill-folders-grid">
                    {Object.keys(categoryData).map((folderName, i) => (
                        <motion.div
                            className="folder-icon-card"
                            key={folderName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => setActiveSubFolder(folderName)}
                        >
                            <div className="folder-svg">
                                {getFolderSVG(folderName)}
                            </div>
                            <span>{folderName}</span>
                        </motion.div>
                    ))}
                </div>
            )
        }

        return (
            <motion.div
                className="skill-contents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <button className="back-folder-btn" onClick={() => setActiveSubFolder(null)}>
                    ← Back to Folders
                </button>
                <h3 className="section-title">📂 {activeSubFolder}</h3>
                <div className="subfolder-payload-wrapper">
                    {renderPayload(categoryData[activeSubFolder])}
                </div>
            </motion.div>
        )
    }

    const renderContent = () => {
        switch (activeDirectory) {
            case 'Journey': {
                const keys = Object.keys(DATA.Journey);

                const getSineWavePath = (count) => {
                    let d = `M 190 140`;
                    for (let i = 0; i < count - 1; i++) {
                        const x1 = 190 + i * 360;
                        const y1 = i % 2 === 0 ? 140 : 420;
                        const x2 = 190 + (i + 1) * 360;
                        const y2 = (i + 1) % 2 === 0 ? 140 : 420;
                        const cx1 = x1 + 180;
                        const cy1 = y1;
                        const cx2 = x2 - 180;
                        const cy2 = y2;
                        d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                    }
                    return d;
                };

                return (
                    <div className="journey-3d-ladder-wrapper">
                        <div className="ladder-scroll-container" style={{ width: `${keys.length * 360 + 100}px` }}>

                            <svg className="ladder-sine-wave-svg" viewBox={`0 0 ${keys.length * 360 + 100} 700`} preserveAspectRatio="xMidYMid slice">
                                <path
                                    d={getSineWavePath(keys.length)}
                                    fill="none"
                                    stroke="rgba(0, 255, 255, 0.15)"
                                    strokeWidth="4"
                                    style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.4))' }}
                                />
                                <path
                                    d={getSineWavePath(keys.length)}
                                    fill="none"
                                    stroke="#00ffff"
                                    strokeWidth="3"
                                    strokeDasharray="15 15"
                                    className="wave-animated-dash"
                                    style={{ filter: 'drop-shadow(0 0 15px #00ffff)' }}
                                />
                            </svg>

                            {keys.map((key, i) => {
                                const isTop = i % 2 === 0;
                                const xPos = 60 + i * 360;
                                const yPos = isTop ? 80 : 360;

                                return (
                                    <motion.div
                                        className={`ladder-step ${isTop ? 'step-top' : 'step-bottom'}`}
                                        key={key}
                                        style={{ left: `${xPos}px`, top: `${yPos}px` }}
                                        onClick={() => setModalData({ isJourney: true, title: key, items: DATA.Journey[key] })}
                                        initial={{ opacity: 0, scale: 0.8, y: isTop ? -50 : 50 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-10%" }}
                                        transition={{ duration: 0.6, delay: i * 0.15 }}
                                    >
                                        <div className="ladder-platform">
                                            <div className="ladder-glow"></div>
                                            <div className="ladder-icon">
                                                {getFolderSVG(key)}
                                            </div>
                                        </div>
                                        <div className="ladder-content">
                                            <h3>{key}</h3>
                                            <p>{DATA.Journey[key][0].desc}</p>
                                            <span className="ladder-date">{DATA.Journey[key][0].date}</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )
            }
            case 'Achievements':
            case 'Projects': {
                const dataset = activeDirectory === 'Achievements' ? DATA.Achievements : DATA.Projects;
                return renderSubFolderExplorer(dataset, (items) => (
                    <div className="archive-grid">
                        {items.map((item, i) => (
                            <motion.div
                                className="archive-card achievement-card"
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setModalData(item)}
                            >
                                <img src={item.img} alt={item.title} />
                                <div className="card-overlay">
                                    <h3>{item.title}</h3>
                                    <span>{item.date}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ))
            }
            case 'Dreams':
                return (
                    <div className="archive-grid dreams-grid">
                        {DATA.Dreams.map((item, i) => (
                            <motion.div
                                className="archive-card dream-card"
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setModalData(item)}
                            >
                                <img src={item.img} alt={item.title} />
                                <div className="card-overlay">
                                    <h3>{item.title}</h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
            case 'Lifestyle':
                return (
                    <div className="archive-grid lifestyle-grid">
                        {DATA.Lifestyle.map((item, i) => (
                            <motion.div
                                className="archive-card lifestyle-card"
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <img src={item.img} alt={item.title} />
                            </motion.div>
                        ))}
                    </div>
                )
            case 'Skills':
                return renderSubFolderExplorer(DATA.Skills, (items) => (
                    <div className="skill-tags">
                        {items.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                        ))}
                    </div>
                ))
            default:
                return null
        }
    }

    return (
        <section className="personal-archive-section" id="visual-archive">
            <div className="archive-header-wrapper">
                <span className="sys-label">SECURED DATABASE</span>
                <h2 className="sys-title">PERSONAL <span>ARCHIVE</span></h2>
                <p className="sys-desc">Exploring the journey, achievements, lifestyle, and unyielding dreams.</p>
            </div>

            <div className="archive-os-container">
                <main className="archive-content-area-full">
                    <AnimatePresence mode="wait">
                        {!activeDirectory ? (
                            <motion.div
                                key="folders-view"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="archive-inner-view"
                            >
                                {renderFolders()}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="content-view"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="archive-inner-view"
                            >
                                <div className="content-view-header">
                                    <button className="back-to-root-btn" onClick={() => setActiveDirectory(null)}>
                                        ← Return to Home
                                    </button>
                                    <h2 className="content-view-title">
                                        {ARCHIVE_DIRECTORIES.find(d => d.id === activeDirectory)?.label}
                                    </h2>

                                </div>
                                <div className="archive-content-payload">
                                    {renderContent()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            <AnimatePresence>
                {modalData && (
                    <motion.div
                        className="archive-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setModalData(null)}
                    >
                        <motion.div
                            className="archive-modal-content"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="archive-modal-close" onClick={() => setModalData(null)}>✕</button>
                            {modalData.isJourney ? (
                                <div className="modal-info journey-modal-info">
                                    <h2>{modalData.title}</h2>
                                    <div className="archive-journey-timeline">
                                        <div className="timeline-line"></div>
                                        {modalData.items.map((item, i) => (
                                            <div className="timeline-node" key={item.id || i}>
                                                <div className="node-marker"></div>
                                                <div className="node-content">
                                                    <h4>{item.date}</h4>
                                                    <h3>{item.title}</h3>
                                                    <p>{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {modalData.img && (
                                        <div className="modal-image-wrapper">
                                            <img src={modalData.img} alt={modalData.title} />
                                        </div>
                                    )}
                                    <div className="modal-info">
                                        <h2>{modalData.title}</h2>
                                        {modalData.date && <span className="modal-date">{modalData.date}</span>}
                                        {modalData.details && <p className="modal-details">{modalData.details}</p>}
                                        {modalData.desc && <p className="modal-details">{modalData.desc}</p>}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
