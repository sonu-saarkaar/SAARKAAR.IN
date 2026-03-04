import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react'
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
import Footer from '../components/portfolio/Footer'
import StarBackground from '../components/portfolio/StarBackground' // Keep as fallback/layer
import BrandLogo from '../components/BrandLogo'

const STORY_CONTENT = {
    hinglish: {
        title: 'Why I Built SAARKAAR – The Virtual Office',
        paragraphs: [
            'Maine SAARKAAR sirf ek website banane ke liye nahi banaya.',
            'Maine ise isliye banaya kyunki real duniya mein har insaan ka ek address hota hai. Ek office hota hai. Ek jagah hoti hai jahan log usse mil sakte hain.',
            'Lekin digital duniya mein? Hum sirf ek link ban kar reh jaate hain.',
            'Portfolio ka matlab sirf projects dikhana nahi hota. Portfolio ka matlab hota hai: "Yeh hoon main. Yeh hai mera kaam. Aur yeh hai meri duniya."',
            'Maine socha… Agar real world mein office hota hai, toh digital world mein kyun na ek Virtual Office ho?',
            'Isliye SAARKAAR ek normal portfolio nahi hai. Yeh ek digital headquarters hai.',
            'Yahan ek assistant hai. Jo aapko guide karega. Appointment book karega. Basic information dega. Feedback lega.',
            'Aur phir hai "Boss".',
            'Boss ka character aapko A to Z sab batayega. Mere projects. Meri degree. Meri technical skills. Mera background. Mera vision. Meri journey.',
            'Agar aap investor ho — baat karo. Agar aap client ho — baat karo. Agar aap student ho — baat karo. Agar aap bas curious ho — baat karo.',
            'Yeh website scroll karne ke liye nahi hai. Yeh interact karne ke liye hai.',
            'Sach bataun? Main 100% realistic 3D characters banana chahta tha. Lekin professional 3D assets aur models mostly paid hote hain. Aur mere paas limited time tha.',
            'College exams chal rahe the. Hackathon deadline thi. Mere paas sirf 7–8 din the.',
            'Main har model Blender se manually nahi bana sakta tha. Aur sab kuch purchase karna financially possible nahi tha.',
            'Isliye agar kuch jagah visuals perfect nahi lagte, toh woh limitation ka result hai, commitment ki kami ka nahi.',
            'SAARKAAR perfection ka final version nahi hai. Yeh ek foundation hai. Ek vision ka prototype hai.',
            'Aur yeh sirf shuruaat hai.',
            'Dhanyewaad — this side is Asif Aslam, I mean Sonu Saarkaar.'
        ],
        langCode: 'hi-IN'
    },
    english: {
        title: 'Why I Built SAARKAAR – The Virtual Office',
        paragraphs: [
            'I did not build SAARKAAR to create another portfolio website.',
            'In the real world, every professional has an address. An office. A place where people can visit and interact.',
            'In the digital world, however, we reduce ourselves to a simple link.',
            'A portfolio should not just list projects. It should represent identity.',
            'That idea led me to create SAARKAAR — a Virtual Office.',
            'Instead of scrolling through static pages, visitors enter an interactive digital headquarters.',
            'There is an assistant to guide them. There is a founder character to explain everything in depth.',
            'Education. Projects. Skills. Vision. Opportunities.',
            'Whether you are an investor, collaborator, client, or recruiter — you can interact directly.',
            'This is not a website. It is an experience.',
            'Due to time constraints, ongoing college exams, and hackathon deadlines, I had only 7–8 days to build this system.',
            'High-quality 3D assets and characters require paid resources. Creating everything from scratch was not feasible within the timeframe.',
            'Therefore, SAARKAAR represents a functional prototype — not the final polished ecosystem.',
            'It is a foundation. A vision. A blueprint for immersive digital identity systems.',
            'And this is only the beginning.',
            'Thank you — this side is Asif Aslam, I mean Sonu Saarkaar.'
        ],
        langCode: 'en-US'
    }
}

