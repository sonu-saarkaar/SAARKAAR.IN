import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ServicesSection.css'

const SKILL_CATEGORIES = [
    {
        id: 1,
        title: "Programming Languages",
        icon: "⚡",
        description: "Core languages used to execute structural logic and hardware/software bridges.",
        skills: [
            { name: "C Language", level: 90, type: "Strong Theoretical Foundation", desc: "Data Structures, Memory Management, Pointers, File Handling. Built strong foundation in low-level programming." },
            { name: "C++", level: 75, type: "Intermediate", desc: "OOP concepts, STL basics, Problem solving, Competitive logic." },
            { name: "Python", level: 95, type: "Advanced", desc: "FastAPI, Flask, Django (basic), Automation scripting, AI integration.", primary: true },
            { name: "Java", level: 60, type: "Academic Working Knowledge", desc: "OOP, College exam projects, Basic backend logic." }
        ]
    },
    {
        id: 2,
        title: "Frontend Engineering",
        icon: "🌐",
        description: "Built immersive 3D virtual office experiences.",
        skills: [
            { name: "Core Stack", level: 100, type: "Fundamental", desc: "HTML5, CSS3, JavaScript (ES6+)." },
            { name: "React Ecosystem", level: 95, type: "Advanced", desc: "React, Vite, Zustand. Component-driven architecture." },
            { name: "3D & WebGL", level: 85, type: "Specialized", desc: "Three.js, React Three Fiber. Spatial computing interfaces." },
            { name: "UI & Motion", level: 90, type: "Design Engineering", desc: "Framer Motion, Smooth scroll, Glassmorphism, Dark Themes." }
        ]
    },
    {
        id: 3,
        title: "Backend Engineering",
        icon: "⚙️",
        description: "Architecting secure, scalable middleware and data layers.",
        skills: [
            { name: "FastAPI (Python)", level: 90, type: "Primary Stack", desc: "REST APIs, JWT Auth, Middleware, Rate Limiting, Async execution." },
            { name: "Node.js (Express)", level: 75, type: "Working Knowledge", desc: "Server logic, basic route handling, API integrations." },
            { name: "System Design", level: 88, type: "Architecture", desc: "Modular architecture, Clean folder structure, API versioning." }
        ]
    },
    {
        id: 4,
        title: "Databases & Storage",
        icon: "💾",
        description: "Data orchestration, structuring, and rapid retrieval.",
        skills: [
            { name: "MongoDB", level: 90, type: "Primary Storage", desc: "Schema design, Aggregation pipelines, Indexing, Prod ready." },
            { name: "PostgreSQL", level: 50, type: "Basic Exposure", desc: "Structured queries, Relational logic." },
            { name: "Caching & Auth", level: 80, type: "Local Storage", desc: "Local storage logic, JWT session management via Cookies." }
        ]
    },
    {
        id: 5,
        title: "AI & Automation",
        icon: "🧠",
        description: "Architecting KYRON – AI Execution Agent.",
        skills: [
            { name: "OpenAI API", level: 95, type: "Core Model Integration", desc: "Prompt engineering, AI chat systems, Data mapping." },
            { name: "Agent Architecture", level: 85, type: "Systems logic", desc: "Form automation logic, multi-agent workflows." },
            { name: "Automation Pipelines", level: 70, type: "Execution", desc: "Data flow orchestration, Headless browser logic (planned)." }
        ]
    },
    {
        id: 6,
        title: "DevOps & Deployment",
        icon: "🚀",
        description: "Shipping nodes securely to the global edge network.",
        skills: [
            { name: "Cloud Platforms", level: 88, type: "Hosting", desc: "Vercel, Railway, Render edge networks." },
            { name: "Version Control", level: 90, type: "Management", desc: "Git workflows, GitHub environment config, branch logic." },
            { name: "Optimization", level: 85, type: "Performance", desc: "Lighthouse optimization, Lazy loading, Code splitting." }
        ]
    },
    {
        id: 7,
        title: "Core Technical Strengths",
        icon: "🎯",
        description: "The mental framework behind the engineering.",
        skills: [
            { name: "System Thinking Mindset", level: 95, type: "Foundational", desc: "Looking at the big picture rather than isolated bugs." },
            { name: "AI-First Approach", level: 90, type: "Methodology", desc: "Building systems with LLMs native to the architecture." },
            { name: "Full-Stack Integration", level: 88, type: "Execution", desc: "UI + Backend integration mastery, Startup prototyping." },
            { name: "Scalability Planning", level: 80, type: "Architecture", desc: "Planning DB clusters and redundant edge nodes." }
        ]
    }
];

