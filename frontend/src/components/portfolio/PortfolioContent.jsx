import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './PortfolioContent.css'

// Hardcoded Highly Detailed Portfolio Projects
const ARCHIVE_DATA = [
    {
        id: 'kyron',
        category: 'IN DEVELOPMENT',
        name: 'KYRON',
        tagline: 'Automating Bureaucracy Through Intelligent Execution.',
        status: '70% BUILT',
        statusKey: 'BUILD',
        techStack: ['React', 'Three.js', 'FastAPI', 'OpenAI API', 'MongoDB', 'Railway'],
        logo: '🤖',
        story: 'KYRON was built to eliminate repetitive manual form filling. Government and corporate forms are time-consuming and error-prone. The goal is to reduce a 40-minute manual process into under 5 minutes using intelligent AI orchestration.',
        vision: 'To build a digital execution agent that can read, understand, validate, and submit forms autonomously.',
        workingModel: 'User Input → Master Profile Validation → AI Field Mapping → Missing Data Detection → Smart Prompting → Auto Fill → Confirmation → Submission',
        progressData: [
            { label: 'Core Architecture', value: 100 },
            { label: 'AI Engine', value: 85 },
            { label: 'Form Automation', value: 70 },
            { label: 'Master Profile System', value: 80 },
            { label: 'UI Optimization', value: 60 },
            { label: 'Production Deployment', value: 30 }
        ],
        miniStats: { lines: '45,210', apis: '12', build: '2.4s' },
        techMatrix: [
            { name: 'Frontend', stack: 'React, Tailwind, Framer', desc: 'Immersive interactions' },
            { name: 'Backend', stack: 'FastAPI (Python)', desc: 'High-speed async logic' },
            { name: 'AI Layer', stack: 'OpenAI API + LangChain', desc: 'Custom prompt orchestration' },
            { name: 'Database', stack: 'MongoDB', desc: 'Schemaless data structures' },
            { name: 'Deployment', stack: 'Railway', desc: 'CI/CD automated pipeline' }
        ],
        metrics: { lighthouse: '96', speed: '0.8s', latency: '40ms', env: 'Production Cloud', scalability: 'Auto-scaling enabled' },
        businessImpact: 'Reduces manual entry time by 85%. Target audience: Govt & Corporate clerks.',
        challengesFaced: 'Context limit in LLMs during form parsing. Addressed via multi-agent chunking.',
        roadmap: 'Phase 2: Headless Browser Automation integration for zero-click submissions.',
        team: [
            { name: 'Asif Alam', role: 'AI Systems Architect', college: 'Parul University - B.Tech CSE' },
            { name: 'Rupesh Kumar', role: 'Backend Developer', college: 'Parul University - B.Tech CSE' },
            { name: 'Shubham Kumar', role: 'Logic & Testing', college: 'Parul University - B.Tech CSE' },
            { name: 'Naveen Yadav', role: 'Strategy & Coordination', college: '' }
        ]
    },
    {
        id: 'kora',
        category: 'LIVE SYSTEMS',
        name: 'KORA',
        tagline: 'Smart Digital Engagement Platform.',
        status: 'LIVE',
        statusKey: 'LIVE',
        website: 'Zynto.in',
        url: 'https://zynto.in',
        techStack: ['React', 'Node.js', 'MongoDB', 'Vercel', 'Cloud'],
        logo: '🧠',
        story: 'KORA is a high-performance Digital Engagement Platform designed to optimize intelligent user tracking and real-time interaction.',
        progressData: [{ label: 'Platform Readiness', value: 100 }],
        miniStats: { lines: '112,000+', apis: '25', build: '4.1s' },
        techMatrix: [
            { name: 'Frontend', stack: 'React', desc: 'Dynamic dashboarding' },
            { name: 'Backend', stack: 'Node.js', desc: 'Event-driven architecture' },
            { name: 'Database', stack: 'MongoDB', desc: 'Data Lake integration' },
        ],
        metrics: { lighthouse: '99', speed: '0.4s', latency: '20ms', env: 'Vercel Edge', scalability: 'Global Edge Network' },
        businessImpact: 'Processing 10k+ daily interactions securely and seamlessly.',
        challengesFaced: 'Real-time WebSocket connection state management.',
        roadmap: 'Predictive analytics integration using TensorFlow JS.',
        team: [
            { name: 'Asif Alam', role: 'Full Stack Architect', college: '' },
            { name: 'Rupesh Kumar', role: 'Backend Core', college: '' },
            { name: 'Shubham Kumar', role: 'Frontend Ops', college: '' }
        ]
    },
    {
        id: 'dadisecrets',
        category: 'LIVE SYSTEMS',
        name: 'DadiSecrets',
        tagline: 'Empowering small family businesses digitally.',
        status: 'LIVE',
        statusKey: 'LIVE',
        website: 'dadi-secrets-mall.vercel.app',
        url: 'https://dadi-secrets-mall.vercel.app',
        techStack: ['Next.js', 'Vercel', 'Stripe'],
        logo: '🛍️',
        story: 'Built as a personal initiative for my sister to digitally empower a small family-based product business. Designed and deployed independently. It bridges the gap between traditional setups and modern e-commerce.',
        solo: 'Built entirely by Asif Alam.',
        progressData: [{ label: 'E-Commerce Engine', value: 100 }],
        miniStats: { lines: '24,300', apis: '5 (Stripe, CMS)', build: '1.2s' },
        techMatrix: [
            { name: 'Frontend', stack: 'Next.js 14', desc: 'App router & SSR' },
            { name: 'Payments', stack: 'Stripe', desc: 'Secure checkout' },
            { name: 'Deployment', stack: 'Vercel', desc: 'Instant preview' },
        ],
        metrics: { lighthouse: '100', speed: '0.2s', latency: '15ms', env: 'Vercel', scalability: 'Serverless structure' },
        businessImpact: 'Digitized local inventory resulting in 300% expanded reach.',
        challengesFaced: 'Inventory sync across physical and digital storefronts.',
        roadmap: 'AI-driven product recommendations.'
    },
    {
        id: 'evenza',
        category: 'LIVE SYSTEMS',
        name: 'Evenza.space',
        tagline: 'Events & Marketing Pipeline.',
        status: 'SOLD',
        statusKey: 'SOLD',
        techStack: ['React', 'Tailwind', 'Vercel'],
        logo: '✨',
        story: 'Designed and developed independently. Focused on conversion-driven UI and brand positioning.',
        impact: 'Increased lead generation by 40%. Transitioned from static brochures to an interactive digital experience.',
        progressData: [{ label: 'Handover Status', value: 100 }],
        miniStats: { lines: '18,500', apis: 'None', build: '0.8s' },
        techMatrix: [
            { name: 'UI', stack: 'React + TailwindCSS', desc: 'High conversion design' },
            { name: 'Hosting', stack: 'Vercel Edge', desc: 'Low latency loading' }
        ],
        metrics: { lighthouse: '98', speed: '0.5s', latency: 'N/A', env: 'Vercel', scalability: 'High' },
        businessImpact: 'Revenue generated via sale of IP and landing page framework.',
        challengesFaced: 'Client iteration sync and high-contrast accessibility.',
        roadmap: 'Project transferred to client.'
    },
    {
        id: 'bookmygadi',
        category: 'LIVE SYSTEMS',
        name: 'BookMyGadi',
        tagline: 'Smart Car Booking Orchestrator.',
        status: 'LIVE',
        statusKey: 'LIVE',
        techStack: ['React', 'Node.js', 'MongoDB', 'AWS EC2'],
        logo: '🏎️',
        story: 'A smart car booking platform for seamless vendor-user interactions with live price negotiation and route mapping capabilities.',
        features: ['Route logic', 'Price negotiation system', 'Owner dashboard', 'User booking flow'],
        progressData: [{ label: 'Deployment Stability', value: 100 }],
        miniStats: { lines: '80,000+', apis: '15+', build: '3.5s' },
        techMatrix: [
            { name: 'Frontend', stack: 'React', desc: 'Complex role-based routing' },
            { name: 'Backend', stack: 'Node.js', desc: 'Mapping and pricing engine' }
        ],
        metrics: { lighthouse: '92', speed: '1.2s', latency: '55ms', env: 'AWS EC2', scalability: 'Load Balanced' },
        businessImpact: 'Streamlined local fleet management.',
        challengesFaced: 'Dynamic pricing recalculation based on demand surges.',
        roadmap: 'Fleet expansion and automated driver payouts.'
    },
    {
        id: 'bookmythali',
        category: 'UPCOMING SYSTEMS',
        name: 'BookMyThali',
        tagline: 'Custom logic food-tech platform.',
        status: 'UPCOMING',
        statusKey: 'UPCOMING',
        techStack: ['Next.js', 'PostgreSQL', 'Redis', 'AWS'],
        logo: '🍱',
        story: 'A revolutionary food-tech platform focusing on highly customized daily meals targeting working professionals and students.',
        vision: 'To launch a subscription-based custom thali delivery matrix that adapts to user dietary shifts.',
        progressData: [{ label: 'Core R&D', value: 20 }],
        miniStats: { lines: '12,000', apis: 'TBD', build: 'Fast' },
        techMatrix: [
            { name: 'Stack', stack: 'Next.js + PostgreSQL', desc: 'Relational logic for menus' },
            { name: 'Cache', stack: 'Redis', desc: 'Fast menu delivery' }
        ],
        metrics: { lighthouse: 'TBD', speed: 'TBD', latency: 'TBD', env: 'AWS', scalability: 'Microservices planned' },
        businessImpact: 'Expected disruption in local subscription-based meal delivery.',
        challengesFaced: 'Designing dynamic meal switching logic for users.',
        roadmap: 'Beta launch in Q3 2026.'
    }
];

