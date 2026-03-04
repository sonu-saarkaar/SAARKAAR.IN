import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { askFounderAI, submitFeedback, joinTeam } from '../../services/api'
import BrandLogo from '../BrandLogo'
import './AIArchitectureSection.css'

const CHAT_MODES = {
    meeting: {
        label: 'Meeting',
        intro: 'Meeting mode active. I will respond with agenda, discussion points, and clear action items.',
        prompt: 'Respond in meeting style: concise agenda, key points, and next actions.',
        suggestions: ['Set meeting agenda', 'Discuss execution timeline', 'Share roadmap summary']
    },
    interview: {
        label: 'Interview',
        intro: 'Interview mode active. Ask anything about projects, architecture, decisions, and growth journey.',
        prompt: 'Respond in interview style: structured, professional, and evidence-focused.',
        suggestions: ['What projects have you built?', 'Why SAARKAAR?', 'Describe your tech stack deeply']
    },
    custom: {
        label: 'Custom',
        intro: 'Custom mode active. Talk naturally in Hindi, English, or Hinglish.',
        prompt: 'Respond in adaptive custom style based on user tone and language.',
        suggestions: ['Give a quick profile summary', 'How can we collaborate?', 'Explain your strongest skill']
    },
    investment: {
        label: 'Investment Offer',
        intro: 'Investment mode active. I will frame responses around traction, opportunity, risk, and growth plan.',
        prompt: 'Respond in investor-facing style with concise business and product clarity.',
        suggestions: ['Show investment thesis', 'What is the market opportunity?', 'How will capital be used?']
    },
    services: {
        label: 'Services',
        intro: 'Services mode active. Discuss delivery scope, timelines, pricing structure, and engagement model.',
        prompt: 'Respond in service-consultation style with practical execution clarity.',
        suggestions: ['What services are offered?', 'Estimated timeline?', 'Project engagement process?']
    },
    joinus: {
        label: 'Join Us',
        intro: 'Join Us mode active. Share your role preference and skills via chat or quick form.',
        prompt: 'Respond in recruitment style with role-fit and capability focus.',
        suggestions: ['Open roles details', 'Required skills?', 'How to apply quickly?']
    },
    feedback: {
        label: 'Feedback',
        intro: 'Feedback mode active. Share your experience; form and chat both are available.',
        prompt: 'Respond in feedback-assistant style: polite, structured, and appreciative.',
        suggestions: ['Share UX feedback', 'Report an issue', 'Suggest improvement']
    }
}

const detectInterests = (text) => {
    const source = String(text || '').toLowerCase()
    const tags = []
    if (/invest|fund|capital|valuation/.test(source)) tags.push('Investment')
    if (/service|project|delivery|client/.test(source)) tags.push('Services')
    if (/hire|join|career|role|job/.test(source)) tags.push('Join Us')
    if (/feedback|issue|bug|improve/.test(source)) tags.push('Feedback')
    if (/ai|stack|architecture|backend|frontend/.test(source)) tags.push('Tech')
    return tags
}