export default function ServicesSection() {
    const [bookIndex, setBookIndex] = useState(0);
    const [direction, setDirection] = useState(1);

    const nextPages = () => {
        if (bookIndex + 2 < SKILL_CATEGORIES.length) {
            setDirection(1);
            setBookIndex(prev => prev + 2);
        }
    };

    const prevPages = () => {
        if (bookIndex - 2 >= 0) {
            setDirection(-1);
            setBookIndex(prev => prev - 2);
        }
    };

    const handleDragEnd = (event, info) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            nextPages();
        } else if (info.offset.x > swipeThreshold) {
            prevPages();
        }
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 150 : -150,
            opacity: 0,
            rotateY: direction > 0 ? 30 : -30,
            scale: 0.9,
            transformOrigin: direction > 0 ? "right center" : "left center"
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 120, damping: 20 }
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 150 : -150,
            opacity: 0,
            rotateY: direction < 0 ? 30 : -30,
            scale: 0.9,
            transition: { duration: 0.4 }
        })
    };

    const renderPageContent = (category) => {
        if (!category) return (
            <div className="tm-page-empty">
                <div className="tm-logo-watermark">SAARKAAR</div>
                <p className="tm-end-text">END OF MATRIX</p>
            </div>
        );

        return (
            <div className="tm-page-content">
                <div className="tm-slide-header">
                    <div className="tm-slide-icon">{category.icon}</div>
                    <div className="tm-slide-titles">
                        <h3>{category.title}</h3>
                        <p>{category.description}</p>
                    </div>
                </div>

                <div className="tm-skills-list">
                    {category.skills.map((skill, sIdx) => (
                        <div className="tm-skill-item" key={sIdx}>
                            <div className="tm-skill-top">
                                <div className="tm-skill-name">
                                    {skill.name}
                                    {skill.primary && <span className="tm-primary-badge">PRIMARY</span>}
                                </div>
                                <div className="tm-skill-type">{skill.type}</div>
                            </div>
                            <div className="tm-skill-bar-bg">
                                <motion.div
                                    className="tm-skill-bar-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${skill.level}%` }}
                                    transition={{ duration: 0.8, delay: 0.1 + (sIdx * 0.1) }}
                                    key={bookIndex} // Force re-animate on turn
                                />
                            </div>
                            <div className="tm-skill-desc">
                                {skill.desc.split(', ').map((d, i) => (
                                    <span key={i} className="tm-skill-chip">{d}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="tm-page-number">0{category.id} / 07</div>
            </div>
        );
    };

    return (
        <section className="tech-matrix-section" id="capabilities">
            <div className="tm-header">
                <span className="tm-label">CAPABILITIES</span>
                <div className="tm-title-wrapper">
                    <h2 className="tm-title-back">TECHNICAL INTELLIGENCE MATRIX</h2>
                    <h2 className="tm-title-front">TECHNICAL <span>INTELLIGENCE MATRIX</span></h2>
                </div>
            </div>

            <div className="tm-book-container">
                <button
                    className={`tm-nav-btn tm-nav-left ${bookIndex === 0 ? 'tm-nav-hidden' : ''}`}
                    onClick={prevPages}
                >←</button>

                <div className="tm-book-viewport">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={bookIndex}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                            className="tm-book-spread"
                        >
                            <div className="tm-page tm-page-left">
                                {renderPageContent(SKILL_CATEGORIES[bookIndex])}
                                <div className="tm-page-gradient-left"></div>
                            </div>

                            <div className="tm-book-spine"></div>

                            <div className="tm-page tm-page-right">
                                {renderPageContent(SKILL_CATEGORIES[bookIndex + 1])}
                                <div className="tm-page-gradient-right"></div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <button
                    className={`tm-nav-btn tm-nav-right ${bookIndex + 2 >= SKILL_CATEGORIES.length ? 'tm-nav-hidden' : ''}`}
                    onClick={nextPages}
                >→</button>
            </div>

            <div className="tm-drag-hint">
                <span>Swipe left/right to flip pages</span>
            </div>
        </section>
    );
}
