import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProjects, askFounderAI } from '../services/api'
import './FuturisticPortfolio.css'

// Components
// Components
import CinematicIntro from '../components/portfolio/CinematicIntro'
import CinematicHero from '../components/portfolio/CinematicHero'
import AboutSection from '../components/portfolio/AboutSection'
import ResumeSection from '../components/portfolio/ResumeSection'
import ServicesSection from '../components/portfolio/ServicesSection'
import PortfolioContent from '../components/portfolio/PortfolioContent'
import SocialCarouselSection from '../components/portfolio/SocialCarouselSection'
import AIArchitectureSection from '../components/portfolio/AIArchitectureSection'
import BentoGallery from '../components/portfolio/BentoGallery'
import ContactSection from '../components/portfolio/ContactSection'
import Footer from '../components/portfolio/Footer'
import StarBackground from '../components/portfolio/StarBackground' // Keep as fallback/layer

// --- AI CHAT COMPONENT ---
function AIChatOverlay({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello. I am the digital consciousness of SAARKAAR's Founder. Ask me anything about my tech stack, vision, or architectural decisions." }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const chatEndRef = useRef(null)

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => scrollToBottom(), [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input.trim()
        const historyForApi = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }))

        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setInput('')
        setIsLoading(true)

        try {
            const data = await askFounderAI({
                message: userMsg,
                history: historyForApi,
                language: 'auto'
            })
            const reply = data?.response || data?.message || "I processed that."
            setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        } catch (error) {
            console.error("AI Error:", error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Link unstable, but I’m still online. Ask again about tech stack, architecture, projects, or vision."
            }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="ai-chat-overlay">
            <div className="chat-header">
                <div className="chat-status-dot"></div>
                <h3>FOUNDER.AI</h3>
                <button onClick={onClose} className="close-chat">×</button>
            </div>
            <div className="chat-messages">
                {messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                        <span className="msg-bubble">{m.content}</span>
                    </div>
                ))}
                {isLoading && <div className="message assistant"><span className="msg-bubble typing">Thinking...</span></div>}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about architectural patterns..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    )
}

export default function FuturisticPortfolio() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [showChat, setShowChat] = useState(false)
    const [showStory, setShowStory] = useState(false)
    const [isMuted, setIsMuted] = useState(false) // Default to unmuted so icon defaults to 🔊
    const audioRef = useRef(null)

    const [showIntro, setShowIntro] = useState(true)

    useEffect(() => {
        const loadPortfolio = async () => {
            try {
                const data = await fetchProjects();
                if (!data || data.length === 0) {
                    // Fallback Data
                    setProjects([
                        { id: 1, title: "Virtual Office", description: "3D Interactive Workplace built with React Three Fiber.", tech_stack: ["Three.js", "React"] },
                        { id: 2, title: "AI Analytics", description: "Predictive Gov Tech Platform for data analysis.", tech_stack: ["Python", "TensorFlow"] },
                        { id: 3, title: "Smart City", description: "IoT Dashboard for monitoring urban infrastructure.", tech_stack: ["IoT", "Node.js"] },
                        { id: 4, title: "BlockChain ID", description: "Decentralized Identity Solution for secure auth.", tech_stack: ["Solidity", "Web3"] },
                    ])
                } else {
                    setProjects(data);
                }
            } catch (e) {
                console.error("Failed to load projects", e)
            }
        };
        loadPortfolio();
    }, []);

    const toggleAudio = () => {
        if (!audioRef.current) return

        if (audioRef.current.paused || isMuted) {
            audioRef.current.play().then(() => setIsMuted(false)).catch(e => console.log(e))
            setIsMuted(false)
        } else {
            audioRef.current.pause()
            setIsMuted(true)
        }
    }

    const handleIntroComplete = () => {
        setShowIntro(false)

        // Use timeout to securely bypass React render queue for the hardware audio element play
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.volume = 0.3
                audioRef.current.play().then(() => {
                    setIsMuted(false)
                }).catch(() => {
                    // Force mute icon if browser completely blocks execution 
                    setIsMuted(true)
                })
            }
        }, 100)
    }

    return (
        <div className="portfolio-wrapper">
            {showIntro ? (
                <CinematicIntro onComplete={handleIntroComplete} />
            ) : (
                <>
                    {/* 1. HERO SECTION */}
                    <CinematicHero />

                    {/* 2. ABOUT SECTION - Founder Presence */}
                    <AboutSection />

                    {/* SECURE RESUME ACCESS SYSTEM */}
                    <ResumeSection />

                    {/* 3. SERVICES SECTION - Capabilities */}
                    <ServicesSection />

                    {/* 4. PROJECTS SECTION - System Activation & Archives */}
                    <div id="projects">
                        <PortfolioContent projects={projects} />
                    </div>

                    {/* 4.5 SOCIAL PROFILES CAROUSEL */}
                    <SocialCarouselSection />

                    {/* 5. AI & ARCHITECTURE SECTION */}
                    <AIArchitectureSection />

                    {/* 6. VISUAL INTELLIGENCE ARCHIVE */}
                    <BentoGallery />

                    {/* 7. CONTACT SECTION */}
                    <ContactSection />

                    {/* 7. FOOTER */}
                    <Footer />
                </>
            )}

            {/* Premium Background Music Node - Local Hosted to Bypass Cross-Origin Blocks */}
            <audio
                ref={audioRef}
                loop
                preload="auto"
                src="/ambient-music.mp3"
            />

            {/* UI Overlay (Header / FABs) */}
            <div className="ui-overlay">
                <header className="portfolio-header">
                    <div className="logo">SAARKAAR<span className="blink">_</span></div>
                    <nav>
                        <button onClick={() => navigate('/')}>RETURN TO LOBBY</button>
                    </nav>
                </header>

                <div className="fab-container">
                    <button className={`fab-btn ${!isMuted ? 'active' : ''}`} onClick={toggleAudio}>
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                    <button className="fab-btn" onClick={() => setShowStory(true)}>
                        📖
                        <span className="tooltip">Story</span>
                    </button>
                    <button className="fab-btn ai-trigger" onClick={() => setShowChat(!showChat)}>
                        🤖
                        <span className="tooltip">AI Interview</span>
                    </button>
                </div>

                {/* Story Modal */}
                {showStory && (
                    <div className="modal-backdrop" onClick={() => setShowStory(false)}>
                        <div className="story-modal" onClick={e => e.stopPropagation()}>
                            <h2>Why I Built This</h2>
                            <p>In a world of static 2D resumes, I wanted to create something that actually <strong>demonstrates</strong> my capability, not just lists it.</p>
                            <p>This Virtual Office is a culmination of my obsession with spatial computing and immersive web technologies.</p>
                            <button className="close-modal" onClick={() => setShowStory(false)}>CLOSE</button>
                        </div>
                    </div>
                )}

                {/* AI Chat Layout */}
                <AIChatOverlay isOpen={showChat} onClose={() => setShowChat(false)} />
            </div>
        </div>
    )
}