const FeedbackPanel = () => {
    const [innovation, setInnovation] = useState(8);
    const [execution, setExecution] = useState(7);
    const [ux, setUx] = useState(9);
    const avg = ((innovation + execution + ux) / 3).toFixed(1);

    return (
        <div className="sys-feedback-panel">
            <h3 className="sys-panel-heading">Evaluation Matrix</h3>
            <div className="fb-row">
                <label>Innovation: {innovation}</label>
                <input type="range" min="1" max="10" value={innovation} onChange={e => setInnovation(parseInt(e.target.value))} className="fb-range" />
            </div>
            <div className="fb-row">
                <label>Execution: {execution}</label>
                <input type="range" min="1" max="10" value={execution} onChange={e => setExecution(parseInt(e.target.value))} className="fb-range" />
            </div>
            <div className="fb-row">
                <label>UI/UX: {ux}</label>
                <input type="range" min="1" max="10" value={ux} onChange={e => setUx(parseInt(e.target.value))} className="fb-range" />
            </div>
            <div className="fb-score">
                <div className="fb-score-label">OVERALL SYSTEM RATING</div>
                <div className="fb-score-value">{avg} / 10</div>
            </div>
        </div>
    );
};

// FULL-PAGE HIGH-DENSITY MODAL Component
const ProjectModal = ({ project, onClose }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; }
    }, []);

    if (!project) return null;

    const staggerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1, y: 0,
            transition: { delay: i * 0.1, duration: 0.5 }
        })
    };

    return (
        <div className="cs-modal-overlay">
            {/* The sweeping golden animation on mount */}
            <div className="golden-sweep-fast"></div>

            <motion.div
                className="cs-modal-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                <button className="cs-modal-close" onClick={onClose}>×</button>

                {/* --- HERO SECTION --- */}
                <header className="cs-hero">
                    <div className="cs-hero-glow"></div>
                    <div className="cs-hero-content">
                        <div className="cs-title-group">
                            <span className="cs-hero-icon">{project.logo}</span>
                            <div>
                                <h1 className="cs-hero-title">{project.name}</h1>
                                <div className={`cs-badge badge-${project.statusKey}`}>{project.status}</div>
                            </div>
                        </div>
                        <p className="cs-hero-tagline">{project.tagline}</p>
                        <div className="cs-hero-actions">
                            {(project.website || project.url) && (
                                <button className="cs-btn cs-btn-gold" onClick={() => window.open(project.url || `https://${project.website}`, '_blank')}>Visit Protocol</button>
                            )}
                            <button className="cs-btn cs-btn-teal">View Architecture</button>
                        </div>
                    </div>
                    <div className="cs-hero-underline"></div>
                </header>

                {/* --- 2-COLUMN GRID BODY --- */}
                <div className="cs-body-grid">

                    {/* LEFT COLUMN: SCROLLABLE CONTENT */}
                    <div className="cs-left-col">

                        <motion.section custom={1} initial="hidden" animate="visible" variants={staggerVariants} className="cs-block">
                            <h2 className="cs-block-title">01 // SYSTEM ORIGIN & STORY</h2>
                            <h3 className="cs-block-subtitle">Emotional Version & Vision</h3>
                            <div className="cs-story-content">
                                <p>{project.story}</p>
                                {project.vision && <p><strong>Vision: </strong>{project.vision}</p>}
                                {project.solo && <p><strong>Engineering: </strong>{project.solo}</p>}
                                {project.impact && <p><strong>Outcome: </strong>{project.impact}</p>}
                            </div>
                        </motion.section>

                        {project.workingModel && (
                            <motion.section custom={2} initial="hidden" animate="visible" variants={staggerVariants} className="cs-block">
                                <h2 className="cs-block-title">02 // WORKING MODEL</h2>
                                <h3 className="cs-block-subtitle">Architecture Flow Diagram</h3>
                                <div className="cs-flow-diagram">
                                    {project.workingModel.split('→').map((node, idx, arr) => (
                                        <React.Fragment key={idx}>
                                            <div className="cs-flow-node">{node.trim()}</div>
                                            {idx < arr.length - 1 && <div className="cs-flow-arrow">↓</div>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {project.techMatrix && (
                            <motion.section custom={3} initial="hidden" animate="visible" variants={staggerVariants} className="cs-block">
                                <h2 className="cs-block-title">03 // TECH STACK MATRIX</h2>
                                <h3 className="cs-block-subtitle">System Component Breakdown</h3>
                                <div className="cs-matrix-grid">
                                    {project.techMatrix.map((t, idx) => (
                                        <div className="cs-matrix-card" key={idx}>
                                            <div className="cs-matrix-name">{t.name}</div>
                                            <div className="cs-matrix-stack">{t.stack}</div>
                                            <div className="cs-matrix-desc">{t.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {project.metrics && (
                            <motion.section custom={4} initial="hidden" animate="visible" variants={staggerVariants} className="cs-block">
                                <h2 className="cs-block-title">04 // PERFORMANCE METRICS</h2>
                                <h3 className="cs-block-subtitle">Speed & Scalability</h3>
                                <div className="cs-metrics-grid">
                                    <div className="cs-metric-box">
                                        <span>Lighthouse</span>
                                        <strong>{project.metrics.lighthouse}</strong>
                                    </div>
                                    <div className="cs-metric-box">
                                        <span>Load Time</span>
                                        <strong>{project.metrics.speed}</strong>
                                    </div>
                                    <div className="cs-metric-box">
                                        <span>API Latency</span>
                                        <strong>{project.metrics.latency}</strong>
                                    </div>
                                    <div className="cs-metric-box">
                                        <span>Environment</span>
                                        <strong style={{ fontSize: '0.9rem' }}>{project.metrics.env}</strong>
                                    </div>
                                    <div className="cs-metric-box cs-metric-wide">
                                        <span>Scalability Readiness</span>
                                        <strong>{project.metrics.scalability}</strong>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {(project.businessImpact || project.challengesFaced || project.roadmap) && (
                            <motion.section custom={5} initial="hidden" animate="visible" variants={staggerVariants} className="cs-block">
                                <h2 className="cs-block-title">05 // BUSINESS & PRODUCT R&D</h2>
                                <div className="cs-text-grid">
                                    {project.businessImpact && (
                                        <div className="cs-text-box">
                                            <h4>Business Impact</h4>
                                            <p>{project.businessImpact}</p>
                                        </div>
                                    )}
                                    {project.challengesFaced && (
                                        <div className="cs-text-box">
                                            <h4>Challenges Faced</h4>
                                            <p>{project.challengesFaced}</p>
                                        </div>
                                    )}
                                    {project.roadmap && (
                                        <div className="cs-text-box cs-text-wide">
                                            <h4>Improvement Roadmap</h4>
                                            <p>{project.roadmap}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                    </div>

                    {/* RIGHT COLUMN: STICKY SYSTEM PANEL */}
                    <div className="cs-right-col">
                        <div className="cs-sticky-panel">

                            {/* Panel Header */}
                            <div className="sys-panel-header">
                                <div className="sys-dot"></div>
                                <span>SYSTEM INTELLIGENCE PANEL</span>
                            </div>

                            {/* Progress Bars */}
                            <div className="sys-panel-section">
                                <h4 className="sys-panel-heading">Completion Progress</h4>
                                {project.progressData.map((p, i) => (
                                    <div className="sys-progress-item" key={i}>
                                        <div className="sys-progress-labels">
                                            <span>{p.label}</span>
                                            <span>{p.value}%</span>
                                        </div>
                                        <div className="sys-progress-bg">
                                            <motion.div
                                                className="sys-progress-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p.value}%` }}
                                                transition={{ duration: 1, delay: i * 0.1 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mini Stats */}
                            {project.miniStats && (
                                <div className="sys-panel-section sys-mini-stats">
                                    <div className="sys-stat">
                                        <span>Lines of Code</span>
                                        <strong>{project.miniStats.lines}</strong>
                                    </div>
                                    <div className="sys-stat">
                                        <span>APIs Int.</span>
                                        <strong>{project.miniStats.apis}</strong>
                                    </div>
                                    <div className="sys-stat">
                                        <span>Build Time</span>
                                        <strong>{project.miniStats.build}</strong>
                                    </div>
                                </div>
                            )}

                            {/* Team */}
                            {project.team && (
                                <div className="sys-panel-section">
                                    <h4 className="sys-panel-heading">System Operators (Team)</h4>
                                    <div className="sys-team-list">
                                        {project.team.map((m, i) => (
                                            <div className="sys-team-card" key={i}>
                                                <div className="sys-team-avatar">{m.name.charAt(0)}</div>
                                                <div className="sys-team-info">
                                                    <strong>{m.name}</strong>
                                                    <span>{m.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            <div className="sys-panel-section">
                                <FeedbackPanel />
                            </div>

                            {/* License */}
                            <div className="sys-license">
                                Copyright © 2026 | Private Intellectual Property.<br /> All rights reserved.
                            </div>

                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    )
}

// Main Component
const STATUS_ORDER = ['LIVE SYSTEMS', 'IN DEVELOPMENT', 'UPCOMING SYSTEMS'];

const STATUS_CONFIG = {
    'LIVE SYSTEMS': { key: 'LIVE', color: '#00f5d4', label: 'LIVE SYSTEMS' },
    'IN DEVELOPMENT': { key: 'BUILD', color: '#fff', label: 'IN DEVELOPMENT' },
    'UPCOMING SYSTEMS': { key: 'UPCOMING', color: '#888', label: 'UPCOMING SYSTEMS' },
};

// Sort projects: LIVE → IN DEVELOPMENT → UPCOMING
const SORTED_PROJECTS = [
    ...ARCHIVE_DATA.filter(p => p.category === 'LIVE SYSTEMS'),
    ...ARCHIVE_DATA.filter(p => p.category === 'IN DEVELOPMENT'),
    ...ARCHIVE_DATA.filter(p => p.category === 'UPCOMING SYSTEMS'),
];

const PortfolioContent = () => {
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [direction, setDirection] = useState(1);

    const total = SORTED_PROJECTS.length;
    const current = SORTED_PROJECTS[currentIdx];

    const goTo = (idx) => {
        if (idx === currentIdx) return;
        setDirection(idx > currentIdx ? 1 : -1);
        setCurrentIdx(idx);
    };

    const prev = () => {
        if (currentIdx > 0) {
            setDirection(-1);
            setCurrentIdx(i => i - 1);
        }
    };

    const next = () => {
        if (currentIdx < total - 1) {
            setDirection(1);
            setCurrentIdx(i => i + 1);
        }
    };

    // Which status category the current card belongs to
    const activeCategory = current?.category;

    const cardVariants = {
        enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.92 }),
        center: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 26 } },
        exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0, scale: 0.92, transition: { duration: 0.28 } }),
    };

    return (
        <div id="projects" className="command-center">
            <div className="cc-particles"></div>

            {/* === TITLE === */}
            <div className="cc-header">
                <motion.h2
                    className="cc-title"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    ARCHIVES – <span>DEPLOYED INTELLIGENCE</span>
                </motion.h2>
            </div>

            {/* === STATUS TIMELINE STRIP === */}
            <div className="cc-status-strip">
                {STATUS_ORDER.map((cat, i) => {
                    const cfg = STATUS_CONFIG[cat];
                    const isActive = activeCategory === cat;
                    const projectsInCat = SORTED_PROJECTS.filter(p => p.category === cat);
                    const firstIdx = SORTED_PROJECTS.findIndex(p => p.category === cat);
                    return (
                        <React.Fragment key={cat}>
                            <button
                                className={`cc-status-pill ${isActive ? 'cc-status-pill--active' : ''}`}
                                style={{ '--pill-color': cfg.color }}
                                onClick={() => goTo(firstIdx)}
                            >
                                <span className="cc-status-dot" style={{ background: cfg.color }}></span>
                                {cfg.label}
                                <span className="cc-status-count">{projectsInCat.length}</span>
                            </button>
                            {i < STATUS_ORDER.length - 1 && (
                                <div className="cc-status-connector">
                                    <span>→</span>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* === SINGLE PROJECT CAROUSEL === */}
            <div className="cc-carousel-root">
                {/* Prev Arrow */}
                <button
                    className={`cc-arrow cc-arrow--left ${currentIdx === 0 ? 'cc-arrow--hidden' : ''}`}
                    onClick={prev}
                    aria-label="Previous project"
                >←</button>

                {/* Card Stage */}
                <div className="cc-stage">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={current.id}
                            custom={direction}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="cc-carousel-card"
                        >
                            {/* Card Left — Main Info */}
                            <div className="cc-ccard-left">
                                <div className="cc-ccard-top">
                                    <div className="cc-ccard-logo">{current.logo}</div>
                                    <div>
                                        <div className={`cc-card-status status-${current.statusKey}`}>
                                            {current.status}
                                        </div>
                                        <span className="cc-ccard-cat">{current.category}</span>
                                    </div>
                                </div>

                                <h2 className="cc-ccard-title">{current.name}</h2>
                                <p className="cc-ccard-tagline">"{current.tagline}"</p>
                                <p className="cc-card-archtext">System Architecture Available.</p>

                                <div className="cc-card-tech" style={{ marginBottom: '1.5rem' }}>
                                    {current.techStack.slice(0, 5).map(t => <span key={t} className="tech-chip">{t}</span>)}
                                    {current.techStack.length > 5 && <span className="tech-chip">+{current.techStack.length - 5}</span>}
                                </div>

                                <div className="cc-card-buttons">
                                    {(current.website || current.url) && (
                                        <button className="cc-btn cc-btn-gold" onClick={(e) => { e.stopPropagation(); window.open(current.url || `https://${current.website}`, '_blank'); }}>
                                            Live App
                                        </button>
                                    )}
                                    <button className="cc-btn cc-btn-teal" onClick={() => setSelectedProject(current)}>
                                        Case Study
                                    </button>
                                    <button className="cc-btn cc-btn-minimal" onClick={() => setSelectedProject(current)}>
                                        Details
                                    </button>
                                </div>
                            </div>

                            {/* Card Right — Stats Panel */}
                            <div className="cc-ccard-right">
                                <div className="cc-ccard-stats-label">SYSTEM VITALS</div>
                                {current.progressData && current.progressData.slice(0, 4).map((pd, pi) => (
                                    <div key={pi} className="cc-ccard-stat-row">
                                        <div className="cc-ccard-stat-name">{pd.label}</div>
                                        <div className="cc-ccard-bar-bg">
                                            <motion.div
                                                className="cc-ccard-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pd.value}%` }}
                                                transition={{ duration: 0.8, delay: pi * 0.1 }}
                                                key={current.id}
                                            />
                                        </div>
                                        <span className="cc-ccard-stat-val">{pd.value}%</span>
                                    </div>
                                ))}

                                {current.metrics && (
                                    <div className="cc-ccard-metrics">
                                        {Object.entries(current.metrics).slice(0, 3).map(([k, v]) => (
                                            <div key={k} className="cc-ccard-metric-box">
                                                <span>{v}</span>
                                                <small>{k.toUpperCase()}</small>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {current.miniStats && (
                                    <div className="cc-ccard-ministats">
                                        <div><strong>{current.miniStats.lines}</strong><span>Lines</span></div>
                                        <div><strong>{current.miniStats.apis}</strong><span>APIs</span></div>
                                        <div><strong>{current.miniStats.build}</strong><span>Build</span></div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next Arrow */}
                <button
                    className={`cc-arrow cc-arrow--right ${currentIdx === total - 1 ? 'cc-arrow--hidden' : ''}`}
                    onClick={next}
                    aria-label="Next project"
                >→</button>
            </div>

            {/* === DOT NAVIGATION === */}
            <div className="cc-dot-nav">
                {SORTED_PROJECTS.map((p, i) => (
                    <button
                        key={p.id}
                        className={`cc-dot ${i === currentIdx ? 'cc-dot--active' : ''} cc-dot--${p.statusKey}`}
                        onClick={() => goTo(i)}
                        title={p.name}
                    />
                ))}
            </div>

            <div className="cc-project-counter">
                <span className="cc-counter-current">{String(currentIdx + 1).padStart(2, '0')}</span>
                <span className="cc-counter-sep"> / </span>
                <span className="cc-counter-total">{String(total).padStart(2, '0')}</span>
                <span className="cc-counter-name">{current.name}</span>
            </div>

            {/* === PROJECT MODAL === */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectModal
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default PortfolioContent