function StoryModal({ onClose }) {
    const [language, setLanguage] = useState('hinglish')
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [ambientOn, setAmbientOn] = useState(false)
    const [parallaxY, setParallaxY] = useState(0)

    const bodyRef = useRef(null)
    const utteranceRef = useRef(null)
    const ambientRef = useRef(null)

    const activeStory = useMemo(() => STORY_CONTENT[language], [language])

    useEffect(() => {
        const host = bodyRef.current
        if (!host) return

        const nodes = host.querySelectorAll('.story-paragraph')
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible')
                    }
                })
            },
            { root: host, threshold: 0.12 }
        )

        nodes.forEach((node) => observer.observe(node))

        return () => observer.disconnect()
    }, [language])

    useEffect(() => {
        const synth = window.speechSynthesis
        return () => {
            synth.cancel()
            if (ambientRef.current) {
                ambientRef.current.pause()
                ambientRef.current.currentTime = 0
            }
        }
    }, [])

    useEffect(() => {
        if (!ambientRef.current) return
        if (ambientOn) {
            ambientRef.current.volume = 0.12
            ambientRef.current.play().catch(() => { })
        } else {
            ambientRef.current.pause()
        }
    }, [ambientOn])

    useEffect(() => {
        if (!isSpeaking) return
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        setIsPaused(false)
    }, [language])

    const storyTextForSpeech = `${activeStory.title}. ${activeStory.paragraphs.join(' ')}`

    const handleSpeak = () => {
        const synth = window.speechSynthesis
        if (!synth) return

        synth.cancel()

        const utterance = new SpeechSynthesisUtterance(storyTextForSpeech)
        utterance.lang = activeStory.langCode
        utterance.rate = language === 'english' ? 0.95 : 0.92
        utterance.pitch = 1.0
        utterance.volume = 1.0

        utterance.onstart = () => {
            setIsSpeaking(true)
            setIsPaused(false)
        }
        utterance.onend = () => {
            setIsSpeaking(false)
            setIsPaused(false)
        }
        utterance.onerror = () => {
            setIsSpeaking(false)
            setIsPaused(false)
        }

        utteranceRef.current = utterance
        synth.speak(utterance)
    }

    const handlePauseResume = () => {
        const synth = window.speechSynthesis
        if (!isSpeaking) return

        if (synth.paused) {
            synth.resume()
            setIsPaused(false)
        } else {
            synth.pause()
            setIsPaused(true)
        }
    }

    const handleStop = () => {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        setIsPaused(false)
    }

    const handleClose = () => {
        handleStop()
        if (ambientRef.current) {
            ambientRef.current.pause()
            ambientRef.current.currentTime = 0
        }
        onClose()
    }

    const handleScrollParallax = (e) => {
        setParallaxY(e.currentTarget.scrollTop * 0.15)
    }

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="story-modal story-modal--premium" onClick={e => e.stopPropagation()} style={{ '--parallax-offset': `${parallaxY}px` }}>
                <div className="story-topbar">
                    <div className="story-lang-toggle" role="tablist" aria-label="Story language toggle">
                        <button className={`lang-btn ${language === 'hinglish' ? 'active' : ''}`} onClick={() => setLanguage('hinglish')}>Hinglish / English</button>
                        <button className={`lang-btn ${language === 'english' ? 'active' : ''}`} onClick={() => setLanguage('english')}>English</button>
                    </div>

                    <button className={`speak-badge ${isSpeaking ? 'is-speaking' : ''}`} onClick={handleSpeak} title="Speak story">
                        🔊 Speak
                    </button>
                </div>

                <h2>{activeStory.title}</h2>
                <div className="story-gold-line" />

                <div className="story-controls-row">
                    <button className="story-ctl" onClick={handlePauseResume} disabled={!isSpeaking}>{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                    <button className="story-ctl" onClick={handleStop} disabled={!isSpeaking}>⏹ Stop</button>
                    <button className={`story-ctl ${ambientOn ? 'active' : ''}`} onClick={() => setAmbientOn(v => !v)}>{ambientOn ? '🌙 Ambient On' : '🌙 Ambient Off'}</button>
                    {isSpeaking && <span className="story-speaking-status">Narrating<span className="typing-cursor">|</span></span>}
                </div>

                <div className="story-content-scroll" ref={bodyRef} onScroll={handleScrollParallax}>
                    {activeStory.paragraphs.map((paragraph, index) => (
                        <p
                            key={`${language}-${index}`}
                            className="story-paragraph"
                            style={{ '--d': `${index * 70}ms` }}
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                <button className="close-modal" onClick={handleClose}>CLOSE</button>

                <audio
                    ref={ambientRef}
                    loop
                    preload="auto"
                    src="/ambient-music.mp3"
                />
            </div>
        </div>
    )
}

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
    const wrapperRef = useRef(null)

    const resetToTop = useCallback((source) => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0

        const container = wrapperRef.current || document.querySelector('.scroll-container')
        if (container) {
            container.scrollTop = 0
        }

        console.log(`[PortfolioScroll:${source}] window.scrollY =`, window.scrollY)
        console.log(`[PortfolioScroll:${source}] document.documentElement.scrollTop =`, document.documentElement.scrollTop)
        if (container) {
            console.log(`[PortfolioScroll:${source}] .scroll-container.scrollTop =`, container.scrollTop)
        }
    }, [])

    useLayoutEffect(() => {
        resetToTop('layout-mount')
    }, [resetToTop])

    useEffect(() => {
        resetToTop('mount')
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        const timeoutId = setTimeout(() => {
            resetToTop('mount-timeout')
        }, 0)

        const rafId = window.requestAnimationFrame(() => {
            resetToTop('mount-raf')
        })

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

        return () => {
            clearTimeout(timeoutId)
            window.cancelAnimationFrame(rafId)
        }
    }, [resetToTop]);

    useEffect(() => {
        if (showIntro) return

        resetToTop('after-intro')

        const timeoutId = setTimeout(() => {
            resetToTop('after-intro-timeout')
        }, 0)

        const rafId = window.requestAnimationFrame(() => {
            resetToTop('after-intro-raf')
        })

        return () => {
            clearTimeout(timeoutId)
            window.cancelAnimationFrame(rafId)
        }
    }, [showIntro, resetToTop]);

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
        resetToTop('intro-complete')

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
        <div className="portfolio-wrapper scroll-container" ref={wrapperRef}>
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

                    {/* 5. VISUAL INTELLIGENCE ARCHIVE */}
                    <BentoGallery />

                    {/* 6. INTERVIEW · FOUNDER AI */}
                    <AIArchitectureSection showArchitecture={false} />

                    {/* 7. SOCIAL PROFILES CAROUSEL */}
                    <SocialCarouselSection />

                    {/* 8. SYSTEM ARCHITECTURE */}
                    <AIArchitectureSection showInterview={false} />

                    {/* 9. FOOTER */}
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
                    <div className="logo portfolio-brand-logo"><BrandLogo size="md" /></div>
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
                {showStory && <StoryModal onClose={() => setShowStory(false)} />}

                {/* AI Chat Layout */}
                <AIChatOverlay isOpen={showChat} onClose={() => setShowChat(false)} />
            </div>
        </div>
    )
}