const createSession = (mode = 'interview') => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${CHAT_MODES[mode].label} Session`,
    mode,
    updatedAt: Date.now(),
    messages: [{ role: 'ai', text: CHAT_MODES[mode].intro }]
})

export default function AIArchitectureSection({ showInterview = true, showArchitecture = true }) {
    const [sessions, setSessions] = useState(() => {
        const cached = localStorage.getItem('saarkaar_chat_sessions_v1')
        if (!cached) return [createSession('interview')]
        try {
            const parsed = JSON.parse(cached)
            if (!Array.isArray(parsed) || parsed.length === 0) return [createSession('interview')]
            return parsed
        } catch {
            return [createSession('interview')]
        }
    })

    const [activeSessionId, setActiveSessionId] = useState(() => {
        const cached = localStorage.getItem('saarkaar_chat_active_session_v1')
        return cached || null
    })

    const [currentMode, setCurrentMode] = useState('interview')
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [liveTranscript, setLiveTranscript] = useState('')
    const [interestTags, setInterestTags] = useState(['Tech'])

    const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', rating: '5', message: '' })
    const [joinForm, setJoinForm] = useState({ name: '', email: '', role: '', skills: '' })

    const chatEndRef = useRef(null)
    const inputRef = useRef(null)
    const recognitionRef = useRef(null)

    const activeSession = useMemo(() => {
        const found = sessions.find((s) => s.id === activeSessionId)
        return found || sessions[0]
    }, [sessions, activeSessionId])

    const messages = activeSession?.messages || []

    useEffect(() => {
        if (!activeSessionId && sessions[0]) {
            setActiveSessionId(sessions[0].id)
        }
    }, [sessions, activeSessionId])

    useEffect(() => {
        if (activeSession?.mode) {
            setCurrentMode(activeSession.mode)
        }
    }, [activeSession])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading, liveTranscript])

    useEffect(() => {
        localStorage.setItem('saarkaar_chat_sessions_v1', JSON.stringify(sessions))
    }, [sessions])

    useEffect(() => {
        if (activeSessionId) {
            localStorage.setItem('saarkaar_chat_active_session_v1', activeSessionId)
        }
    }, [activeSessionId])

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => setIsListening(true)

        recognition.onresult = (event) => {
            let finalTranscript = ''
            let interimTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const tx = event.results[i][0].transcript
                if (event.results[i].isFinal) finalTranscript += tx
                else interimTranscript += tx
            }

            const spoken = (finalTranscript || interimTranscript).trim()
            setLiveTranscript(spoken)
            if (spoken) setInput(spoken)
        }

        recognition.onerror = () => {
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
            setLiveTranscript('')
        }

        recognitionRef.current = recognition

        return () => {
            recognitionRef.current = null
        }
    }, [])

    const updateActiveSession = (updater) => {
        setSessions((prev) => prev.map((session) => {
            if (session.id !== activeSession?.id) return session
            return typeof updater === 'function' ? updater(session) : updater
        }))
    }

    const addInterestFromText = (text) => {
        const next = detectInterests(text)
        if (!next.length) return
        setInterestTags((prev) => Array.from(new Set([...prev, ...next])).slice(-8))
    }

    const speakText = (text) => {
        if (!text) return
        const synth = window.speechSynthesis
        if (!synth) return
        synth.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 0.95
        utter.pitch = 1.0
        utter.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-US'
        synth.speak(utter)
    }

    const sendMessage = async (text) => {
        const msg = (text || input).trim()
        if (!msg || loading || !activeSession) return

        const userMsg = { role: 'user', text: msg }
        updateActiveSession((session) => {
            const isFirstUserMessage = !session.messages.some((m) => m.role === 'user')
            return {
                ...session,
                title: isFirstUserMessage ? msg.slice(0, 34) : session.title,
                updatedAt: Date.now(),
                mode: currentMode,
                messages: [...session.messages, userMsg]
            }
        })

        addInterestFromText(msg)
        setInput('')
        setLoading(true)

        try {
            const modeSpec = CHAT_MODES[currentMode]
            const history = (activeSession.messages || [])
                .filter((m) => m.role === 'user' || m.role === 'ai')
                .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))

            const response = await askFounderAI({
                message: `[Context Mode: ${modeSpec.label}] ${modeSpec.prompt}\n\nUser message: ${msg}`,
                history,
                language: 'auto',
            })

            const aiText = response?.response || 'System processed your query.'
            updateActiveSession((session) => ({
                ...session,
                updatedAt: Date.now(),
                messages: [...session.messages, { role: 'ai', text: aiText }]
            }))
            addInterestFromText(aiText)
            speakText(aiText)
        } catch {
            updateActiveSession((session) => ({
                ...session,
                updatedAt: Date.now(),
                messages: [...session.messages, {
                    role: 'ai',
                    text: "Neural Core temporarily offline. Please try again in a moment.",
                    error: true
                }]
            }))
        } finally {
            setLoading(false)
            setTimeout(() => inputRef.current?.focus(), 80)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage()
    }

    const switchMode = (mode) => {
        setCurrentMode(mode)
        updateActiveSession((session) => ({
            ...session,
            mode,
            updatedAt: Date.now(),
            messages: [...session.messages, { role: 'ai', text: CHAT_MODES[mode].intro }]
        }))
    }

    const startNewSession = () => {
        const session = createSession(currentMode)
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
    }

    const activateVoice = () => {
        if (!recognitionRef.current) return
        if (isListening) {
            recognitionRef.current.stop()
            return
        }
        setLiveTranscript('')
        recognitionRef.current.start()
    }

    const submitFeedbackForm = async (e) => {
        e.preventDefault()
        const payload = { ...feedbackForm }
        if (!payload.name || !payload.email || !payload.message) return

        updateActiveSession((session) => ({
            ...session,
            messages: [...session.messages, { role: 'user', text: `Feedback submitted by ${payload.name}: ${payload.message}` }],
            updatedAt: Date.now()
        }))

        try {
            await submitFeedback(payload)
            const ack = 'Feedback received. Thank you for helping us improve SAARKAAR.'
            updateActiveSession((session) => ({
                ...session,
                messages: [...session.messages, { role: 'ai', text: ack }],
                updatedAt: Date.now()
            }))
            speakText(ack)
            setFeedbackForm({ name: '', email: '', rating: '5', message: '' })
        } catch {
            updateActiveSession((session) => ({
                ...session,
                messages: [...session.messages, { role: 'ai', text: 'Feedback API unavailable right now. Your message is still noted in this session.', error: true }],
                updatedAt: Date.now()
            }))
        }
    }

    const submitJoinForm = async (e) => {
        e.preventDefault()
        const payload = { ...joinForm }
        if (!payload.name || !payload.email || !payload.role) return

        updateActiveSession((session) => ({
            ...session,
            messages: [...session.messages, { role: 'user', text: `Join request by ${payload.name} for ${payload.role}. Skills: ${payload.skills || 'not provided'}` }],
            updatedAt: Date.now()
        }))

        try {
            await joinTeam(payload)
            const ack = 'Join request submitted. Our team will review your profile and connect soon.'
            updateActiveSession((session) => ({
                ...session,
                messages: [...session.messages, { role: 'ai', text: ack }],
                updatedAt: Date.now()
            }))
            speakText(ack)
            setJoinForm({ name: '', email: '', role: '', skills: '' })
        } catch {
            updateActiveSession((session) => ({
                ...session,
                messages: [...session.messages, { role: 'ai', text: 'Join API is temporarily unavailable. You can still share details in chat.', error: true }],
                updatedAt: Date.now()
            }))
        }
    }

    const sessionList = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)
    const modeSuggestions = CHAT_MODES[currentMode]?.suggestions || []

    if (!showInterview && !showArchitecture) return null

    const sectionId = showInterview && showArchitecture
        ? 'ai-system'
        : showInterview
            ? 'founder-ai'
            : 'system-architecture'

    return (
        <section className="aia-section" id={sectionId}>

            {/* === AI CHAT INTERFACE === */}
            {showInterview && (
                <motion.div
                    className="aia-chat-workspace"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                <div className="aia-main-pane">
                    <div className="aia-chat-header">
                        <div className="aia-chat-header-left">
                            <div className="aia-status-dot"></div>
                            <div>
                                <h3>{CHAT_MODES[currentMode].label.toUpperCase()} · FOUNDER AI</h3>
                                <p>Aapka sawal, mera focus — chaliye idea ko real execution mein badalte hain.</p>
                            </div>
                        </div>
                        <div className="aia-status-box">
                            <div className="aia-status-line">
                                <span className="aia-status-label">STATUS</span>
                                <span className="aia-status-value">NEURAL_SYNC_ACTIVE</span>
                            </div>
                            <div className="aia-status-line">
                                <span className="aia-status-label">LATENCY</span>
                                <span className="aia-status-value">22ms</span>
                            </div>
                        </div>
                    </div>

                    <div className="aia-mode-bar">
                        {Object.entries(CHAT_MODES).map(([modeKey, config]) => (
                            <button
                                key={modeKey}
                                className={`aia-mode-chip ${currentMode === modeKey ? 'active' : ''}`}
                                onClick={() => switchMode(modeKey)}
                                disabled={loading}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>

                    <div className="aia-messages">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={`${activeSession?.id}-${i}`}
                                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.25 }}
                                    className={`aia-msg ${msg.role === 'user' ? 'aia-msg-user' : 'aia-msg-ai'} ${msg.error ? 'aia-msg-error' : ''}`}
                                >
                                    {msg.role === 'ai' && <div className="aia-msg-avatar">AI</div>}
                                    <div className="aia-msg-bubble">{msg.text}</div>
                                    {msg.role === 'user' && <div className="aia-msg-avatar aia-user-avatar">U</div>}
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div
                                    key="typing"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="aia-msg aia-msg-ai"
                                >
                                    <div className="aia-msg-avatar">AI</div>
                                    <div className="aia-typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                    </div>

                    <div className="aia-suggestions">
                        {modeSuggestions.map((q, i) => (
                            <button
                                key={`${currentMode}-${i}`}
                                className="aia-suggestion-chip"
                                onClick={() => sendMessage(q)}
                                disabled={loading}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {currentMode === 'feedback' && (
                        <form className="aia-inline-form" onSubmit={submitFeedbackForm}>
                            <input placeholder="Name" value={feedbackForm.name} onChange={(e) => setFeedbackForm((f) => ({ ...f, name: e.target.value }))} />
                            <input placeholder="Email" type="email" value={feedbackForm.email} onChange={(e) => setFeedbackForm((f) => ({ ...f, email: e.target.value }))} />
                            <input placeholder="Rating (1-5)" value={feedbackForm.rating} onChange={(e) => setFeedbackForm((f) => ({ ...f, rating: e.target.value }))} />
                            <textarea placeholder="Your detailed feedback" value={feedbackForm.message} onChange={(e) => setFeedbackForm((f) => ({ ...f, message: e.target.value }))} />
                            <button type="submit" disabled={loading}>Submit Feedback</button>
                        </form>
                    )}

                    {currentMode === 'joinus' && (
                        <form className="aia-inline-form" onSubmit={submitJoinForm}>
                            <input placeholder="Name" value={joinForm.name} onChange={(e) => setJoinForm((f) => ({ ...f, name: e.target.value }))} />
                            <input placeholder="Email" type="email" value={joinForm.email} onChange={(e) => setJoinForm((f) => ({ ...f, email: e.target.value }))} />
                            <input placeholder="Role applying for" value={joinForm.role} onChange={(e) => setJoinForm((f) => ({ ...f, role: e.target.value }))} />
                            <textarea placeholder="Skills / experience" value={joinForm.skills} onChange={(e) => setJoinForm((f) => ({ ...f, skills: e.target.value }))} />
                            <button type="submit" disabled={loading}>Submit Join Request</button>
                        </form>
                    )}

                    <div className="aia-input-console">
                        <div className={`aia-input-wrapper ${isListening ? 'listening-glow' : ''}`}>
                            <button
                                type="button"
                                className={`aia-mic-btn-compact ${isListening ? 'active' : ''}`}
                                onClick={activateVoice}
                                title={isListening ? 'Stop voice input' : 'Start voice input'}
                            >
                                {isListening ? '⏹️' : '🎙️'}
                            </button>

                            <textarea
                                ref={inputRef}
                                className="aia-textarea-input"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder={isListening ? 'Listening to your frequency...' : `Access ${CHAT_MODES[currentMode].label} core...`}
                                disabled={loading}
                                rows={1}
                            />

                            <button
                                onClick={() => sendMessage()}
                                className="aia-action-btn"
                                disabled={loading || !input.trim()}
                            >
                                {loading ? (
                                    <div className="aia-btn-loader"></div>
                                ) : (
                                    <span className="aia-send-icon">▲</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {liveTranscript && <div className="aia-live-transcript">🎧 {liveTranscript}</div>}


                </div>

                <aside className="aia-side-pane">
                    <div className="aia-profile-card">
                        <div className="aia-brand-inline">
                            <BrandLogo size="sm" />
                        </div>
                        <h4>User Workspace</h4>
                        <p>Mode: <strong>{CHAT_MODES[currentMode].label}</strong></p>
                        <div className="aia-interest-wrap">
                            {interestTags.map((tag) => <span key={tag} className="aia-interest-chip">{tag}</span>)}
                        </div>
                    </div>

                    <div className="aia-session-card">
                        <div className="aia-session-head">
                            <h4>Chat Sessions</h4>
                            <button onClick={startNewSession}>+ New</button>
                        </div>

                        <div className="aia-session-list">
                            {sessionList.map((session) => (
                                <button
                                    key={session.id}
                                    className={`aia-session-item ${session.id === activeSession?.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveSessionId(session.id)
                                        setCurrentMode(session.mode || 'interview')
                                    }}
                                >
                                    <span className="aia-session-title">{session.title}</span>
                                    <span className="aia-session-meta">{CHAT_MODES[session.mode || 'interview'].label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
                </motion.div>
            )}

            {/* === HEADER === */}
            {showArchitecture && (
                <>
                    <div className="aia-header">
                        <span className="aia-label">NEURAL INTERFACE</span>
                        <h2 className="aia-title">SYSTEM <span>ARCHITECTURE</span></h2>
                    </div>

                    {/* === ARCHITECTURE NODES === */}
                    <div className="aia-arch-diagram">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="aia-arch-node aia-node-teal"
                        >
                            <div className="aia-node-icon">⚡</div>
                            <h4>FRONTEND</h4>
                            <span className="aia-node-pill">React + Three.js</span>
                            <p>Immersive UI Layer</p>
                        </motion.div>

                        <div className="aia-arch-arrow">→</div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="aia-arch-node aia-node-gold"
                        >
                            <div className="aia-node-icon">⚙️</div>
                            <h4>BACKEND CORE</h4>
                            <span className="aia-node-pill aia-pill-gold">FastAPI (Python)</span>
                            <p>Logic & Processing</p>
                        </motion.div>

                        <div className="aia-arch-arrow">→</div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="aia-arch-node aia-node-red"
                        >
                            <div className="aia-node-icon">🧠</div>
                            <h4>AI ENGINE</h4>
                            <span className="aia-node-pill aia-pill-red">OpenAI GPT-4o</span>
                            <p>Neural Intelligence</p>
                        </motion.div>
                    </div>
                </>
            )}

        </section >
    )
}
